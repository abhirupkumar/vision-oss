#!/usr/bin/env tsx
/**
 * migrate-visitors-to-tinybird.ts
 *
 * Migrates existing visitor profiles and visitor traits from PostgreSQL into Tinybird's
 * `visitor_data` datasource.
 *
 * Drops PostgreSQL foreign key constraints on `visitor_id`:
 *   - project_event_visitor_fkey
 *   - visitor_data_visitor_fkey
 *   - revenue_visitor_fkey
 *
 * Modes:
 *   --dry-run   Simulates migration and prints counts without writing to Tinybird or mutating PostgreSQL.
 *   --truncate  Clears (truncates) PostgreSQL `visitor` and `visitor_data` tables after migration.
 *
 * Usage:
 *   pnpm --filter @vision/db migrate:visitors
 *   pnpm --filter @vision/db migrate:visitors --dry-run
 *   pnpm --filter @vision/db migrate:visitors --truncate
 */

import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env files
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

// Fallback to tinybird.config.json if TINYBIRD_URL is missing
let configBaseUrl = '';
const configPath = resolve(__dirname, '../../tinybird/tinybird.config.json');
if (existsSync(configPath)) {
  try {
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    configBaseUrl = config.baseUrl || '';
  } catch {
    // Ignore parse error
  }
}

const dbUrl = process.env.DATABASE_URL;
const tinybirdUrl = (process.env.TINYBIRD_URL || configBaseUrl || 'https://api.tinybird.co').replace(/\/$/, '');
const tinybirdToken = process.env.TINYBIRD_TOKEN;

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const shouldTruncate = args.includes('--truncate');

function getUTCString(date: Date | string | number | null | undefined): string {
  if (!date) return new Date().toISOString().replace('T', ' ').slice(0, 23);
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return new Date().toISOString().replace('T', ' ').slice(0, 23);
  return d.toISOString().replace('T', ' ').slice(0, 23);
}

interface TinybirdVisitorDataRow {
  project_id: string;
  visitor_id: string;
  distinct_id: string;
  data_key: string;
  data_type: number;
  string_value: string;
  number_value: number | null;
  date_value: string | null;
  created_at: string;
}

async function uploadToTinybird(rows: TinybirdVisitorDataRow[]): Promise<void> {
  if (rows.length === 0) return;

  const BATCH_SIZE = 1000;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const ndjson = batch.map((r) => JSON.stringify(r)).join('\n');

    const res = await fetch(`${tinybirdUrl}/v0/events?name=visitor_data`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tinybirdToken}`,
      },
      body: ndjson,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Tinybird insert failed (${res.status}): ${errText}`);
    }
  }
}

