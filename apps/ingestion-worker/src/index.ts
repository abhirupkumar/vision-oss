import * as dotenv from 'dotenv';
import { clickhouse, tinybird } from '@vision/db';
import * as http from 'http';

dotenv.config();

const analyticsDb = tinybird.enabled ? tinybird : clickhouse;

const TABLE_MAP: Record<string, string> = {
  event: 'project_event',
  event_data: 'event_data',
  project_revenue: 'project_revenue',
  session_replay: 'session_replay',
  visitor_data: 'visitor_data',
};

const TOPICS = ['event', 'event_data', 'project_revenue', 'session_replay', 'visitor_data'];

const GROUP_ID = 'vision-ingestion-group';
const CONSUMER_INSTANCE = 'vision-consumer-1';
const FLUSH_INTERVAL_MS = 5000;

// Session must be longer than poll interval + processing time.
// Aiven Kafka default max is 300000ms. We use 30s to be safe.
const SESSION_TIMEOUT_MS = 30000;
const HEARTBEAT_INTERVAL_MS = 3000;
const MAX_POLL_INTERVAL_MS = 25000;

const rawKafkaRestUrl = process.env.KAFKA_REST_URL || '';
const parsedUrl = rawKafkaRestUrl ? new URL(rawKafkaRestUrl) : null;
const USERNAME = process.env.KAFKA_USERNAME || parsedUrl?.username || '';
const PASSWORD = process.env.KAFKA_PASSWORD || parsedUrl?.password || '';

if (parsedUrl) {
  parsedUrl.username = '';
  parsedUrl.password = '';
}
const KAFKA_REST_URL = parsedUrl ? parsedUrl.toString().replace(/\/$/, '') : '';
const AUTH = `Basic ${Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64')}`;

const CONTENT_TYPE_V2 = 'application/vnd.kafka.v2+json';
const ACCEPT_JSON_V2 = 'application/vnd.kafka.json.v2+json';

// Track whether the consumer instance is healthy
let consumerReady = false;

async function apiRequest(path: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(`${KAFKA_REST_URL}${path}`, {
    ...options,
    headers: {
      Authorization: AUTH,
      'Content-Type': CONTENT_TYPE_V2,
      ...(options.method === 'GET' ? { Accept: ACCEPT_JSON_V2 } : {}),
      ...(options.headers as any),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`REST API error ${res.status} on ${path}: ${body}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function setupConsumer() {
  console.log('[IngestionWorker] Creating consumer instance...');
  consumerReady = false;

  // Delete existing instance first to avoid conflicts on restart
  try {
    await apiRequest(`/consumers/${GROUP_ID}/instances/${CONSUMER_INSTANCE}`, { method: 'DELETE' });
    console.log('[IngestionWorker] Cleaned up previous consumer instance.');
  } catch (_) {
    // Fine if it didn't exist yet
  }

  // Create consumer with explicit session/heartbeat timeouts so the broker
  // doesn't evict the consumer between our 5-second poll intervals.
  await apiRequest(`/consumers/${GROUP_ID}`, {
    method: 'POST',
    body: JSON.stringify({
      name: CONSUMER_INSTANCE,
      format: 'json',
      'auto.offset.reset': 'latest',
      'enable.auto.commit': false,
      'session.timeout.ms': SESSION_TIMEOUT_MS,
      'heartbeat.interval.ms': HEARTBEAT_INTERVAL_MS,
      'max.poll.interval.ms': MAX_POLL_INTERVAL_MS,
      'consumer.request.timeout.ms': 11000,
    }),
  });

  // Subscribe to all topics
  await apiRequest(`/consumers/${GROUP_ID}/instances/${CONSUMER_INSTANCE}/subscription`, {
    method: 'POST',
    body: JSON.stringify({ topics: TOPICS }),
  });

  consumerReady = true;
  console.log(`[IngestionWorker] Subscribed to topics: ${TOPICS.join(', ')}`);
}

async function fetchAndInsert() {
  if (!consumerReady) return;

  let records: any[] = [];

  try {
    records = await apiRequest(
      `/consumers/${GROUP_ID}/instances/${CONSUMER_INSTANCE}/records?timeout=1000&max_bytes=10485760`,
      { method: 'GET' },
    );
  } catch (err: any) {
    const msg = err?.message || '';

    // Error 404 = consumer instance was evicted by broker (session expired).
    // Error 500 with UnknownError (-1) = broker lost the consumer session.
    // Both are recoverable — recreate the consumer automatically.
    if (msg.includes('404') || msg.includes('UnknownError') || msg.includes('40403')) {
      console.warn('[IngestionWorker] Consumer session lost, recreating consumer instance...');
      await setupConsumer().catch(e =>
        console.error('[IngestionWorker] Failed to recreate consumer:', e),
      );
    } else {
      console.error('[IngestionWorker] Failed to fetch records:', err);
    }
    return;
  }

  if (!records || records.length === 0) return;

  // Group records by topic
  const grouped: Record<string, any[]> = {};
  for (const record of records) {
    if (!grouped[record.topic]) grouped[record.topic] = [];
    grouped[record.topic].push(record.value);
  }

  // Insert each group into ClickHouse/Tinybird
  for (const [topic, rows] of Object.entries(grouped)) {
    const tableName = TABLE_MAP[topic];
    if (!tableName) continue;

    try {
      await analyticsDb.insert(tableName, rows);
      console.log(`[IngestionWorker] Inserted ${rows.length} rows into [${tableName}]`);
    } catch (err) {
      console.error(`[IngestionWorker] Insert failed for [${tableName}]:`, err);
      return; // Don't commit if insert failed
    }
  }

  // Commit offsets after successful insert
  try {
    await apiRequest(`/consumers/${GROUP_ID}/instances/${CONSUMER_INSTANCE}/offsets`, {
      method: 'POST',
      body: JSON.stringify({
        offsets: records.map(r => ({
          topic: r.topic,
          partition: r.partition,
          offset: r.offset,
        })),
      }),
    });
  } catch (err) {
    console.error('[IngestionWorker] Failed to commit offsets:', err);
  }
}

async function startWorker() {
  const port = process.env.PORT || 8080;
  const server = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK');
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(port, () => {
    console.log(`[IngestionWorker] HTTP server listening on port ${port} for wake pings`);
  });

  if (process.env.INGESTION_WORKER_ENABLED === 'false') {
    console.log('[IngestionWorker] Worker disabled via INGESTION_WORKER_ENABLED=false (Tinybird native Kafka connector active). Polling suspended.');
    return;
  }

  console.log('[IngestionWorker] Starting Kafka REST Ingestion Worker...');

  if (!KAFKA_REST_URL || !USERNAME || !PASSWORD) {
    console.error('[IngestionWorker] Missing required env vars: KAFKA_REST_URL, KAFKA_USERNAME, KAFKA_PASSWORD');
    process.exit(1);
  }

  await setupConsumer();

  console.log(`[IngestionWorker] Polling every ${FLUSH_INTERVAL_MS}ms...`);
  setInterval(fetchAndInsert, FLUSH_INTERVAL_MS);
}

startWorker().catch(console.error);
