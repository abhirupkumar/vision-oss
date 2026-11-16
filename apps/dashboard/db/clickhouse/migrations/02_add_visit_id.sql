CREATE TABLE vision_test.project_event_join
(
    visitor_id UUID,
    session_id UUID,
    created_at DateTime('UTC')
)
    engine = MergeTree
        ORDER BY (visitor_id, created_at)
        SETTINGS index_granularity = 8192;

INSERT INTO vision_test.project_event_join
SELECT DISTINCT
    s.visitor_id,
    generateUUIDv4() session_id,
    s.created_at
FROM (SELECT DISTINCT visitor_id,
        date_trunc('hour', created_at) created_at
    FROM project_event) s;

-- create new table
CREATE TABLE vision_test.project_event_new
(
    project_id UUID,
    visitor_id UUID,
    session_id UUID,
    event_id UUID,
    hostname LowCardinality(String),
    browser LowCardinality(String),
    os LowCardinality(String),
    device LowCardinality(String),
    screen LowCardinality(String),
    language LowCardinality(String),
    country LowCardinality(String),
    subdivision1 LowCardinality(String),
    subdivision2 LowCardinality(String),
    city String,
    url_path String,
    url_query String,
    referrer_path String,
    referrer_query String,
    referrer_domain String,
    page_title String,
    event_type UInt32,
    event_name String,
    created_at DateTime('UTC'),
    job_id UUID
)
    engine = MergeTree
        ORDER BY (project_id, visitor_id, created_at)
        SETTINGS index_granularity = 8192;

INSERT INTO vision_test.project_event_new
SELECT we.project_id,
    we.visitor_id,
    j.session_id,
    we.event_id,
    we.hostname,
    we.browser,
    we.os,
    we.device,
    we.screen,
    we.language,
    we.country,
    we.subdivision1,
    we.subdivision2,
    we.city,
    we.url_path,
    we.url_query,
    we.referrer_path,
    we.referrer_query,
    we.referrer_domain,
    we.page_title,
    we.event_type,
    we.event_name,
    we.created_at,
    we.job_id
FROM vision_test.project_event we
JOIN vision_test.project_event_join j
    ON we.visitor_id = j.visitor_id
        and date_trunc('hour', we.created_at) = j.created_at

RENAME TABLE vision_test.project_event TO vision_test.project_event_old;
RENAME TABLE vision_test.project_event_new TO vision_test.project_event;

/*

 DROP TABLE vision_test.project_event_old
 DROP TABLE vision_test.project_event_join

 */