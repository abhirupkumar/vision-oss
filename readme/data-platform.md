# Data Platform

## Database Priority

The authoritative selection logic is `packages/db/src/lib/routing.ts`:

1. If `TINYBIRD_URL` and `TINYBIRD_TOKEN` are set, Tinybird is selected for analytics queries and writes.
2. Otherwise, if `CLICKHOUSE_URL` is set, the legacy direct ClickHouse driver is selected.
3. Otherwise, PostgreSQL/Drizzle is selected for relational fallback.

Tinybird should therefore be treated as the primary analytics database in deployment diagrams and operational runbooks. `CLICKHOUSE_URL` describes the legacy direct ClickHouse path, not a competing primary in this deployment.

## Tinybird Adapter

`packages/db/src/lib/analytics/tinybird.ts` calls Tinybird's HTTP API:

- Queries use `/v0/sql` with bearer authentication and `FORMAT JSON`.
- Inserts use `/v0/events?name=<datasource>` with newline-delimited JSON.
- Truncate and delete operations use Tinybird datasource endpoints.
- Shared SQL helpers provide date formatting, filters, pagination, search, and parameter substitution.

The configured Tinybird project includes datasources for `project_event`, `project_error`, `llm_events`, `session_replay`, `visitor_data`, `project_revenue`, notifications, and pre-aggregated session/visitor/event statistics.

## Event Ingestion Modes

The analytics query modules can write directly through Tinybird or direct ClickHouse. When Kafka is enabled, telemetry is buffered via Aiven Kafka over the Kafka REST Proxy and consumed directly by Tinybird's native Kafka Connector without an intermediary worker.

To stay within Aiven's 5-topic free tier limit, events are distributed across two Aiven Kafka services:
- **Aiven Kafka Service 1 (`aiven_kafka_1` — 5 topics)**: `event`, `event_data`, `visitor_data`, `project_revenue`, `llm_events`.
- **Aiven Kafka Service 2 (`aiven_kafka_2` — 2 topics)**: `session_replay`, `project_error` (isolates heavy rrweb payloads and error traces).

Tinybird connects to both clusters via SASL_SSL and streams messages into each datasource with sub-second latency. The legacy `apps/ingestion-worker` is superseded by this native connector.

## Core Tinybird Datasources

| Datasource                   | Purpose                                                              | Retention / notes                       |
| ---------------------------- | -------------------------------------------------------------------- | --------------------------------------- |
| `project_event`              | Pageviews, custom events, device/context, UTM, click IDs, Web Vitals | Monthly partition; two-year TTL         |
| `project_error`              | Client/runtime error spans and fingerprints                          | Defined in Tinybird inventory           |
| `llm_events`                 | LLM generations/spans, tokens, cost, prompts, tools, quality         | Monthly partition; six-month TTL        |
| `session_replay`             | rrweb JSON chunks keyed by project/session/chunk                     | Monthly partition; three-month TTL      |
| `visitor_data`               | Flattened identify/profile properties                                | Used with `FINAL` in reads where needed |
| `project_revenue`            | Revenue attribution records                                          | Used by revenue metrics                 |
| `project_event_stats_hourly` | Hourly materialized event aggregates                                 | Built from `project_event`              |
| `project_session_stats`      | Session-level materialized aggregates                                | Built from `project_event`              |
| `project_visitor_stats`      | Visitor/day-level materialized aggregates                            | Built from `project_event`              |

## Materialized Pipelines

- `project_event_stats_hourly_pipeline.pipe` groups events by project, visitor, session, dimensions, event type/name, tag, and hour.
- `project_session_stats_pipeline.pipe` derives session dates, start/end, views, events, and dimensions.
- `project_visitor_stats_pipeline.pipe` derives visitor date, first/last seen, session count, and revenue placeholder.

These are optimized fast paths for dashboard and AI queries. Queries with event-column filters may use raw event paths instead of aggregates.

## PostgreSQL Role

Drizzle schema tables include users, projects, organizations, visitors, project events, event data, LLM events, errors/error groups, session replay records, and product configuration. The relational path is useful for local/smaller deployments and remains important for control-plane data even when analytics live in Tinybird.

## Caching

Redis is an optional query cache in `runQuery`; a cache key causes a 60-second fetch cache. The tracker also maintains a short-lived signed cache token from the collection API so project validation and session context can be reused between requests.

## Retention and Privacy

Tinybird TTLs currently make replay retention about three months, LLM retention six months, and raw project events two years. The tracker supports DNT, domain allowlists, search/hash exclusion, local disablement, and replay masking. These are collection controls, not a replacement for a formal data retention/deletion policy.
