-- Create Event
CREATE TABLE vision_test.project_event
(
    project_id String,
    visitor_id UUID,
    session_id UUID,
    event_id UUID,
    --sessions
    hostname LowCardinality(String),
    browser LowCardinality(String),
    os LowCardinality(String),
    device LowCardinality(String),
    screen LowCardinality(String),
    language LowCardinality(String),
    country LowCardinality(String),
    region LowCardinality(String),
    city String,
    latitude Nullable(Float32),
    longitude Nullable(Float32),
    --pageviews
    url_path String,
    url_query String,
    utm_source String,
    utm_medium String,
    utm_campaign String,
    utm_content String,
    utm_term String,
    referrer_path String,
    referrer_query String,
    referrer_domain String,
    page_title String,
    --clickIDs
    gclid String,
    fbclid String,
    msclkid String,
    ttclid String,
    li_fat_id String,
    twclid String,
    --performance
    lcp Nullable(Decimal(10, 1)),
    inp Nullable(Decimal(10, 1)),
    cls Nullable(Decimal(10, 4)),
    fcp Nullable(Decimal(10, 1)),
    ttfb Nullable(Decimal(10, 1)),
    --events
    event_type UInt32,
    event_name String,
    tag String,
    distinct_id String,
    created_at DateTime('UTC'),
    job_id Nullable(UUID)
)
ENGINE = MergeTree
    PARTITION BY toYYYYMM(created_at)
    ORDER BY (toStartOfHour(created_at), project_id, visitor_id, session_id, created_at)
    PRIMARY KEY (toStartOfHour(created_at), project_id, visitor_id, session_id)
    SETTINGS index_granularity = 8192;

CREATE TABLE vision_test.event_data
(
    project_id String,
    visitor_id UUID,
    session_id UUID,
    event_id UUID,
    url_path String,
    event_name String,
    data_key String,
    string_value Nullable(String),
    number_value Nullable(Decimal(22, 4)),
    date_value Nullable(DateTime('UTC')),
    data_type UInt32,
    created_at DateTime('UTC'),
    job_id Nullable(UUID)
)
ENGINE = MergeTree
    ORDER BY (project_id, event_id, data_key, created_at)
    SETTINGS index_granularity = 8192;

CREATE TABLE vision_test.visitor_data
(
    project_id String,
    visitor_id UUID,
    data_key String,
    string_value Nullable(String),
    number_value Nullable(Decimal(22, 4)),
    date_value Nullable(DateTime('UTC')),
    data_type UInt32,
    distinct_id String,
    created_at DateTime('UTC'),
    job_id Nullable(UUID)
)
ENGINE = ReplacingMergeTree
    ORDER BY (project_id, visitor_id, data_key)
    SETTINGS index_granularity = 8192;

-- stats hourly
CREATE TABLE vision_test.project_event_stats_hourly
(
    project_id String,
    visitor_id UUID,
    session_id UUID,
    hostname SimpleAggregateFunction(groupArrayArray, Array(String)),
    browser LowCardinality(String),
    os LowCardinality(String),
    device LowCardinality(String),
    screen LowCardinality(String),
    language LowCardinality(String),
    country LowCardinality(String),
    region LowCardinality(String),
    city String,
    entry_url AggregateFunction(argMin, String, DateTime('UTC')),
    exit_url AggregateFunction(argMax, String, DateTime('UTC')),
    url_path SimpleAggregateFunction(groupArrayArray, Array(String)),
    url_query SimpleAggregateFunction(groupArrayArray, Array(String)),
    utm_source SimpleAggregateFunction(groupArrayArray, Array(String)),
    utm_medium SimpleAggregateFunction(groupArrayArray, Array(String)),
    utm_campaign SimpleAggregateFunction(groupArrayArray, Array(String)),
    utm_content SimpleAggregateFunction(groupArrayArray, Array(String)),
    utm_term SimpleAggregateFunction(groupArrayArray, Array(String)),
    referrer_domain SimpleAggregateFunction(groupArrayArray, Array(String)),
    page_title SimpleAggregateFunction(groupArrayArray, Array(String)),
    gclid SimpleAggregateFunction(groupArrayArray, Array(String)),
    fbclid SimpleAggregateFunction(groupArrayArray, Array(String)),
    msclkid SimpleAggregateFunction(groupArrayArray, Array(String)),
    ttclid SimpleAggregateFunction(groupArrayArray, Array(String)),
    li_fat_id SimpleAggregateFunction(groupArrayArray, Array(String)),
    twclid SimpleAggregateFunction(groupArrayArray, Array(String)),
    event_type UInt32,
    event_name SimpleAggregateFunction(groupArrayArray, Array(String)),
    views SimpleAggregateFunction(sum, UInt64),
    min_time SimpleAggregateFunction(min, DateTime('UTC')),
    max_time SimpleAggregateFunction(max, DateTime('UTC')),
    tag SimpleAggregateFunction(groupArrayArray, Array(String)),
    distinct_id String,
    created_at Datetime('UTC')
)
ENGINE = AggregatingMergeTree
    PARTITION BY toYYYYMM(created_at)
    ORDER BY (
        project_id,
        event_type,
        toStartOfHour(created_at),
        cityHash64(session_id),
        session_id
    )
    SAMPLE BY cityHash64(session_id);

