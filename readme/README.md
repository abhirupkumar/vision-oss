# Vision Architecture Documentation

This folder documents the Vision Analytics monorepo from the source currently in the repository.

## Start Here

- [System architecture](./system-architecture.md) - components, boundaries, runtime, and request flows
- [Data platform](./data-platform.md) - Tinybird-first analytics storage, PostgreSQL, Kafka, Redis, schemas, and retention
- [Tinybird](./tinybird.md) - Information related to inybird setup for running locally as well as deploying in cloud.
- [Tracking](./tracking.md) - browser collection, identity, sessions, events, errors, and performance
- [Session replay](./session-replay.md) - rrweb capture, chunking, ingestion, storage, and playback
- [LLM observability](./llm-observability.md) - SDK/API tracing, metrics, tool calls, and dashboard access
- [Visitors and sessions](./visitors-and-sessions.md) - visitor identity, session grouping, profiles, and analytics queries
- [Services and operations](./services-and-operations.md) - apps, packages, workers, commands, environment, and deployment notes
- [Known gaps](./known-gaps.md) - source-level inconsistencies and areas to verify before production changes

## Architectural Ground Truth

Tinybird is the primary ClickHouse-compatible analytics database for this deployment. The shared query layer selects Tinybird when both `TINYBIRD_URL` and `TINYBIRD_TOKEN` are present. Direct ClickHouse is the legacy alternative, and PostgreSQL is the relational fallback/control-plane store.

## Scope and Method

This is a source-based architecture overview. File paths point to the implementation that decides behavior. Existing product docs may contain older Umami names or older endpoint attributes; the known-gaps document calls those out where they differ from current source.