async function main() {
  console.log('\n==========================================');
  console.log('   Visitor Data Migration to Tinybird     ');
  console.log('==========================================');
  console.log(`Tinybird Endpoint : ${tinybirdUrl}`);
  console.log(`Mode              : ${isDryRun ? '[DRY RUN] (No changes)' : 'LIVE'}`);
  console.log(`Truncate Postgres : ${shouldTruncate ? 'YES' : 'NO'}`);
  console.log('==========================================\n');

  if (!dbUrl) {
    console.error('❌ DATABASE_URL is missing. Please set it in .env');
    process.exit(1);
  }

  if (!tinybirdToken) {
    console.error('❌ TINYBIRD_TOKEN is missing. Please set it in .env');
    process.exit(1);
  }

  const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
  const sql = postgres(dbUrl, {
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 2,
    connect_timeout: 15,
  });

  try {
    // 1. Check if visitor table exists in PostgreSQL
    const [visitorTableExists] = await sql<[{ exists: boolean }]>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'visitor'
      ) as exists;
    `;

    // 2. Check if visitor_data table exists in PostgreSQL
    const [visitorDataTableExists] = await sql<[{ exists: boolean }]>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'visitor_data'
      ) as exists;
    `;

    const tinybirdRows: TinybirdVisitorDataRow[] = [];
    let visitorsCount = 0;
    let visitorDataCount = 0;

    // 3. Extract from visitor table
    if (visitorTableExists?.exists) {
      const visitors = await sql<any[]>`
        SELECT 
          visitor_id,
          project_id,
          distinct_id,
          first_name,
          last_name,
          email,
          avatar,
          properties,
          created_at
        FROM visitor;
      `;

      visitorsCount = visitors.length;
      console.log(`Found ${visitorsCount} visitor(s) in PostgreSQL visitor table.`);

      for (const v of visitors) {
        const pId = String(v.project_id || '');
        const vId = String(v.visitor_id || '');
        const dId = String(v.distinct_id || '');
        const createdAt = getUTCString(v.created_at);

        if (v.first_name) {
          tinybirdRows.push({
            project_id: pId,
            visitor_id: vId,
            distinct_id: dId,
            data_key: 'first_name',
            data_type: 0,
            string_value: String(v.first_name),
            number_value: null,
            date_value: null,
            created_at: createdAt,
          });
        }

        if (v.last_name) {
          tinybirdRows.push({
            project_id: pId,
            visitor_id: vId,
            distinct_id: dId,
            data_key: 'last_name',
            data_type: 0,
            string_value: String(v.last_name),
            number_value: null,
            date_value: null,
            created_at: createdAt,
          });
        }

        if (v.email) {
          tinybirdRows.push({
            project_id: pId,
            visitor_id: vId,
            distinct_id: dId,
            data_key: 'email',
            data_type: 0,
            string_value: String(v.email),
            number_value: null,
            date_value: null,
            created_at: createdAt,
          });
        }

        if (v.avatar) {
          tinybirdRows.push({
            project_id: pId,
            visitor_id: vId,
            distinct_id: dId,
            data_key: 'avatar',
            data_type: 0,
            string_value: String(v.avatar),
            number_value: null,
            date_value: null,
            created_at: createdAt,
          });
        }

        if (v.properties && typeof v.properties === 'object') {
          for (const [key, val] of Object.entries(v.properties)) {
            if (val === null || val === undefined) continue;

            if (typeof val === 'number') {
              tinybirdRows.push({
                project_id: pId,
                visitor_id: vId,
                distinct_id: dId,
                data_key: key,
                data_type: 1,
                string_value: '',
                number_value: val,
                date_value: null,
                created_at: createdAt,
              });
            } else if (typeof val === 'boolean') {
              tinybirdRows.push({
                project_id: pId,
                visitor_id: vId,
                distinct_id: dId,
                data_key: key,
                data_type: 3,
                string_value: val ? 'true' : 'false',
                number_value: null,
                date_value: null,
                created_at: createdAt,
              });
            } else {
              tinybirdRows.push({
                project_id: pId,
                visitor_id: vId,
                distinct_id: dId,
                data_key: key,
                data_type: 0,
                string_value: typeof val === 'object' ? JSON.stringify(val) : String(val),
                number_value: null,
                date_value: null,
                created_at: createdAt,
              });
            }
          }
        }
      }
    } else {
      console.log('PostgreSQL visitor table does not exist.');
    }

    // 4. Extract from PostgreSQL visitor_data table
    if (visitorDataTableExists?.exists) {
      const visitorData = await sql<any[]>`
        SELECT 
          project_id,
          visitor_id,
          distinct_id,
          data_key,
          data_type,
          string_value,
          number_value,
          date_value,
          created_at
        FROM visitor_data;
      `;

      visitorDataCount = visitorData.length;
      console.log(`Found ${visitorDataCount} row(s) in PostgreSQL visitor_data table.`);

      for (const row of visitorData) {
        tinybirdRows.push({
          project_id: String(row.project_id || ''),
          visitor_id: String(row.visitor_id || ''),
          distinct_id: String(row.distinct_id || ''),
          data_key: String(row.data_key || ''),
          data_type: Number(row.data_type ?? 0),
          string_value: String(row.string_value || ''),
          number_value: row.number_value !== null ? Number(row.number_value) : null,
          date_value: row.date_value ? getUTCString(row.date_value) : null,
          created_at: getUTCString(row.created_at),
        });
      }
    }

    console.log(`\nPrepared ${tinybirdRows.length} total trait records to insert into Tinybird visitor_data.`);

    if (isDryRun) {
      console.log('\n💡 [DRY RUN] Skipping Tinybird upload and database mutations.');
      await sql.end();
      return;
    }

    // 5. Upload rows to Tinybird
    if (tinybirdRows.length > 0) {
      process.stdout.write(`\n⏳ Uploading ${tinybirdRows.length} rows to Tinybird visitor_data... `);
      await uploadToTinybird(tinybirdRows);
      console.log('✅ Done!');
    } else {
      console.log('\nNo visitor records found to migrate.');
    }

    // 6. Ensure foreign key constraints referencing visitor table are dropped in PostgreSQL
    console.log('\n⏳ Ensuring PostgreSQL visitor foreign key constraints are dropped...');
    await sql.unsafe(`
      ALTER TABLE "project_event" DROP CONSTRAINT IF EXISTS "project_event_visitor_fkey";
      ALTER TABLE "visitor_data" DROP CONSTRAINT IF EXISTS "visitor_data_visitor_fkey";
      ALTER TABLE "revenue" DROP CONSTRAINT IF EXISTS "revenue_visitor_fkey";
    `);
    console.log('✅ PostgreSQL visitor foreign key constraints dropped.');

    // 7. Truncate PostgreSQL visitor tables if requested
    if (shouldTruncate) {
      console.log('\n⏳ Truncating PostgreSQL visitor & visitor_data tables...');
      if (visitorDataTableExists?.exists && visitorTableExists?.exists) {
        await sql.unsafe(`TRUNCATE TABLE "visitor_data", "visitor" CASCADE;`);
      } else if (visitorTableExists?.exists) {
        await sql.unsafe(`TRUNCATE TABLE "visitor" CASCADE;`);
      }
      console.log('✅ PostgreSQL visitor & visitor_data tables truncated.');
    }

    console.log('\n==========================================');
    console.log('         Migration Summary                ');
    console.log('==========================================');
    console.log(`Visitors Processed   : ${visitorsCount}`);
    console.log(`Traits Extracted     : ${visitorDataCount}`);
    console.log(`Tinybird Rows Sent   : ${tinybirdRows.length}`);
    console.log(`PostgreSQL FKs Dropped: YES`);
    console.log(`Postgres Tables Reset: ${shouldTruncate ? 'YES' : 'NO'}`);
    console.log('==========================================\n');
  } catch (err: any) {
    console.error('\n❌ Migration failed:', err.message || err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
