# Services and Operations

## Applications

| Location                | Role                                                                            | Runtime/build                                           |
| ----------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `apps/dashboard`        | Dashboard UI, tracker source, replay recorder, authenticated product experience | Next.js, React, optional OpenNext/Cloudflare deployment |
| `apps/backend`          | Hono collection and product API                                                 | Node server or Cloudflare Worker-compatible handler     |
| `apps/ingestion-worker` | Kafka REST consumer and Tinybird/ClickHouse batch inserter                      | Node process/container with health endpoint             |
| `apps/worker`           | Scheduled anomaly/insights scheduler and manual `/trigger`                      | Cloudflare Worker, cron every five minutes              |
| `apps/public`           | Static SPA asset worker                                                         | Cloudflare Worker + assets                              |
| `apps/docs`             | Product/developer documentation site                                            | Next.js/content app                                     |

## Packages and SDKs

`packages/db` is the central data access package. `packages/node` contains Node-facing helpers. `packages/shared-types` holds shared contracts. `sdk/js/browser` is the typed browser collector and `sdk/js/llm` is the LLM integration package. The repository also contains Python SDK directories for core and LLM integrations.

## Development Commands

From the repository root:

- `pnpm dev` runs the Turborepo development graph.
- `pnpm build` builds workspace packages/apps according to Turbo.
- `pnpm typecheck` runs workspace typechecks.
- `pnpm lint` runs workspace linting.
- `pnpm db:generate`, `pnpm db:push`, and `pnpm db:studio` operate on the Drizzle package.

Dashboard-specific commands build the tracker, run Next.js, run typecheck/tests, and build/deploy through OpenNext/Cloudflare. Backend has `routes:generate`, `typecheck`, and Node development scripts. The generated backend index should be regenerated from route files rather than edited by hand.

## Important Environment Groups

- Analytics: `TINYBIRD_URL`, `TINYBIRD_TOKEN`; legacy `CLICKHOUSE_URL`.
- Relational: `DATABASE_URL`.
- Queue: Kafka REST URL and credentials, plus Kafka/Redis toggles used by shared helpers.
- Runtime: `PORT`, Cloudflare bindings, worker enablement/concurrency/interval settings.
- Integrations/auth: Clerk, Mailgun/Resend, Slack, payment providers, AI provider credentials.

## Deployment Notes

The backend injects Cloudflare Worker bindings into `process.env` per request so shared Node-oriented code can run under a Worker-compatible Hono runtime. The ingestion worker uses Kafka REST, manually recreates evicted consumer instances, commits offsets after writes, and exposes `/health` to prevent sleeping on hosting plans.

The scheduled worker runs every five minutes but dispatch behavior is controlled by environment flags. Its name and logs currently describe anomaly/insights scheduling rather than collection.

## Operational Checks

1. Confirm Tinybird URL/token are present before diagnosing empty analytics.
2. Confirm Tinybird datasources and materialized pipes are deployed from `packages/db/tinybird`.
3. Confirm Kafka topic mappings and native LLM connector behavior when queueing is enabled.
4. Check backend public route availability for tracker and replay endpoints.
5. Verify dashboard and SDK endpoint/attribute versions match the deployed tracker artifact.
6. Verify retention and redaction expectations for prompts, profiles, replay DOM data, and raw events.
