# LLM Observability

## Producers

LLM telemetry can come from:

- `sdk/js/llm`, which exports a client and `observe` helpers for Node applications.
- The browser/generated tracker `trackLLM` API.
- Direct REST calls to the backend `/llm` endpoint.

The recommended documented integration wraps model calls and records nested spans/tool calls. A trace has a root `traceId`, optional `parentEventId`, and `spanType` of `generation`, `span`, or `event`.

## Ingestion API

`apps/backend/src/api/llm/route.ts` validates the project, model/provider, token counts, latency, cost, prompt/output, tool definitions/calls, metadata, status, template, score, and TTFT. It persists asynchronously with `waitUntil` when the runtime supplies an execution context, otherwise it awaits the write.

The endpoint also exposes `GET /llm/traces/:traceId?projectId=...` after project validation. It returns spans ordered by creation time.

## Tinybird Storage

`llm_events` stores model/provider dimensions, token counts, latency, cost, prompt and completion text, serialized tool data, trace relationships, statuses, template names, quality scores, and TTFT. It is monthly partitioned with a six-month TTL. The normal `saveLlmEvent` path selects Tinybird first, then direct ClickHouse, then PostgreSQL.

When Kafka is enabled, LLM rows are sent through the LLM write path and are intended for Tinybird's native Kafka connector; the separate ingestion worker explicitly does not consume `llm_events`.

## Dashboard Metrics

Shared query functions provide recent events, total tokens/cost/latency, trace detail, time series, model breakdown, error counts, template performance, and related aggregations. The dashboard consumes these through authenticated project routes.

## AI Insight Layer

`apps/backend/src/lib/ai/tools` registers traffic, events, funnels, cohorts, sessions, visitors, revenue, performance, and replay tools for AI chat. Most tools query analytics aggregates directly. The source currently contains both Tinybird-aware shared query functions and tools that import the direct ClickHouse client, so AI query behavior must be verified in each deployment; see [Known gaps](./known-gaps.md).

## Data Sensitivity

Prompts, completions, tool arguments, metadata, and errors may contain sensitive application data. The current schema stores these fields as analytics text/JSON. Product integrations should redact secrets and personal data before sending them; retention is six months in the Tinybird datasource.
