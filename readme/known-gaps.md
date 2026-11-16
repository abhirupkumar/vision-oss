# Known Gaps and Verification Notes

These are source-level observations to keep the architecture documentation honest.

## Tinybird Versus Direct ClickHouse

The shared routing layer is Tinybird-first, but several AI tools import and call the direct `clickhouse` client directly. That can bypass `TINYBIRD_URL` and produce different behavior from dashboard query modules. Before changing AI analytics, route those tools through the Tinybird-aware abstraction or explicitly document the required direct ClickHouse environment.

## Tracker Artifact
The canonical tracker is `apps/dashboard/src/tracker/index.js` (compiled to `public/script.js`), expecting `data-project-id` with optional `data-device-id`, exposing `window.vision.visitorId` and `window.vision.deviceId` (`null | string`). The redundant backend `/script.js` route has been decommissioned.

## Replay Endpoint Naming

The typed browser SDK constructs a replay endpoint at `/api/replay`, while the generated backend route inventory exposes `/record` and `recorder.js`. The dashboard tracker derives its replay endpoint from build placeholders. Verify the deployed rewrite/alias or align the SDK and backend route names.

## Aggregate Semantics

The visitor/session materialized pipelines use aggregate states and placeholder revenue values in their definitions. Queries rely on Tinybird/ClickHouse aggregate behavior and may differ from PostgreSQL fallback semantics. Validate counts, revenue, and date boundaries against raw `project_event` data after pipeline changes.

## AI Tool Completeness

Some tools are intentionally minimal or stubbed: segment listing returns hard-coded examples, event delta returns sample values, and LLM tool-call stats currently returns an empty array. Treat the AI toolkit as a mixed production/query surface rather than assuming every registered tool is backed by live analytics.

## Security and Data Handling

Some LLM query functions interpolate project IDs directly into SQL strings instead of consistently using typed parameters. Project validation still occurs at the route boundary, but parameterization and tenant-isolation tests should be added. Prompts, completions, profile properties, and replay DOM events can contain sensitive data and need explicit redaction and deletion procedures.
