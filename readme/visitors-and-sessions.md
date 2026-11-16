# Visitors and Sessions

## Identity Model

A visitor is project-scoped. Anonymous identity is derived server-side from project, IP, user agent, and a rotating monthly salt. An explicit identify/distinct ID creates a stable project-scoped identity. The tracker exposes `identify`, `getIds`, and `getSession` to integrations.

Visitor profile fields include distinct ID, first/last name, email, avatar, arbitrary properties, and device/geo context. `visitor_data` stores flattened property values by data key and type for analytics filtering.

## Session Model

A session is derived from visitor ID and an hourly salt and is refreshed after 30 minutes of active requests. The cache token returned by `/send` carries visitor/session context. Sessions are not cookie-dependent, which supports privacy-oriented collection but makes the server's derivation and timestamp behavior central to attribution.

## Persistence

For PostgreSQL-only deployments, collection creates a relational visitor record and events reference it. For Tinybird/ClickHouse deployments, the event stream carries visitor and session IDs; visitor and session views are reconstructed from `project_event`, `visitor_data`, and materialized statistics. This is why the relational `visitor` table is not the sole source of truth in Tinybird mode.

## Dashboard Queries

The shared analytics session module supports:

- Visitor lists with date, search, identified, and dimension filters.
- Visitor profile summaries with first/last activity, sessions, views, events, and total time.
- Visitor activity timelines and event-data availability.
- Session lists, session summaries, weekly statistics, and activity timelines.
- Session data properties and values.
- Replay lookup connected to visitor/session IDs.

Tinybird visitor/session queries use `uniq`, `sumIf`, grouped event scans, and pre-aggregated `project_session_stats`/`project_visitor_stats` where appropriate. The AI tools query the visitor/session statistics datasources for recent lists and aggregate metrics.

## Revenue and Attribution

Event data can carry revenue and currency. The analytics write path emits revenue records used by `project_revenue`, visitor/session summaries, revenue reports, and AI revenue tools. UTM parameters and advertising click IDs are normalized from page URLs during event collection.

## Privacy and Operations

Visitor IDs are pseudonymous unless the customer calls identify. Profile and arbitrary property payloads still require customer-side minimization. Deletion/reset behavior should be tested across raw events, materialized aggregates, visitor data, replay rows, and relational profile records because Tinybird is append-oriented and uses TTLs/materialized views.
