import { createClient } from '@clickhouse/client-web';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root and working directory
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  const CLICKHOUSE_URL = process.env.CLICKHOUSE_URL;
  if (!CLICKHOUSE_URL) {
    console.error('CLICKHOUSE_URL is not defined in the environment variables.');
    process.exit(1);
  }

  const { hostname, port, pathname, protocol, username = 'default', password } = new URL(CLICKHOUSE_URL);
  const safeProtocol = protocol.includes('http') ? protocol : (port === '8443' || port === '443' ? 'https:' : 'http:');
  const portStr = port ? `:${port}` : '';
  const finalUrl = `${safeProtocol}//${hostname}${portStr}`;
  const database = pathname.replace('/', '') || 'default';

  console.log(`Connecting to ClickHouse at ${finalUrl} (database: ${database})`);

  const client = createClient({
    url: finalUrl,
    database,
    username,
    password,
  });

  const datasourcesDir = path.resolve(__dirname, '../../tinybird/datasources');
  const files = fs.readdirSync(datasourcesDir).filter(f => f.endsWith('.datasource'));

  for (const file of files) {
    const filePath = path.join(datasourcesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Parse Tinybird schema
    const tableName = file.replace('.datasource', '');
    
    // Extract everything between "SCHEMA >" and either "FORWARD_QUERY", "ENGINE", or "KAFKA_"
    const schemaMatch = content.match(/SCHEMA\s*>([\s\S]*?)(?:FORWARD_QUERY|ENGINE|KAFKA_)/i);
    if (!schemaMatch) continue;
    
    // Clean up Tinybird specific annotations like `json:$.xxx` and DEFAULT expressions that might contain them
    let columnsDef = schemaMatch[1]
      .split(',')
      .map(line => line.replace(/`json:\$\.[^`]+`/g, ''))
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join(',\n    ');
      
    // Extract ENGINE properties
    const engineMatch = content.match(/ENGINE\s+"([^"]+)"/i);
    const partitionMatch = content.match(/ENGINE_PARTITION_KEY\s+"([^"]+)"/i);
    const sortingMatch = content.match(/ENGINE_SORTING_KEY\s+"([^"]+)"/i);
    const ttlMatch = content.match(/ENGINE_TTL\s+"([^"]+)"/i);

    const engine = engineMatch ? engineMatch[1] : 'MergeTree';
    const partition = partitionMatch ? `PARTITION BY ${partitionMatch[1]}` : '';
    const sorting = sortingMatch ? `ORDER BY (${sortingMatch[1]})` : 'ORDER BY tuple()';
    const ttl = ttlMatch ? `TTL ${ttlMatch[1]}` : '';

    const sql = `
CREATE TABLE IF NOT EXISTS ${tableName} (
    ${columnsDef}
) ENGINE = ${engine}()
${partition}
${sorting}
${ttl}
    `.trim();

    console.log(`\nCreating table: ${tableName}`);
    console.log(sql);
    
    try {
      await client.command({ query: sql });
      console.log(`✅ Table ${tableName} created successfully`);
    } catch (e) {
      console.error(`❌ Failed to create table ${tableName}:`, e);
    }
  }
  
  // Now process .pipe files to create Materialized Views
  const pipesDir = path.resolve(__dirname, '../../tinybird/pipes');
  if (fs.existsSync(pipesDir)) {
    const pipeFiles = fs.readdirSync(pipesDir).filter(f => f.endsWith('.pipe'));

    for (const file of pipeFiles) {
      const filePath = path.join(pipesDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Only process materialized views
      if (!content.match(/TYPE\s+materialized/i)) continue;

      const nodeMatch = content.match(/NODE\s+([^\s]+)/i);
      const targetMatch = content.match(/DATASOURCE\s+([^\s]+)/i);
      const sqlMatch = content.match(/SQL\s*>([\s\S]*?)TYPE\s+materialized/i);

      if (nodeMatch && targetMatch && sqlMatch) {
        const mvName = nodeMatch[1];
        const targetTable = targetMatch[1];
        const sqlQuery = sqlMatch[1].trim();

        const sql = `
CREATE MATERIALIZED VIEW IF NOT EXISTS ${mvName}
TO ${targetTable}
AS
${sqlQuery}
        `.trim();

        console.log(`\nCreating materialized view: ${mvName} -> ${targetTable}`);
        console.log(sql);
        
        try {
          await client.command({ query: sql });
          console.log(`✅ Materialized view ${mvName} created successfully`);
        } catch (e) {
          console.error(`❌ Failed to create materialized view ${mvName}:`, e);
        }
      }
    }
  }

  console.log('\nAll tables and materialized views processed.');
  process.exit(0);
}

main().catch(console.error);
