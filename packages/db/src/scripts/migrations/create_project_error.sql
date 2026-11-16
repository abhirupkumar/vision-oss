-- Raw error spans (1 row per browser error)
CREATE TABLE IF NOT EXISTS project_error (
  project_id   String                      CODEC(ZSTD(1)),
  visitor_id   String                      CODEC(ZSTD(1)),
  session_id   String                      CODEC(ZSTD(1)),
  error_id     String                      CODEC(ZSTD(1)),
  error_type   LowCardinality(String)      DEFAULT '' CODEC(ZSTD(1)),
  message      String                      DEFAULT '' CODEC(ZSTD(1)),
  filename     Nullable(String)            CODEC(ZSTD(1)),
  lineno       Nullable(Int32)             CODEC(ZSTD(1)),
  colno        Nullable(Int32)             CODEC(ZSTD(1)),
  stack        Nullable(String)            CODEC(ZSTD(1)),
  fingerprint  String                      DEFAULT '' CODEC(ZSTD(1)),
  url_path     String                      DEFAULT '' CODEC(ZSTD(1)),
  url_query    String                      DEFAULT '' CODEC(ZSTD(1)),
  hostname     LowCardinality(String)      DEFAULT '' CODEC(ZSTD(1)),
  browser      LowCardinality(String)      DEFAULT '' CODEC(ZSTD(1)),
  os           LowCardinality(String)      DEFAULT '' CODEC(ZSTD(1)),
  device       LowCardinality(String)      DEFAULT '' CODEC(ZSTD(1)),
  country      LowCardinality(String)      DEFAULT '' CODEC(ZSTD(1)),
  region       LowCardinality(String)      DEFAULT '' CODEC(ZSTD(1)),
  city         String                      DEFAULT '' CODEC(ZSTD(1)),
  level        LowCardinality(String)      DEFAULT 'error' CODEC(ZSTD(1)),
  created_at   DateTime64(3, 'UTC')        CODEC(Delta(8), ZSTD(1)),

  INDEX idx_session_id  session_id  TYPE bloom_filter(0.01) GRANULARITY 1,
  INDEX idx_error_type  error_type  TYPE bloom_filter(0.01) GRANULARITY 1,
  INDEX idx_fingerprint fingerprint TYPE bloom_filter(0.01) GRANULARITY 1,
  INDEX idx_message     message     TYPE tokenbf_v1(10240, 3, 0) GRANULARITY 1
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(created_at)
ORDER BY (project_id, error_type, url_path, created_at)
TTL toDateTime(created_at) + INTERVAL 2 YEAR
SETTINGS index_granularity = 8192, ttl_only_drop_parts = 1;

-- Hourly aggregation target (AggregatingMergeTree — matches Databuddy pattern)
CREATE TABLE IF NOT EXISTS project_error_hourly (
  project_id      String                    CODEC(ZSTD(1)),
  url_path        String                    CODEC(ZSTD(1)),
  error_type      LowCardinality(String)    CODEC(ZSTD(1)),
  fingerprint     String                    CODEC(ZSTD(1)),
  message_hash    UInt64                    CODEC(ZSTD(1)),
  hour            DateTime                  CODEC(Delta(4), ZSTD(1)),
  error_count     UInt64                    CODEC(ZSTD(1)),
  affected_users  AggregateFunction(uniq, String),
  affected_sessions AggregateFunction(uniq, String),
  sample_message  String                    CODEC(ZSTD(1))
)
ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMM(hour)
ORDER BY (project_id, error_type, url_path, fingerprint, hour)
TTL toDateTime(hour) + INTERVAL 1 YEAR
SETTINGS index_granularity = 8192;

-- Materialized view that feeds the aggregation table
CREATE MATERIALIZED VIEW IF NOT EXISTS project_error_hourly_mv
TO project_error_hourly AS
SELECT
  project_id,
  url_path,
  error_type,
  fingerprint,
  cityHash64(message)         AS message_hash,
  toStartOfHour(created_at)   AS hour,
  count()                     AS error_count,
  uniqState(visitor_id)       AS affected_users,
  uniqState(session_id)       AS affected_sessions,
  any(message)                AS sample_message
FROM project_error
GROUP BY project_id, url_path, error_type, fingerprint, message_hash, hour;
