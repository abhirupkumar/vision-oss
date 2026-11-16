#!/usr/bin/env tsx
/**
 * clear-tinybird.ts
 *
 * Truncates all Tinybird datasource tables without deleting the tables.
 * Uses the Tinybird Datasource Truncate API:
 *   POST /v0/datasources/{name}/truncate
 *
 * Usage:
 *   pnpm tsx scripts/clear-tinybird.ts
 *   pnpm tsx scripts/clear-tinybird.ts --dry-run
 */

import 'dotenv/config';

const TABLES = [
  'project_event',
  'event_data',
  'visitor_data',
  'project_event_stats_hourly',
  'project_revenue',
  'session_replay',
];

async function main() {
  const url = process.env.TINYBIRD_URL?.replace(/\/$/, '');
  const token = process.env.TINYBIRD_TOKEN;
  const dryRun = process.argv.includes('--dry-run');

  if (!url || !token) {
    console.error('❌  TINYBIRD_URL and TINYBIRD_TOKEN must be set in your .env file.');
    process.exit(1);
  }

  console.log('\nTinybird Table Clear');
  console.log('─'.repeat(40));
  console.log(`Host : ${url}`);
  console.log(`Mode : ${dryRun ? 'DRY RUN (no changes)' : 'LIVE'}`);
  console.log(`Tables: ${TABLES.join(', ')}`);
  console.log('─'.repeat(40) + '\n');

  let success = 0;
  let failed = 0;

  for (const table of TABLES) {
    if (dryRun) {
      console.log(`  [dry-run] Would truncate: ${table}`);
      success++;
      continue;
    }

    process.stdout.write(`  Truncating ${table}...`);

    try {
      const res = await fetch(`${url}/v0/datasources/${encodeURIComponent(table)}/truncate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.text();
        process.stdout.write(` ❌\n`);
        console.error(`    Error ${res.status}: ${body}`);
        failed++;
      } else {
        process.stdout.write(` ✅\n`);
        success++;
      }
    } catch (err: any) {
      process.stdout.write(` ❌\n`);
      console.error(`    Network error: ${err.message}`);
      failed++;
    }
  }

  console.log('\n' + '─'.repeat(40));
  console.log(`Done. ${success} truncated, ${failed} failed.`);
  console.log('─'.repeat(40) + '\n');

  if (failed > 0) process.exit(1);
}

main();
