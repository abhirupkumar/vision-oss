-- Auto-generated ClickHouse schema initialization for Vision Community Edition

CREATE TABLE IF NOT EXISTS event_data (
    `project_id`      String,
    `session_id`      String  DEFAULT '',
    `event_id`        String,
    `url_path`        String  DEFAULT '',
    `event_name`      String  DEFAULT '',
    `data_key`        String,
    `data_type`       UInt8   DEFAULT 0,
    `string_value`    String  DEFAULT '',
    `number_value`    Nullable(Float64),
    `date_value`      Nullable(DateTime64(3, 'UTC')),
    `created_at`      DateTime64(3, 'UTC')
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (project_id, event_id, data_key)
TTL toDateTime(created_at) + toIntervalYear(2);

CREATE TABLE IF NOT EXISTS k_business (
    `stream_type`            String,
    `project_id`             String,
    `distinct_id`            String          DEFAULT '',
    `session_id`             String          DEFAULT '',
    `event_id`               String          DEFAULT '',
    `event_name`             String          DEFAULT '',
    `currency`               LowCardinality(String) DEFAULT '',
    `revenue`                Decimal(18, 4),
    `provider`               LowCardinality(String) DEFAULT '',
    `payment_connection_id`  String          DEFAULT '',
    `created_at`             DateTime64(3, 'UTC')
) ENGINE = Null()

ORDER BY tuple()
;

CREATE TABLE IF NOT EXISTS k_events (
    `stream_type`                String,
    -- Shared fields
    `project_id`                 String,
    `session_id`                 String              DEFAULT '',
    `visitor_id`                 String              DEFAULT '',
    `created_at`                 DateTime64(3, 'UTC'),
    -- project_event fields
    `event_id`                   String              DEFAULT '',
    `hostname`                   LowCardinality(String) DEFAULT '',
    `url_path`                   String              DEFAULT '',
    `url_query`                  String              DEFAULT '',
    `referrer_path`              String              DEFAULT '',
    `referrer_query`             String              DEFAULT '',
    `referrer_domain`            String              DEFAULT '',
    `page_title`                 String              DEFAULT '',
    `event_type`                 UInt8               DEFAULT 1,
    `event_name`                 LowCardinality(String) DEFAULT '',
    `tag`                        LowCardinality(String) DEFAULT '',
    `browser`                    LowCardinality(String) DEFAULT '',
    `os`                         LowCardinality(String) DEFAULT '',
    `device`                     LowCardinality(String) DEFAULT '',
    `screen`                     LowCardinality(String) DEFAULT '',
    `language`                   LowCardinality(String) DEFAULT '',
    `country`                    LowCardinality(String) DEFAULT '',
    `region`                     LowCardinality(String) DEFAULT '',
    `city`                       String              DEFAULT '',
    `distinct_id`                String              DEFAULT '',
    `utm_source`                 String              DEFAULT '',
    `utm_medium`                 String              DEFAULT '',
    `utm_campaign`               String              DEFAULT '',
    `utm_content`                String              DEFAULT '',
    `utm_term`                   String              DEFAULT '',
    `gclid`                      String              DEFAULT '',
    `fbclid`                     String              DEFAULT '',
    `msclkid`                    String              DEFAULT '',
    `ttclid`                     String              DEFAULT '',
    `li_fat_id`                  String              DEFAULT '',
    `twclid`                     String              DEFAULT '',
    `lcp`                        Nullable(Float32),
    `inp`                        Nullable(Float32),
    `cls`                        Nullable(Float32),
    `fcp`                        Nullable(Float32),
    `ttfb`                       Nullable(Float32),
    `latitude`                   Nullable(Float32),
    `longitude`                  Nullable(Float32),
    -- llm_events fields
    `id`                         String              DEFAULT '',
    `trace_id`                   String              DEFAULT '',
    `parent_event_id`            String              DEFAULT '',
    `span_type`                  String              DEFAULT 'generation',
    `model`                      String              DEFAULT '',
    `provider`                   String              DEFAULT '',
    `prompt_tokens`              Nullable(Int64),
    `completion_tokens`          Nullable(Int64),
    `total_tokens`               Nullable(Int64),
    `latency_ms`                 UInt32              DEFAULT 0,
    `cost`                       Nullable(Float64),
    `cost_details`               String              DEFAULT '',
    `payload`                    Nullable(String)    DEFAULT '',
    `response`                   Nullable(String)    DEFAULT '',
    `metadata`                   String              DEFAULT '{}',
    `tool_calls`                 String              DEFAULT '[]',
    `tool_definitions`           String              DEFAULT '[]',
    `status`                     String              DEFAULT '',
    `error_message`              String              DEFAULT '',
    `template_name`              String              DEFAULT '',
    `score`                      Nullable(Float64),
    `ttft_ms`                    Nullable(Int64),
    `name`                       String              DEFAULT '',
    `level`                      String              DEFAULT 'default',
    `start_time`                 Nullable(DateTime64(3, 'UTC')),
    `end_time`                   Nullable(DateTime64(3, 'UTC')),
    `completion_start_time`      Nullable(DateTime64(3, 'UTC')),
    `user_id`                    String              DEFAULT '',
    `environment`                String              DEFAULT '',
    `release`                    String              DEFAULT '',
    `version`                    String              DEFAULT '',
    `tags`                       String              DEFAULT '[]',
    `model_parameters`           String              DEFAULT '{}',
    `request_path`               String              DEFAULT '',
    `usage_unit`                 String              DEFAULT 'tokens',
    `prompt_cache_read_tokens`   Nullable(Int64),
    `prompt_cache_write_tokens`  Nullable(Int64),
    `reasoning_tokens`           Nullable(Int64),
    `usage_details`              String              DEFAULT '{}',
    `input_cost`                 Nullable(Float64),
    `output_cost`                Nullable(Float64),
    `http_status_code`           Nullable(Int32),
    `error_code`                 String              DEFAULT '',
    `prompt_id`                  String              DEFAULT '',
    `prompt_version`             Nullable(Int32),
    `scores`                     String              DEFAULT '[]',
    `country_code`               String              DEFAULT '',
    `body_truncated`             UInt8               DEFAULT 0
) ENGINE = Null()

ORDER BY tuple()
;

CREATE TABLE IF NOT EXISTS k_properties (
    `stream_type`   String,
    -- Shared fields
    `project_id`    String,
    `session_id`    String              DEFAULT '',
    `created_at`    DateTime64(3, 'UTC'),
    -- event_data fields
    `event_id`      String              DEFAULT '',
    `url_path`      String              DEFAULT '',
    `event_name`    String              DEFAULT '',
    `data_key`      String              DEFAULT '',
    `data_type`     UInt8               DEFAULT 0,
    `string_value`  String              DEFAULT '',
    `number_value`  Nullable(Float64),
    `date_value`    Nullable(DateTime64(3, 'UTC')),
    -- visitor_data fields
    `visitor_id`    String              DEFAULT '',
    `distinct_id`   String              DEFAULT ''
) ENGINE = Null()

ORDER BY tuple()
;

CREATE TABLE IF NOT EXISTS k_replays (
    `stream_type`  String,
    `project_id`   String,
    `visitor_id`   String          DEFAULT '',
    `session_id`   String          DEFAULT '',
    `chunk_index`  UInt32          DEFAULT 0,
    `events`       String          DEFAULT '',
    `event_count`  UInt32          DEFAULT 0,
    `started_at`   DateTime64(3, 'UTC'),
    `ended_at`     DateTime64(3, 'UTC'),
    `created_at`   DateTime64(3, 'UTC')
) ENGINE = Null()

ORDER BY tuple()
;

CREATE TABLE IF NOT EXISTS k_telemetry (
    `stream_type`  String,
    `project_id`   String,
    `visitor_id`   String          DEFAULT '',
    `session_id`   String          DEFAULT '',
    `error_id`     String          DEFAULT '',
    `error_type`   LowCardinality(String) DEFAULT '',
    `message`      String          DEFAULT '',
    `filename`     String          DEFAULT '',
    `lineno`       Nullable(Int32),
    `colno`        Nullable(Int32),
    `stack`        String          DEFAULT '',
    `fingerprint`  String          DEFAULT '',
    `url_path`     String          DEFAULT '',
    `url_query`    String          DEFAULT '',
    `hostname`     LowCardinality(String) DEFAULT '',
    `browser`      LowCardinality(String) DEFAULT '',
    `os`           LowCardinality(String) DEFAULT '',
    `device`       LowCardinality(String) DEFAULT '',
    `country`      LowCardinality(String) DEFAULT '',
    `region`       LowCardinality(String) DEFAULT '',
    `city`         String          DEFAULT '',
    `level`        LowCardinality(String) DEFAULT 'error',
    `created_at`   DateTime64(3, 'UTC')
) ENGINE = Null()

ORDER BY tuple()
;

CREATE TABLE IF NOT EXISTS llm_events (
    `id`                        String,
    `project_id`                String,
    `session_id`                String          DEFAULT '',
    `visitor_id`                String          DEFAULT '',
    `trace_id`                  String          DEFAULT '',
    `parent_event_id`           String          DEFAULT '',
    `span_type`                 String          DEFAULT 'generation',
    `model`                     String,
    `provider`                  String,
    `prompt_tokens`             Nullable(Int64),
    `completion_tokens`         Nullable(Int64),
    `total_tokens`              Nullable(Int64),
    `latency_ms`                UInt32          DEFAULT 0,
    `cost`                      Nullable(Float64),
    `cost_details`              String          DEFAULT '',
    `payload`                   Nullable(String) DEFAULT '',
    `response`                  Nullable(String) DEFAULT '',
    `metadata`                  String          DEFAULT '{}',
    `tool_calls`                String          DEFAULT '[]',
    `tool_definitions`          String          DEFAULT '[]',
    `created_at`                DateTime64(3, 'UTC'),
    `status`                    String          DEFAULT '',
    `error_message`             String          DEFAULT '',
    `template_name`             String          DEFAULT '',
    `score`                     Nullable(Float64),
    `ttft_ms`                   Nullable(Int64),
    -- New fields (v2 — proxy architecture)
    `name`                      String          DEFAULT '',
    `level`                     String          DEFAULT 'default',
    `start_time`                Nullable(DateTime64(3, 'UTC')),
    `end_time`                  Nullable(DateTime64(3, 'UTC')),
    `completion_start_time`     Nullable(DateTime64(3, 'UTC')),
    `user_id`                   String          DEFAULT '',
    `environment`               String          DEFAULT '',
    `release`                   String          DEFAULT '',
    `version`                   String          DEFAULT '',
    `tags`                      String          DEFAULT '[]',
    `model_parameters`          String          DEFAULT '{}',
    `request_path`              String          DEFAULT '',
    `usage_unit`                String          DEFAULT 'tokens',
    `prompt_cache_read_tokens`  Nullable(Int64),
    `prompt_cache_write_tokens` Nullable(Int64),
    `reasoning_tokens`          Nullable(Int64),
    `usage_details`             String          DEFAULT '{}',
    `input_cost`                Nullable(Float64),
    `output_cost`               Nullable(Float64),
    `http_status_code`          Nullable(Int32),
    `error_code`                String          DEFAULT '',
    `prompt_id`                 String          DEFAULT '',
    `prompt_version`            Nullable(Int32),
    `scores`                    String          DEFAULT '[]',
    `country_code`              String          DEFAULT '',
    `body_truncated`            UInt8           DEFAULT 0
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (project_id, trace_id, created_at)
TTL toDateTime(created_at) + toIntervalMonth(6);

CREATE TABLE IF NOT EXISTS notification (
    `id`            String,
    `project_id`    String,
    `rule_id`       String       DEFAULT '',
    `title`         String,
    `message`       String,
    `type`          LowCardinality(String) DEFAULT 'event',
    `severity`      LowCardinality(String) DEFAULT 'info',
    `source`        LowCardinality(String) DEFAULT 'rule',
    `is_read`       UInt8        DEFAULT 0,
    `payload`       String       DEFAULT '',
    `created_at`    DateTime64(3, 'UTC')
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (project_id, created_at)
TTL toDateTime(created_at) + toIntervalYear(1);

CREATE TABLE IF NOT EXISTS project_error (
    `project_id`   String,
    `visitor_id`   String,
    `session_id`   String,
    `error_id`     String,
    `error_type`   LowCardinality(String) DEFAULT '',
    `message`      String          DEFAULT '',
    `filename`     String          DEFAULT '',
    `lineno`       Nullable(Int32),
    `colno`        Nullable(Int32),
    `stack`        String          DEFAULT '',
    `fingerprint`  String          DEFAULT '',
    `url_path`     String          DEFAULT '',
    `url_query`    String          DEFAULT '',
    `hostname`     LowCardinality(String) DEFAULT '',
    `browser`      LowCardinality(String) DEFAULT '',
    `os`           LowCardinality(String) DEFAULT '',
    `device`       LowCardinality(String) DEFAULT '',
    `country`      LowCardinality(String) DEFAULT '',
    `region`       LowCardinality(String) DEFAULT '',
    `city`         String          DEFAULT '',
    `level`        LowCardinality(String) DEFAULT 'error',
    `created_at`   DateTime64(3, 'UTC')
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (project_id, error_type, url_path, created_at)
TTL toDateTime(created_at) + toIntervalYear(2);

CREATE TABLE IF NOT EXISTS project_event (
    `project_id`      String,
    `visitor_id`      String,
    `session_id`        String,
    `event_id`        String,
    `hostname`        LowCardinality(String)  DEFAULT '',
    `url_path`        String          DEFAULT '',
    `url_query`       String          DEFAULT '',
    `referrer_path`   String          DEFAULT '',
    `referrer_query`  String          DEFAULT '',
    `referrer_domain` String          DEFAULT '',
    `page_title`      String          DEFAULT '',
    `event_type`      UInt8           DEFAULT 1,
    `event_name`      LowCardinality(String)  DEFAULT '',
    `tag`             LowCardinality(String)  DEFAULT '',
    `browser`         LowCardinality(String)  DEFAULT '',
    `os`              LowCardinality(String)  DEFAULT '',
    `device`          LowCardinality(String)  DEFAULT '',
    `screen`          LowCardinality(String)  DEFAULT '',
    `language`        LowCardinality(String)  DEFAULT '',
    `country`         LowCardinality(String)  DEFAULT '',
    `region`          LowCardinality(String)  DEFAULT '',
    `city`            String          DEFAULT '',
    `distinct_id`     String          DEFAULT '',
    `utm_source`      String          DEFAULT '',
    `utm_medium`      String          DEFAULT '',
    `utm_campaign`    String          DEFAULT '',
    `utm_content`     String          DEFAULT '',
    `utm_term`        String          DEFAULT '',
    `gclid`           String          DEFAULT '',
    `fbclid`          String          DEFAULT '',
    `msclkid`         String          DEFAULT '',
    `ttclid`          String          DEFAULT '',
    `li_fat_id`       String          DEFAULT '',
    `twclid`          String          DEFAULT '',
    `lcp`             Nullable(Float32),
    `inp`             Nullable(Float32),
    `cls`             Nullable(Float32),
    `fcp`             Nullable(Float32),
    `ttfb`            Nullable(Float32),
    `latitude`        Nullable(Float32),
    `longitude`       Nullable(Float32),
    `created_at`      DateTime64(3, 'UTC')
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (toStartOfHour(created_at), project_id, visitor_id, session_id, created_at)
TTL toDateTime(created_at) + toIntervalYear(2);

CREATE TABLE IF NOT EXISTS project_event_stats_hourly (
    `project_id`   String,
    `visitor_id`   String,
    `session_id`     String,
    `hostname`     LowCardinality(String)  DEFAULT '',
    `browser`      LowCardinality(String)  DEFAULT '',
    `os`           LowCardinality(String)  DEFAULT '',
    `device`       LowCardinality(String)  DEFAULT '',
    `screen`       LowCardinality(String)  DEFAULT '',
    `language`     LowCardinality(String)  DEFAULT '',
    `country`      LowCardinality(String)  DEFAULT '',
    `region`       LowCardinality(String)  DEFAULT '',
    `city`         String                DEFAULT '',
    `event_type`   UInt8                 DEFAULT 1,
    `event_name`   LowCardinality(String)  DEFAULT '',
    `tag`          LowCardinality(String)  DEFAULT '',
    `created_at`   DateTime,
    `min_time`     DateTime64(3, 'UTC'),
    `max_time`     DateTime64(3, 'UTC'),
    `views`        UInt64                DEFAULT 0,
    `visits`       UInt64                DEFAULT 0
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (toStartOfHour(created_at), project_id, visitor_id, session_id, event_type, event_name, tag)
TTL created_at + toIntervalYear(2);

CREATE TABLE IF NOT EXISTS project_revenue (
    `project_id`    String,
    `distinct_id`   String                    DEFAULT '',
    `session_id`    String                    DEFAULT '',
    `event_id`      String                    DEFAULT '',
    `event_name`    String                    DEFAULT '',
    `currency`               LowCardinality(String)    DEFAULT '',
    `revenue`                Decimal(18, 4),
    `provider`               LowCardinality(String)    DEFAULT '',
    `payment_connection_id`  String                    DEFAULT '',
    `created_at`             DateTime64(3, 'UTC')
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (project_id, session_id, created_at)
TTL toDateTime(created_at) + toIntervalYear(2);

CREATE TABLE IF NOT EXISTS project_session_stats (
    `project_id`      String,
    `session_id`      String,
    `session_date`    Date,
    `visitor_id`      AggregateFunction(argMax, String, DateTime64(3, 'UTC')),
    `browser`         AggregateFunction(argMax, String, DateTime64(3, 'UTC')),
    `os`              AggregateFunction(argMax, String, DateTime64(3, 'UTC')),
    `device`          AggregateFunction(argMax, String, DateTime64(3, 'UTC')),
    `country`         AggregateFunction(argMax, String, DateTime64(3, 'UTC')),
    `hostname`        AggregateFunction(argMax, String, DateTime64(3, 'UTC')),
    `screen`          AggregateFunction(argMax, String, DateTime64(3, 'UTC')),
    `language`        AggregateFunction(argMax, String, DateTime64(3, 'UTC')),
    `region`          AggregateFunction(argMax, String, DateTime64(3, 'UTC')),
    `city`            AggregateFunction(argMax, String, DateTime64(3, 'UTC')),
    `start_time`      AggregateFunction(min, DateTime64(3, 'UTC')),
    `end_time`        AggregateFunction(max, DateTime64(3, 'UTC')),
    `views`           AggregateFunction(sum, UInt64),
    `events`          AggregateFunction(sum, UInt64),
    `revenue`         AggregateFunction(sum, Decimal(18, 4))
) ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(session_date)
ORDER BY (project_id, session_id, session_date)
TTL session_date + toIntervalYear(2);

CREATE TABLE IF NOT EXISTS project_visitor_stats (
    `project_id`      String,
    `visitor_id`      String,
    `visitor_date`    Date,
    `start_time`      AggregateFunction(min, DateTime64(3, 'UTC')),
    `last_seen`       AggregateFunction(max, DateTime64(3, 'UTC')),
    `total_sessions`  AggregateFunction(uniq, String),
    `total_revenue`   AggregateFunction(sum, Decimal(18, 4))
) ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(visitor_date)
ORDER BY (project_id, visitor_id, visitor_date)
TTL visitor_date + toIntervalYear(2);

CREATE TABLE IF NOT EXISTS session_replay (
    `project_id`    String,
    `visitor_id`    String,
    `session_id`      String    DEFAULT '',
    `chunk_index`   UInt32    DEFAULT 0,
    `events`        String    DEFAULT '',
    `event_count`   UInt32    DEFAULT 0,
    `started_at`    DateTime64(3, 'UTC'),
    `ended_at`      DateTime64(3, 'UTC'),
    `created_at`    DateTime64(3, 'UTC')
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (project_id, session_id, chunk_index)
TTL toDateTime(created_at) + toIntervalMonth(3);

CREATE TABLE IF NOT EXISTS visitor_data (
    `project_id`    String,
    `visitor_id`    String,
    `distinct_id`   String         DEFAULT '',
    `data_key`      String,
    `data_type`     UInt8          DEFAULT 0,
    `string_value`  String         DEFAULT '',
    `number_value`  Nullable(Float64),
    `date_value`    Nullable(DateTime64(3, 'UTC')),
    `created_at`    DateTime64(3, 'UTC')
) ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (project_id, visitor_id, data_key)
TTL toDateTime(created_at) + toIntervalYear(2);

CREATE MATERIALIZED VIEW IF NOT EXISTS project_event_stats_hourly_mv
TO project_event_stats_hourly
AS
SELECT
        project_id,
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
        event_name,
        tag,
        toStartOfHour(project_event.created_at) AS created_at,
        min(project_event.created_at)           AS min_time,
        max(project_event.created_at)           AS max_time,
        count()                   AS views,
        uniq(session_id)            AS visits
    FROM project_event
    GROUP BY
        project_id,
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
        event_name,
        tag,
        toStartOfHour(project_event.created_at);

CREATE MATERIALIZED VIEW IF NOT EXISTS project_session_stats_mv
TO project_session_stats
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
    FROM project_event
    GROUP BY
        project_id,
        session_id;

CREATE MATERIALIZED VIEW IF NOT EXISTS project_visitor_stats_mv
TO project_visitor_stats
AS
SELECT
        project_id,
        visitor_id,
        toDate(min(created_at)) AS visitor_date,
        minState(created_at) AS start_time,
        maxState(created_at) AS last_seen,
        uniqState(session_id) AS total_sessions,
        sumState(CAST(0 AS Decimal(18, 4))) AS total_revenue
    FROM project_event
    GROUP BY
        project_id,
        visitor_id;

CREATE MATERIALIZED VIEW IF NOT EXISTS route
TO event_data
AS
SELECT
        project_id,
        session_id,
        event_id,
        url_path,
        event_name,
        data_key,
        data_type,
        string_value,
        number_value,
        date_value,
        created_at
    FROM k_properties
    WHERE stream_type = 'event_data';

CREATE MATERIALIZED VIEW IF NOT EXISTS route
TO llm_events
AS
SELECT
        id,
        project_id,
        session_id,
        visitor_id,
        trace_id,
        parent_event_id,
        span_type,
        model,
        provider,
        prompt_tokens,
        completion_tokens,
        total_tokens,
        latency_ms,
        cost,
        cost_details,
        payload,
        response,
        metadata,
        tool_calls,
        tool_definitions,
        created_at,
        status,
        error_message,
        template_name,
        score,
        ttft_ms,
        name,
        level,
        start_time,
        end_time,
        completion_start_time,
        user_id,
        environment,
        release,
        version,
        tags,
        model_parameters,
        request_path,
        usage_unit,
        prompt_cache_read_tokens,
        prompt_cache_write_tokens,
        reasoning_tokens,
        usage_details,
        input_cost,
        output_cost,
        http_status_code,
        error_code,
        prompt_id,
        prompt_version,
        scores,
        country_code,
        body_truncated
    FROM k_events
    WHERE stream_type = 'llm_events';

CREATE MATERIALIZED VIEW IF NOT EXISTS route
TO project_error
AS
SELECT
        project_id,
        visitor_id,
        session_id,
        error_id,
        error_type,
        message,
        filename,
        lineno,
        colno,
        stack,
        fingerprint,
        url_path,
        url_query,
        hostname,
        browser,
        os,
        device,
        country,
        region,
        city,
        level,
        created_at
    FROM k_telemetry
    WHERE stream_type = 'project_error';

CREATE MATERIALIZED VIEW IF NOT EXISTS route
TO project_event
AS
SELECT
        project_id,
        visitor_id,
        session_id,
        event_id,
        hostname,
        url_path,
        url_query,
        referrer_path,
        referrer_query,
        referrer_domain,
        page_title,
        event_type,
        event_name,
        tag,
        browser,
        os,
        device,
        screen,
        language,
        country,
        region,
        city,
        distinct_id,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term,
        gclid,
        fbclid,
        msclkid,
        ttclid,
        li_fat_id,
        twclid,
        lcp,
        inp,
        cls,
        fcp,
        ttfb,
        latitude,
        longitude,
        created_at
    FROM k_events
    WHERE stream_type = 'project_event';

CREATE MATERIALIZED VIEW IF NOT EXISTS route
TO project_revenue
AS
SELECT
        project_id,
        distinct_id,
        session_id,
        event_id,
        event_name,
        currency,
        revenue,
        provider,
        payment_connection_id,
        created_at
    FROM k_business
    WHERE stream_type = 'project_revenue';

CREATE MATERIALIZED VIEW IF NOT EXISTS route
TO session_replay
AS
SELECT
        project_id,
        visitor_id,
        session_id,
        chunk_index,
        events,
        event_count,
        started_at,
        ended_at,
        created_at
    FROM k_replays
    WHERE stream_type = 'session_replay';

CREATE MATERIALIZED VIEW IF NOT EXISTS route
TO visitor_data
AS
SELECT
        project_id,
        visitor_id,
        distinct_id,
        data_key,
        data_type,
        string_value,
        number_value,
        date_value,
        created_at
    FROM k_properties
    WHERE stream_type = 'visitor_data';

