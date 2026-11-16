-- Migration 003: Replace prompt/output/completion with full JSON payload and response
-- Safe: adds new Nullable columns, drops legacy flat text columns.
-- Run against ClickHouse cluster.

ALTER TABLE llm_events
  ADD COLUMN IF NOT EXISTS payload   Nullable(String),
  ADD COLUMN IF NOT EXISTS response  Nullable(String);

ALTER TABLE llm_events
  DROP COLUMN IF EXISTS prompt,
  DROP COLUMN IF EXISTS output,
  DROP COLUMN IF EXISTS completion;
