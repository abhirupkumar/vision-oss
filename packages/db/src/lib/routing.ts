import redis from './redis';

export const DRIZZLE = 'drizzle';
export const POSTGRESQL = 'postgresql';
export const CLICKHOUSE = 'clickhouse';
export const TINYBIRD = 'tinybird';
export const KAFKA = 'kafka';
export const KAFKA_PRODUCER = 'kafka-producer';

declare global {
  interface BigInt {
    toJSON(): number;
  }
}

// Fixes issue with converting bigint values
BigInt.prototype.toJSON = function () {
  return Number(this);
};

export function getDatabaseType(url = process.env.DATABASE_URL) {
  const type = url?.split(':')[0];

  if (type === 'postgres') {
    return POSTGRESQL;
  }

  return type;
}

export async function runQuery(queries: any, cacheKey?: string) {
  const executeQuery = () => {
    // Tinybird takes priority over ClickHouse
    if (process.env.TINYBIRD_URL && process.env.TINYBIRD_TOKEN) {
      if (queries[KAFKA]) {
        return queries[KAFKA]();
      }
      if (queries[TINYBIRD]) {
        return queries[TINYBIRD]();
      }
      return queries[CLICKHOUSE]();
    }

    // Legacy ClickHouse path
    if (process.env.CLICKHOUSE_URL) {
      if (queries[KAFKA]) {
        return queries[KAFKA]();
      }
      return queries[CLICKHOUSE]();
    }

    const db = getDatabaseType();

    if (db === POSTGRESQL) {
      return queries[DRIZZLE]();
    }
  };

  if (cacheKey && redis.enabled) {
    return redis.client.fetch(cacheKey, executeQuery, 60);
  }

  return executeQuery();
}

export function notImplemented() {
  throw new Error('Not implemented.');
}
