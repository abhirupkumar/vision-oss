/**
 * Kafka client using the Kafka REST Proxy (HTTP-based).
 *
 * KafkaJS uses raw TCP sockets which are not supported in Cloudflare Workers.
 * Instead, we use the Aiven Kafka REST Proxy which exposes an HTTP API,
 * fully compatible with CF Workers' fetch().
 *
 * Required env vars:
 *   KAFKA_REST_URL  - Full URL to the Kafka REST Proxy including credentials,
 *                     e.g. https://user:password@kafka-rest-proxy.example.aivencloud.com:443
 *   KAFKA_PRESENT    - Still used as a presence flag to enable Kafka path.
 *                     (Not used for connection — REST proxy handles brokering.)
 *
 * Topic Architecture (5 topics, 1 Aiven Kafka service):
 *   events      ← project_event, llm_events   (multiplexed via stream_type)
 *   properties  ← event_data, visitor_data     (multiplexed via stream_type)
 *   telemetry   ← project_error               (1:1)
 *   business    ← project_revenue             (1:1)
 *   replays     ← session_replay              (1:1)
 *
 * The stream_type field is automatically injected into every message
 * so Tinybird materialized view pipes can fan out multiplexed topics.
 */

import debug from 'debug';
import { KAFKA } from './routing.js';

const log = debug('vision:kafka');

/**
 * Maps logical stream names (used in sendMessage calls) to physical Kafka topic names.
 */
const STREAM_TO_TOPIC: Record<string, string> = {
  project_event: 'events',
  llm_events: 'events',
  event_data: 'properties',
  visitor_data: 'properties',
  project_error: 'telemetry',
  ab_test_session: 'telemetry',
  ab_test_conversion: 'telemetry',
  feature_flag_evaluation: 'telemetry',
  project_revenue: 'business',
  session_replay: 'replays',
};

function parseRestUrl(rawUrl?: string): { baseUrl: string; headers: Record<string, string> } | null {
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl);
    const username = decodeURIComponent(url.username);
    const password = decodeURIComponent(url.password);

    // Strip credentials from URL for the base URL
    url.username = '';
    url.password = '';
    const baseUrl = url.toString().replace(/\/$/, '');

    const headers: Record<string, string> = {
      'Content-Type': 'application/vnd.kafka.json.v2+json',
      'Accept': 'application/vnd.kafka.v2+json',
    };

    if (username && password) {
      headers['Authorization'] = `Basic ${btoa(`${username}:${password}`)}`;
    }

    return { baseUrl, headers };
  } catch {
    return null;
  }
}

/**
 * sendMessage routes a logical stream to its physical Kafka topic and
 * automatically injects `stream_type` into the payload for Tinybird demultiplexing.
 *
 * @param streamName - Logical stream name (e.g. 'project_event', 'llm_events').
 *                     This becomes the `stream_type` field in the message.
 * @param message    - Payload or array of payloads to send.
 */
async function sendMessage(
  streamName: string,
  message: Record<string, unknown> | Record<string, unknown>[],
): Promise<void> {
  const rawUrl = process.env.KAFKA_REST_URL;
  const config = parseRestUrl(rawUrl);
  if (!config) {
    log('Kafka REST not configured, skipping sendMessage for stream %s', streamName);
    return;
  }

  const topic = STREAM_TO_TOPIC[streamName] ?? streamName;
  const messages = Array.isArray(message) ? message : [message];

  // Inject stream_type so Tinybird routing pipes can fan-out multiplexed topics
  const records = messages.map(value => ({ value: { stream_type: streamName, ...value } }));

  try {
    const response = await fetch(`${config.baseUrl}/topics/${encodeURIComponent(topic)}`, {
      method: 'POST',
      headers: config.headers,
      body: JSON.stringify({ records }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[Kafka REST] Failed to send stream "${streamName}" to topic "${topic}" (${response.status}): ${text}`);
    } else {
      log('Kafka REST: sent %d message(s) — stream=%s topic=%s', records.length, streamName, topic);
    }
  } catch (e) {
    console.error('[Kafka REST] sendMessage error:', e);
  }
}

async function connect() {
  // No persistent connection needed — REST proxy is stateless HTTP.
  log('Kafka REST: connect() called (no-op for REST proxy)');
}

export default {
  get enabled() {
    return Boolean((process.env.KAFKA_REST_URL) && process.env.KAFKA_PRESENT);
  },
  log,
  connect,
  sendMessage,
};
