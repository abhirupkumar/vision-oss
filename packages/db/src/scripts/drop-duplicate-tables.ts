#!/usr/bin/env tsx
/**
 * drop-duplicate-tables.ts
 *
 * Drops duplicate analytics, visitor, revenue, and replay tables from PostgreSQL:
 *   - project_event
 *   - event_data
 *   - visitor
 *   - visitor_data
 *   - llm_event
 *   - error_event
 *   - revenue
 *   - payment_event
 *   - session_replay
 *   - session_replay_saved
 *
 * All of this telemetry and time-series data lives exclusively in Tinybird / ClickHouse.
 * Only relational configuration and multi-tenant business state remain in PostgreSQL.
 *
 * Usage:
 *   pnpm --filter @vision/db db:drop-analytics-tables
 */

import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env files
const envPaths = [
  resolve(process.cwd(), '.env'),
  resolve(__dirname, '../../../../.env'),
];

for (const p of envPaths) {
  if (existsSync(p)) {
    dotenv.config({ path: p, override: false });
  }
}

const TABLES_TO_DROP = [
  'event_data',
  'project_event',
  'visitor_data',
  'visitor',
  'revenue',
  'payment_event',
  'llm_event',
  'error_event',
  'session_replay',
  'session_replay_saved',
];

const EXPECTED_RETAINED_TABLES = [
  '_IntegrationToNotificationRule',
  'ab_test',
  'ab_test_session',
  'ab_test_variant',
  'client',
  'error_group',
  'integrations',
  'invite',
  'link',
  'member',
  'notification_rules',
  'notifications',
  'organization',
  'payment_connection',
  'pixel',
  'project',
  'project_access',
  'report',
  'segment',
  'share',
  'user',
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not defined in environment');
    process.exit(1);
  }

  console.log('---------------------------------------------------------');
  console.log('   Dropping Duplicate Analytics Tables from PostgreSQL   ');
  console.log('---------------------------------------------------------');

  const sql = postgres(databaseUrl, {
    max: 1,
    ssl: databaseUrl.includes('neon.tech') ? 'require' : undefined,
  });

  try {
    // 1. Get initial tables
    const initialTablesResult = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    const initialTables = initialTablesResult.map(r => r.table_name);
    console.log(`Found ${initialTables.length} tables in PostgreSQL public schema:`);
    console.log(initialTables.join(', '));
    console.log('');

    const tablesPresentToDrop = TABLES_TO_DROP.filter(t => initialTables.includes(t));
    if (tablesPresentToDrop.length === 0) {
      console.log('ℹ️ None of the 10 target tables exist in PostgreSQL.');
    } else {
      console.log(`🗑️ Dropping ${tablesPresentToDrop.length} duplicate tables with CASCADE:`);
      for (const t of tablesPresentToDrop) {
        console.log(`  - Dropping table "${t}"...`);
        await sql.unsafe(`DROP TABLE IF EXISTS "${t}" CASCADE;`);
      }
      console.log('✅ Tables dropped successfully.');
    }

    // Also drop ErrorLevel enum if it exists and is unused
    try {
      await sql.unsafe(`DROP TYPE IF EXISTS "ErrorLevel";`);
      console.log('✅ Dropped unused ErrorLevel enum.');
    } catch {
      // ignore
    }

    // 2. Verify remaining tables
    const remainingTablesResult = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    const remainingTables = remainingTablesResult.map(r => r.table_name);

    console.log('\n---------------------------------------------------------');
    console.log(`Remaining tables in PostgreSQL (${remainingTables.length}):`);
    console.log(remainingTables.join(', '));
    console.log('---------------------------------------------------------');

    const anyDroppedStillPresent = TABLES_TO_DROP.filter(t => remainingTables.includes(t));
    if (anyDroppedStillPresent.length > 0) {
      console.error(`❌ Error: some tables are still present: ${anyDroppedStillPresent.join(', ')}`);
      process.exit(1);
    }

    console.log('✅ All 10 duplicate tables are confirmed removed.');
    console.log(`✅ ${remainingTables.length} relational tables preserved.`);
  } catch (err) {
    console.error('❌ Failed to drop duplicate tables:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