CREATE MATERIALIZED VIEW vision_test.project_event_stats_hourly_mv
TO vision_test.project_event_stats_hourly
AS
SELECT
    project_id,
    visitor_id,
    session_id,
    hostnames as hostname,
    browser,
    os,
    device,
    screen,
    language,
    country,
    region,
    city,
    entry_url,
    exit_url,
    url_paths as url_path,
    url_query,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    referrer_domain,
    page_title,
    gclid,
    fbclid,
    msclkid,
    ttclid,
    li_fat_id,
    twclid,
    event_type,
    event_name,
    views,
    min_time,
    max_time,
    tag,
    distinct_id,
    timestamp as created_at
FROM (SELECT
    project_id,
    visitor_id,
    session_id,
    arrayFilter(x -> x != '', groupArray(hostname)) hostnames,
    browser,
    os,
    device,
    screen,
    language,
    country,
    region,
    city,
    argMinState(url_path, created_at) entry_url,
    argMaxState(url_path, created_at) exit_url,
    arrayFilter(x -> x != '', groupArray(url_path)) as url_paths,
    arrayFilter(x -> x != '', groupArray(url_query)) url_query,
    arrayFilter(x -> x != '', groupArray(utm_source)) utm_source,
    arrayFilter(x -> x != '', groupArray(utm_medium)) utm_medium,
    arrayFilter(x -> x != '', groupArray(utm_campaign)) utm_campaign,
    arrayFilter(x -> x != '', groupArray(utm_content)) utm_content,
    arrayFilter(x -> x != '', groupArray(utm_term)) utm_term,
    arrayFilter(x -> x != '' and x != hostname, groupArray(referrer_domain)) referrer_domain,
    arrayFilter(x -> x != '', groupArray(page_title)) page_title,
    arrayFilter(x -> x != '', groupArray(gclid)) gclid,
    arrayFilter(x -> x != '', groupArray(fbclid)) fbclid,
    arrayFilter(x -> x != '', groupArray(msclkid)) msclkid,
    arrayFilter(x -> x != '', groupArray(ttclid)) ttclid,
    arrayFilter(x -> x != '', groupArray(li_fat_id)) li_fat_id,
    arrayFilter(x -> x != '', groupArray(twclid)) twclid,
    event_type,
    if(event_type = 2, groupArray(event_name), []) event_name,
    sumIf(1, event_type != 2 and event_type != 5) views,
    min(created_at) min_time,
    max(created_at) max_time,
    arrayFilter(x -> x != '', groupArray(tag)) tag,
    distinct_id,
    toStartOfHour(created_at) timestamp
FROM vision_test.project_event
WHERE event_type != 5
GROUP BY project_id,
    visitor_id,
    session_id,
    hostname,
    browser,
    os,
    device,
    screen,
    language,
    country,
    region,
    city,
    event_type,
    distinct_id,
    timestamp);

-- projections
ALTER TABLE vision_test.project_event 
ADD PROJECTION project_event_url_path_projection (
SELECT * ORDER BY toStartOfDay(created_at), project_id, url_path, created_at
);

ALTER TABLE vision_test.project_event MATERIALIZE PROJECTION project_event_url_path_projection;

ALTER TABLE vision_test.project_event 
ADD PROJECTION project_event_referrer_domain_projection (
SELECT * ORDER BY toStartOfDay(created_at), project_id, referrer_domain, created_at
);

ALTER TABLE vision_test.project_event MATERIALIZE PROJECTION project_event_referrer_domain_projection;

-- revenue
CREATE TABLE vision_test.project_revenue
(
    project_id String,
    visitor_id UUID,
    session_id UUID,
    event_id UUID,
    event_name String,
    currency String,
    revenue DECIMAL(18,4),
    provider LowCardinality(String) DEFAULT '',
    payment_connection_id String DEFAULT '',
    created_at DateTime('UTC')
)
ENGINE = MergeTree
    PARTITION BY toYYYYMM(created_at)
    ORDER BY (project_id, visitor_id, created_at)
    SETTINGS index_granularity = 8192;


