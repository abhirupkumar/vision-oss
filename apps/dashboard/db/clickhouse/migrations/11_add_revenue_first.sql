-- Create session stats
CREATE TABLE vision_test.project_session_stats
(
    project_id String,
    session_id UUID,
    session_date Date,
    visitor_id AggregateFunction(argMax, UUID, DateTime('UTC')),
    browser AggregateFunction(argMax, LowCardinality(String), DateTime('UTC')),
    os AggregateFunction(argMax, LowCardinality(String), DateTime('UTC')),
    device AggregateFunction(argMax, LowCardinality(String), DateTime('UTC')),
    country AggregateFunction(argMax, LowCardinality(String), DateTime('UTC')),
    hostname AggregateFunction(argMax, LowCardinality(String), DateTime('UTC')),
    screen AggregateFunction(argMax, LowCardinality(String), DateTime('UTC')),
    language AggregateFunction(argMax, LowCardinality(String), DateTime('UTC')),
    region AggregateFunction(argMax, LowCardinality(String), DateTime('UTC')),
    city AggregateFunction(argMax, String, DateTime('UTC')),
    start_time AggregateFunction(min, DateTime('UTC')),
    end_time AggregateFunction(max, DateTime('UTC')),
    views AggregateFunction(sum, UInt64),
    events AggregateFunction(sum, UInt64),
    revenue AggregateFunction(sum, Decimal(18, 4))
)
ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMM(session_date)
ORDER BY (project_id, session_id, session_date);

CREATE MATERIALIZED VIEW vision_test.project_session_stats_mv
TO vision_test.project_session_stats
AS
SELECT
    project_id,
    session_id,
    toDate(min(created_at)) AS session_date,
    argMaxState(visitor_id, created_at) AS visitor_id,
    argMaxState(browser, created_at) AS browser,
    argMaxState(os, created_at) AS os,
    argMaxState(device, created_at) AS device,
    argMaxState(country, created_at) AS country,
    argMaxState(hostname, created_at) AS hostname,
    argMaxState(screen, created_at) AS screen,
    argMaxState(language, created_at) AS language,
    argMaxState(region, created_at) AS region,
    argMaxState(city, created_at) AS city,
    minState(created_at) AS start_time,
    maxState(created_at) AS end_time,
    sumState(toUInt64(event_type = 1)) AS views,
    sumState(toUInt64(event_type = 2)) AS events,
    sumState(CAST(0 AS Decimal(18, 4))) AS revenue
FROM vision_test.project_event
GROUP BY
    project_id,
    session_id;

CREATE MATERIALIZED VIEW vision_test.project_session_revenue_mv
TO vision_test.project_session_stats
AS
SELECT
    project_id,
    session_id,
    toDate(min(created_at)) AS session_date,
    argMaxState(CAST('00000000-0000-0000-0000-000000000000' AS UUID), created_at) AS visitor_id,
    argMaxState(CAST('' AS LowCardinality(String)), created_at) AS browser,
    argMaxState(CAST('' AS LowCardinality(String)), created_at) AS os,
    argMaxState(CAST('' AS LowCardinality(String)), created_at) AS device,
    argMaxState(CAST('' AS LowCardinality(String)), created_at) AS country,
    argMaxState(CAST('' AS LowCardinality(String)), created_at) AS hostname,
    argMaxState(CAST('' AS LowCardinality(String)), created_at) AS screen,
    argMaxState(CAST('' AS LowCardinality(String)), created_at) AS language,
    argMaxState(CAST('' AS LowCardinality(String)), created_at) AS region,
    argMaxState('', created_at) AS city,
    minState(created_at) AS start_time,
    maxState(created_at) AS end_time,
    sumState(toUInt64(0)) AS views,
    sumState(toUInt64(0)) AS events,
    sumState(revenue) AS revenue
FROM vision_test.project_revenue
GROUP BY
    project_id,
    session_id;

-- Create visitor stats
CREATE TABLE vision_test.project_visitor_stats
(
    project_id String,
    visitor_id UUID,
    visitor_date Date,
    start_time AggregateFunction(min, DateTime('UTC')),
    last_seen AggregateFunction(max, DateTime('UTC')),
    total_sessions AggregateFunction(uniq, UUID),
    total_revenue AggregateFunction(sum, Decimal(18, 4))
)
ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMM(visitor_date)
ORDER BY (project_id, visitor_id, visitor_date);

CREATE MATERIALIZED VIEW vision_test.project_visitor_stats_mv
TO vision_test.project_visitor_stats
AS
SELECT
    project_id,
    visitor_id,
    toDate(min(created_at)) AS visitor_date,
    minState(created_at) AS start_time,
    maxState(created_at) AS last_seen,
    uniqState(session_id) AS total_sessions,
    sumState(CAST(0 AS Decimal(18, 4))) AS total_revenue
FROM vision_test.project_event
GROUP BY project_id, visitor_id;
