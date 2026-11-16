#!/usr/bin/env tsx
/**
 * clear-db.ts
 *
 * Clears (truncates) all user data from the PostgreSQL database
 * without removing or dropping any tables, schemas, or indexes.
 *
 * Uses:
 *   TRUNCATE TABLE "t1", "t2", ... RESTART IDENTITY CASCADE;
 *
 * Usage:
 *   pnpm db:clear            # Truncates all tables in DATABASE_URL
 *   pnpm db:clear --dry-run  # Lists tables without modifying data
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

const connectionString = process.env.DATABASE_URL;

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

async function main() {
  if (!connectionString) {
    console.error('\n❌ DATABASE_URL environment variable is missing. Please set it in .env\n');
    process.exit(1);
  }

  // Mask credentials for display
  const maskedUrl = connectionString.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@');

  console.log('\n==========================================');
  console.log('       PostgreSQL Database Cleaner        ');
  console.log('==========================================');
  console.log(`Target : ${maskedUrl}`);
  console.log(`Mode   : ${isDryRun ? '[DRY RUN] (No changes)' : 'LIVE (Truncate all tables)'}`);
  console.log('==========================================\n');

  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  const sql = postgres(connectionString, {
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 1,
    connect_timeout: 10,
    idle_timeout: 10,
  });

  try {
    // 1. Fetch all user tables in public schema (excluding migration metadata)
    const tables = await sql<{ table_name: string }[]>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE '%drizzle%'
      ORDER BY table_name ASC;
    `;

    if (tables.length === 0) {
      console.log('✨ No tables found in the database to clear.\n');
      await sql.end();
      return;
    }

    console.log(`Found ${tables.length} table(s):\n`);

    // Fetch approximate or exact row counts for each table
    for (const t of tables) {
      const [{ count }] = await sql<[{ count: string }]>`
        SELECT count(*)::text as count FROM ${sql(t.table_name)};
      `;
      console.log(`  - ${t.table_name.padEnd(30)} (${count} rows)`);
    }
    console.log();

    if (isDryRun) {
      console.log('💡 [DRY RUN] Skipping actual truncate operation.\n');
      await sql.end();
      return;
    }

    // 2. Perform TRUNCATE with CASCADE and RESTART IDENTITY
    console.log('⏳ Truncating all tables with CASCADE...');

    // Build comma-separated table identifiers
    const tableSqlList = tables.map((t) => `"${t.table_name}"`).join(', ');

    // Execute atomic TRUNCATE
    await sql.unsafe(`TRUNCATE TABLE ${tableSqlList} RESTART IDENTITY CASCADE;`);

    console.log('✅ Successfully truncated all tables!\n');
    console.log('==========================================');
    console.log(`All ${tables.length} tables are now clean and empty.`);
    console.log('Schema, indexes, and constraints remain intact.');
    console.log('==========================================\n');
  } catch (err: any) {
    console.error(`\n❌ Error clearing database: ${err.message}\n`);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
