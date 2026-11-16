-- Migration 002: Expand llm_events with proxy architecture v2 columns
-- Safe: all columns use DEFAULT or Nullable — no backfill of existing rows needed.
-- Run against in-house ClickHouse cluster only (Tinybird is managed separately via tb CLI).

ALTER TABLE llm_events
  ADD COLUMN IF NOT EXISTS name                        String          DEFAULT '',
  ADD COLUMN IF NOT EXISTS level                       String          DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS start_time                  Nullable(DateTime64(3, 'UTC')),
  ADD COLUMN IF NOT EXISTS end_time                    Nullable(DateTime64(3, 'UTC')),
  ADD COLUMN IF NOT EXISTS completion_start_time       Nullable(DateTime64(3, 'UTC')),
  ADD COLUMN IF NOT EXISTS user_id                     String          DEFAULT '',
  ADD COLUMN IF NOT EXISTS environment                 String          DEFAULT '',
  ADD COLUMN IF NOT EXISTS release                     String          DEFAULT '',
  ADD COLUMN IF NOT EXISTS version                     String          DEFAULT '',
  ADD COLUMN IF NOT EXISTS tags                        String          DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS model_parameters            String          DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS request_path                String          DEFAULT '',
  ADD COLUMN IF NOT EXISTS usage_unit                  String          DEFAULT 'tokens',
  ADD COLUMN IF NOT EXISTS prompt_cache_read_tokens    Nullable(Int64),
  ADD COLUMN IF NOT EXISTS prompt_cache_write_tokens   Nullable(Int64),
  ADD COLUMN IF NOT EXISTS reasoning_tokens            Nullable(Int64),
  ADD COLUMN IF NOT EXISTS usage_details               String          DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS input_cost                  Nullable(Float64),
  ADD COLUMN IF NOT EXISTS output_cost                 Nullable(Float64),
  ADD COLUMN IF NOT EXISTS http_status_code            Nullable(Int32),
  ADD COLUMN IF NOT EXISTS error_code                  String          DEFAULT '',
  ADD COLUMN IF NOT EXISTS prompt_id                   String          DEFAULT '',
  ADD COLUMN IF NOT EXISTS prompt_version              Nullable(Int32),
  ADD COLUMN IF NOT EXISTS scores                      String          DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS country_code                String          DEFAULT '',
  ADD COLUMN IF NOT EXISTS body_truncated              UInt8           DEFAULT 0;
