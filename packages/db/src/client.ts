import postgres from 'postgres';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

let _activeSql: ReturnType<typeof postgres> | null = null;
let _activePool: Pool | null = null;

/**
 * Creates a Drizzle DB instance.
 *
 * Automatically connects via Neon serverless WebSocket Pool when using a Neon database (*.neon.tech).
 * This eliminates TCP socket limits, SSL handshake hangs, and subrequest issues on Cloudflare Workers,
 * while providing full support for Drizzle relational queries and transactions.
 *
 * For local development or non-Neon databases, falls back to postgres.js.
 */
export function createDb(connectionStringOverride?: string) {
  const connectionString = connectionStringOverride ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is missing');
  }

  // 1. Neon Database: use official serverless driver
  if (connectionString.includes('neon.tech')) {
    // In Cloudflare Workers with nodejs_compat, the `ws` polyfill can interfere with
    // @neondatabase/serverless. Explicitly configure the driver to:
    //   - Use the native Workers WebSocket (not the nodejs_compat ws polyfill)
    //   - Route single queries via HTTPS fetch (poolQueryViaFetch = true)
    //     so they don't need a persistent WebSocket at all, which avoids
    //     "Cannot perform I/O on behalf of a different request" entirely.
    //   - Only open a WebSocket for actual transactions.
    const isWorker = typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers';
    if (isWorker) {
      neonConfig.webSocketConstructor = WebSocket; // use native Workers WebSocket
      neonConfig.poolQueryViaFetch = true;          // single queries → HTTPS fetch, not WS
    }

    const pool = new Pool({ connectionString });
    _activePool = pool;
    return drizzleNeon(pool, { schema });
  }

  // 2. Standard / Local PostgreSQL fallback (postgres.js)
  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  const sql = postgres(connectionString, {
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    fetch_types: false,
    prepare: false,
    onnotice: () => {},
  });

  _activeSql = sql;
  return drizzlePostgres(sql, { schema }) as unknown as ReturnType<typeof drizzleNeon<typeof schema>>;
}

/**
 * Optional cleanup helper.
 */
export async function endDb(timeoutSeconds = 5): Promise<void> {
  const sql = _activeSql;
  const pool = _activePool;
  _activeSql = null;
  _activePool = null;
  globalThis.__db = undefined;

  if (pool) {
    try {
      await pool.end();
    } catch {
      // Ignore errors during cleanup
    }
  }

  if (sql) {
    try {
      await sql.end({ timeout: timeoutSeconds });
    } catch {
      // Ignore errors during cleanup
    }
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __db: ReturnType<typeof createDb> | undefined;
}

export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_target, prop) {
    if (!globalThis.__db) {
      globalThis.__db = createDb();
    }
    return (globalThis.__db as any)[prop];
  },
});

export type Db = ReturnType<typeof createDb>;
