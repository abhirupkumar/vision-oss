import { createClient } from '@clickhouse/client-web';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

async function main() {
  const CLICKHOUSE_URL = process.env.CLICKHOUSE_URL;
  if (!CLICKHOUSE_URL) {
    console.error('CLICKHOUSE_URL is not set');
    process.exit(1);
  }

  const { hostname, port, pathname, protocol, username = 'default', password } = new URL(CLICKHOUSE_URL);
  const safeProtocol = protocol.includes('http') ? protocol : (port === '8443' || port === '443' ? 'https:' : 'http:');
  const finalUrl = `${safeProtocol}//${hostname}:${port}`;
  const database = pathname.replace('/', '') || 'default';

  console.log(`Connecting to ClickHouse at ${finalUrl} (database: ${database})`);

  const client = createClient({ url: finalUrl, database, username, password });

  const sql = `
    CREATE TABLE IF NOT EXISTS push_subscription (
      id            String,
      user_id       String,
      project_id    String DEFAULT '',
      endpoint      String,
      p256dh        String,
      auth          String,
      created_at    DateTime64(3, 'UTC')
    ) ENGINE = ReplacingMergeTree()
    ORDER BY (endpoint)
  `.trim();

  console.log('Creating push_subscription table...');
  console.log(sql);

  await client.command({ query: sql });
  console.log('✓ push_subscription table created (or already exists)');

  await client.close();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
