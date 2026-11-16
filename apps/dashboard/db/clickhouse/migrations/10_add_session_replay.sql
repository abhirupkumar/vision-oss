-- Create session_replay
CREATE TABLE vision_test.session_replay
(
    replay_id UUID,
    project_id String,
    visitor_id UUID,
    session_id UUID,
    chunk_index UInt32,
    events String CODEC(ZSTD(3)),
    event_count UInt32,
    started_at DateTime64(6),
    ended_at DateTime64(6),
    created_at DateTime64(6) DEFAULT now64(6)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (replay_id, project_id, visitor_id, session_id, chunk_index)
SETTINGS index_granularity = 8192;