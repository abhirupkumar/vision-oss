/* eslint-disable no-console */
import 'dotenv/config';

if (process.env.CF_PAGES) {
  console.log('Running on Cloudflare Pages build, skipping env checks.');
  process.exit(0);
}

function checkMissing(vars) {
  const missing = vars.reduce((arr, key) => {
    if (!process.env[key]) {
      arr.push(key);
    }
    return arr;
  }, []);

  if (missing.length) {
    console.log(`The following environment variables are not defined:`);
    for (const item of missing) {
      console.log(' - ', item);
    }
    process.exit(1);
  }
}

if (!process.env.SKIP_DB_CHECK && !process.env.DATABASE_TYPE) {
  checkMissing(['DATABASE_URL']);
}

if (process.env.TINYBIRD_URL) {
  checkMissing(['TINYBIRD_URL', 'TINYBIRD_TOKEN']);
} else if (process.env.CLICKHOUSE_URL) {
  // Legacy ClickHouse path — kept for backward compatibility
  checkMissing(['CLICKHOUSE_URL']);
}

if (process.env.CLOUD_URL) {
  if (process.env.TINYBIRD_URL) {
    checkMissing(['CLOUD_URL', 'TINYBIRD_URL', 'TINYBIRD_TOKEN', 'REDIS_URL']);
  } else {
    checkMissing(['CLOUD_URL', 'CLICKHOUSE_URL', 'REDIS_URL']);
  }
}