CREATE MATERIALIZED VIEW vision_test.project_revenue_mv
TO vision_test.project_revenue
AS
SELECT DISTINCT
    ed.project_id,
    ed.visitor_id,
    ed.session_id,
    ed.event_id,
    ed.event_name,
    c.currency,
    coalesce(toDecimal64(ed.number_value, 2), toDecimal64(ed.string_value, 2)) revenue,
    ed.created_at
FROM vision_test.event_data ed
JOIN (SELECT event_id, string_value as currency
        FROM vision_test.event_data
        WHERE positionCaseInsensitive(data_key, 'currency') > 0) c
      ON c.event_id = ed.event_id
WHERE positionCaseInsensitive(data_key, 'revenue') > 0;

-- session replay
CREATE TABLE vision_test.session_replay
(
    project_id String,
    visitor_id UUID,
    session_id UUID,
    replay_id UUID,
    chunk_index UInt32,
    events String,
    event_count UInt32,
    started_at DateTime('UTC'),
    ended_at DateTime('UTC'),
    created_at DateTime('UTC')
)
ENGINE = MergeTree
    PARTITION BY toYYYYMM(created_at)
    ORDER BY (replay_id, project_id, visitor_id, session_id, chunk_index)
    SETTINGS index_granularity = 8192;

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
    channel AggregateFunction(argMin, String, DateTime('UTC')),
    referrer_domain AggregateFunction(argMin, String, DateTime('UTC')),
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
    argMinState(
        case
            when referrer_domain = '' and url_query = '' then 'direct'
            when multiSearchAny(url_query, ['ad_id=', 'aid=', 'dclid=', 'epik=', 'fbclid=', 'gclid=', 'li_fat_id=', 'msclkid=', 'ob_click_id=', 'pc_id=', 'rdt_cid=', 'scid=', 'ttclid=', 'twclid=', 'utm_medium=cpc', 'utm_medium=paid', 'utm_medium=paid_social', 'utm_source=google']) != 0 then 'paidAds'
            when multiSearchAny(utm_medium, ['referral', 'app','link']) != 0 then 'referral'
            when position(utm_medium, 'affiliate') > 0 then 'affiliate'
            when position(utm_medium, 'sms') > 0 or position(utm_source, 'sms') > 0 then 'sms'
            when multiSearchAny(referrer_domain, ['baidu.com', 'bing.com', 'chatgpt.com', 'duckduckgo.com', 'ecosia.org', 'google.', 'msn.com', 'perplexity.ai', 'search.brave.com', 'yandex.']) != 0 or position(utm_medium, 'organic') > 0 then concat(case when multiSearchAny(utm_medium, ['cp', 'ppc', 'retargeting', 'paid']) != 0 then 'paid' else 'organic' end, 'Search')
            when multiSearchAny(referrer_domain, ['bsky.app', 'facebook.com', 'fb.com', 'ig.com', 'instagram.com', 'linkedin.', 'news.ycombinator.com', 'pinterest.', 'reddit.', 'snapchat.', 't.co', 'threads.net', 'tiktok.', 'twitter.com', 'x.com']) != 0 then concat(case when multiSearchAny(utm_medium, ['cp', 'ppc', 'retargeting', 'paid']) != 0 then 'paid' else 'organic' end, 'Social')
            when multiSearchAny(referrer_domain, ['gmail.', 'hotmail.', 'mail.yahoo.', 'outlook.', 'proton.me', 'protonmail.']) != 0 or position(utm_medium, 'mail') > 0 then 'email'
            when multiSearchAny(referrer_domain, ['alibaba.com', 'aliexpress.com', 'amazon.', 'bestbuy.com', 'ebay.com', 'etsy.com', 'newegg.com', 'target.com', 'walmart.com']) != 0 or position(utm_medium, 'shop') > 0 then concat(case when multiSearchAny(utm_medium, ['cp', 'ppc', 'retargeting', 'paid']) != 0 then 'paid' else 'organic' end, 'Shopping')
            when multiSearchAny(referrer_domain, ['twitch.', 'youtube.']) != 0 or position(utm_medium, 'video') > 0 then concat(case when multiSearchAny(utm_medium, ['cp', 'ppc', 'retargeting', 'paid']) != 0 then 'paid' else 'organic' end, 'Video')
            when referrer_domain != hostname and referrer_domain != '' then 'referral'
            else '' end, 
        created_at) AS channel,
    argMinState(referrer_domain, created_at) AS referrer_domain,
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
    argMinState('', created_at) AS channel,
    argMinState('', created_at) AS referrer_domain,
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

-- Create pageview stats
CREATE TABLE vision_test.project_pageview_stats_hourly
(
    project_id String,
    url_path String,
    created_at DateTime('UTC'),
    visitors AggregateFunction(uniq, UUID),
    sessions AggregateFunction(uniq, UUID),
    views AggregateFunction(sum, UInt64)
)
ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMM(created_at)
ORDER BY (project_id, url_path, created_at);

