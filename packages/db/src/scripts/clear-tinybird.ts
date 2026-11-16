#!/usr/bin/env tsx
/**
 * clear-tinybird.ts
 *
 * Dynamically fetches and clears all Tinybird pipes and datasources.
 *
 * Modes:
 *   --drop      (Default) Permanently deletes all pipes and datasources from Tinybird.
 *   --truncate  Keeps pipes and datasource schemas, but clears (truncates) all rows.
 *   --dry-run   Simulates the operation without deleting or truncating anything.
 *
 * Usage:
 *   pnpm tinybird:clear               # Drops all pipes then drops all datasources
 *   pnpm tinybird:clear --truncate    # Empties all datasources without deleting them
 *   pnpm tinybird:clear --dry-run     # Shows what would be deleted
 */

import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from possible locations
const envPaths = [
  resolve(process.cwd(), '.env'),
  resolve(__dirname, '../../../../.env'),
  resolve(__dirname, '../../tinybird/.env.local'),
  resolve(__dirname, '../../../tinybird/.env.local'),
];

for (const p of envPaths) {
  if (existsSync(p)) {
    dotenv.config({ path: p, override: false });
  }
}

// Fallback to tinybird.config.json if TINYBIRD_URL is still missing
let configBaseUrl = '';
const configPath = resolve(__dirname, '../../tinybird/tinybird.config.json');
if (existsSync(configPath)) {
  try {
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    configBaseUrl = config.baseUrl || '';
  } catch {
    // Ignore JSON parse error
  }
}

const url = (process.env.TINYBIRD_URL || configBaseUrl || 'https://api.tinybird.co').replace(/\/$/, '');
const token = process.env.TINYBIRD_TOKEN;

const args = process.argv.slice(2);
const isTruncate = args.includes('--truncate');
const isDryRun = args.includes('--dry-run');
const mode = isTruncate ? 'TRUNCATE (Empty rows, keep schemas)' : 'DROP (Delete all pipes & datasources)';

async function main() {
  if (!token) {
    console.error('\n❌ TINYBIRD_TOKEN is missing. Please set it in .env or packages/db/tinybird/.env.local\n');
    process.exit(1);
  }

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  console.log('\n==========================================');
  console.log('       Tinybird Workspace Cleaner         ');
  console.log('==========================================');
  console.log(`Endpoint : ${url}`);
  console.log(`Mode     : ${isDryRun ? '[DRY RUN] ' + mode : mode}`);
  console.log('==========================================\n');

  try {
    // 1. Fetch all pipes
    process.stdout.write('🔍 Fetching pipes... ');
    const pipesRes = await fetch(`${url}/v0/pipes`, { headers });
    if (!pipesRes.ok) {
      throw new Error(`Failed to fetch pipes (${pipesRes.status}): ${await pipesRes.text()}`);
    }
    const pipesData = (await pipesRes.json()) as { pipes?: { name: string }[] };
    const pipes: string[] = (pipesData.pipes || []).map((p) => p.name);
    console.log(`Found ${pipes.length} pipe(s)`);

    // 2. Fetch all datasources
    process.stdout.write('🔍 Fetching datasources... ');
    const dsRes = await fetch(`${url}/v0/datasources`, { headers });
    if (!dsRes.ok) {
      throw new Error(`Failed to fetch datasources (${dsRes.status}): ${await dsRes.text()}`);
    }
    const dsData = (await dsRes.json()) as { datasources?: { name: string }[] };
    const datasources: string[] = (dsData.datasources || []).map((d) => d.name);
    console.log(`Found ${datasources.length} datasource(s)\n`);

    if (pipes.length === 0 && datasources.length === 0) {
      console.log('✨ Workspace is already empty. Nothing to clean.\n');
      return;
    }

    let pipeSuccess = 0;
    let pipeFailed = 0;
    let dsSuccess = 0;
    let dsFailed = 0;

    // --- MODE 1: TRUNCATE ---
    if (isTruncate) {
      console.log('--- Truncating Datasources ---');
      for (const ds of datasources) {
        if (isDryRun) {
          console.log(`  [dry-run] Would truncate: ${ds}`);
          dsSuccess++;
          continue;
        }

        process.stdout.write(`  ⏳ Truncating ${ds}...`);
        const res = await fetch(`${url}/v0/datasources/${encodeURIComponent(ds)}/truncate`, {
          method: 'POST',
          headers,
        });

        if (res.ok) {
          console.log(' ✅');
          dsSuccess++;
        } else {
          console.log(` ❌ (${res.status})`);
          console.error(`     Error: ${await res.text()}`);
          dsFailed++;
        }
      }
    } else {
      // --- MODE 2: DROP (Pipes first, then datasources) ---
      if (pipes.length > 0) {
        console.log('--- Deleting Pipes ---');
        for (const pipe of pipes) {
          if (isDryRun) {
            console.log(`  [dry-run] Would delete pipe: ${pipe}`);
            pipeSuccess++;
            continue;
          }

          process.stdout.write(`  ⏳ Deleting pipe ${pipe}...`);
          const res = await fetch(`${url}/v0/pipes/${encodeURIComponent(pipe)}`, {
            method: 'DELETE',
            headers,
          });

          if (res.ok || res.status === 204 || res.status === 404) {
            console.log(' ✅');
            pipeSuccess++;
          } else {
            console.log(` ❌ (${res.status})`);
            console.error(`     Error: ${await res.text()}`);
            pipeFailed++;
          }
        }
        console.log();
      }

      if (datasources.length > 0) {
        console.log('--- Deleting Datasources ---');
        for (const ds of datasources) {
          if (isDryRun) {
            console.log(`  [dry-run] Would delete datasource: ${ds}`);
            dsSuccess++;
            continue;
          }

          process.stdout.write(`  ⏳ Deleting datasource ${ds}...`);
          const res = await fetch(`${url}/v0/datasources/${encodeURIComponent(ds)}`, {
            method: 'DELETE',
            headers,
          });

          if (res.ok || res.status === 204 || res.status === 404) {
            console.log(' ✅');
            dsSuccess++;
          } else {
            console.log(` ❌ (${res.status})`);
            console.error(`     Error: ${await res.text()}`);
            dsFailed++;
          }
        }
      }
    }

    console.log('\n==========================================');
    console.log('                 Summary                  ');
    console.log('==========================================');
    if (!isTruncate) {
      console.log(`Pipes       : ${pipeSuccess} deleted, ${pipeFailed} failed`);
      console.log(`Datasources : ${dsSuccess} deleted, ${dsFailed} failed`);
      if (pipeFailed > 0 || dsFailed > 0) {
        console.log('\n💡 Note: Your Tinybird workspace has Git Integration / Branch Protection enabled.');
        console.log('   In this mode, Tinybird prevents deleting/modifying schemas via API tokens.');
        console.log('   - To empty all data without deleting schemas, run:');
        console.log('       pnpm tinybird:clear --truncate');
        console.log('   - To delete pipes/datasources permanently:');
        console.log('       Remove their .pipe/.datasource files from packages/db/tinybird and git push,');
        console.log('       or delete them directly in the Tinybird Web UI.');
      }
    } else {
      console.log(`Datasources : ${dsSuccess} truncated, ${dsFailed} failed`);
    }
    console.log('==========================================\n');

    if (pipeFailed > 0 || dsFailed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error(`\n❌ Error: ${err.message}\n`);
    process.exit(1);
  }
}

main();