CREATE MATERIALIZED VIEW vision_test.project_pageview_stats_hourly_mv
TO vision_test.project_pageview_stats_hourly
AS
SELECT
    project_id,
    url_path,
    toStartOfHour(created_at) as created_at,
    uniqState(visitor_id) as visitors,
    uniqState(session_id) as sessions,
    sumState(toUInt64(1)) as views
FROM vision_test.project_event
WHERE event_type != 2
GROUP BY project_id, url_path, created_at;

-- Create referrer stats
CREATE TABLE vision_test.project_referrer_stats_hourly
(
    project_id String,
    referrer_domain String,
    created_at DateTime('UTC'),
    visitors AggregateFunction(uniq, UUID),
    sessions AggregateFunction(uniq, UUID),
    views AggregateFunction(sum, UInt64)
)
ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMM(created_at)
ORDER BY (project_id, referrer_domain, created_at);

CREATE MATERIALIZED VIEW vision_test.project_referrer_stats_hourly_mv
TO vision_test.project_referrer_stats_hourly
AS
SELECT
    project_id,
    referrer_domain,
    toStartOfHour(created_at) as created_at,
    uniqState(visitor_id) as visitors,
    uniqState(session_id) as sessions,
    sumState(toUInt64(1)) as views
FROM vision_test.project_event
WHERE event_type != 2 and referrer_domain != hostname and referrer_domain != ''
GROUP BY project_id, referrer_domain, created_at;

-- Create channel stats
CREATE TABLE vision_test.project_channel_stats_hourly
(
    project_id String,
    channel String,
    created_at DateTime('UTC'),
    visitors AggregateFunction(uniq, UUID),
    sessions AggregateFunction(uniq, UUID),
    views AggregateFunction(sum, UInt64)
)
ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMM(created_at)
ORDER BY (project_id, channel, created_at);

CREATE MATERIALIZED VIEW vision_test.project_channel_stats_hourly_mv
TO vision_test.project_channel_stats_hourly
AS
SELECT
    project_id,
    case when multiSearchAny(utm_medium, ['cp', 'ppc', 'retargeting', 'paid']) != 0 then 'paid' else 'organic' end prefix,
    case
        when referrer_domain = '' and url_query = '' then 'direct'
        when multiSearchAny(url_query, ['ad_id=', 'aid=', 'dclid=', 'epik=', 'fbclid=', 'gclid=', 'li_fat_id=', 'msclkid=', 'ob_click_id=', 'pc_id=', 'rdt_cid=', 'scid=', 'ttclid=', 'twclid=', 'utm_medium=cpc', 'utm_medium=paid', 'utm_medium=paid_social', 'utm_source=google']) != 0 then 'paidAds'
        when multiSearchAny(utm_medium, ['referral', 'app','link']) != 0 then 'referral'
        when position(utm_medium, 'affiliate') > 0 then 'affiliate'
        when position(utm_medium, 'sms') > 0 or position(utm_source, 'sms') > 0 then 'sms'
        when multiSearchAny(referrer_domain, ['baidu.com', 'bing.com', 'chatgpt.com', 'duckduckgo.com', 'ecosia.org', 'google.', 'msn.com', 'perplexity.ai', 'search.brave.com', 'yandex.']) != 0 or position(utm_medium, 'organic') > 0 then concat(prefix, 'Search')
        when multiSearchAny(referrer_domain, ['bsky.app', 'facebook.com', 'fb.com', 'ig.com', 'instagram.com', 'linkedin.', 'news.ycombinator.com', 'pinterest.', 'reddit.', 'snapchat.', 't.co', 'threads.net', 'tiktok.', 'twitter.com', 'x.com']) != 0 then concat(prefix, 'Social')
        when multiSearchAny(referrer_domain, ['gmail.', 'hotmail.', 'mail.yahoo.', 'outlook.', 'proton.me', 'protonmail.']) != 0 or position(utm_medium, 'mail') > 0 then 'email'
        when multiSearchAny(referrer_domain, ['alibaba.com', 'aliexpress.com', 'amazon.', 'bestbuy.com', 'ebay.com', 'etsy.com', 'newegg.com', 'target.com', 'walmart.com']) != 0 or position(utm_medium, 'shop') > 0 then concat(prefix, 'Shopping')
        when multiSearchAny(referrer_domain, ['twitch.', 'youtube.']) != 0 or position(utm_medium, 'video') > 0 then concat(prefix, 'Video')
        else '' end AS channel,
    toStartOfHour(created_at) as created_at,
    uniqState(visitor_id) as visitors,
    uniqState(session_id) as sessions,
    sumState(toUInt64(1)) as views
FROM vision_test.project_event
WHERE event_type != 2
GROUP BY project_id, channel, created_at;
