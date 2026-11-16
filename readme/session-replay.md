# Session Replay

## Capture

Replay is opt-in. The browser tracker samples sessions, dynamically loads `recorder.js`, and starts `@rrweb/all` only after a collection session/cache is available. Configuration includes sample rate, masking level, maximum duration, and a block selector.

The current recorder masks inputs by default, disables canvas and cross-origin iframe recording, supports optional blocked elements, and stops after the configured duration. The documented default maximum is five minutes.

## Chunking and Transport

`apps/dashboard/src/tracker/recorder.js` buffers rrweb events and sends them to the replay endpoint as records containing project, events, chunk index, and timestamp. It flushes immediately after the full snapshot, at 50 events, every five seconds, on visibility change, and before unload. Keepalive is used only when the payload is below the browser-safe size threshold.

The backend `/record` route receives replay chunks and calls `saveRecording`. If Kafka is enabled, the row is published to the `session_replay` topic; otherwise it is inserted into Tinybird's `session_replay` datasource (or the selected fallback).

## Storage Model

Each Tinybird row is keyed by project, session, visitor, and chunk index and stores JSON event text, event count, start/end timestamps, and creation time. Tinybird currently retains these rows for three months. PostgreSQL fallback compresses event JSON with gzip into the `session_replay` bytea column.

## Reading and Playback

Protected dashboard routes list replays and fetch chunks at `/projects/:projectId/replays` and `/projects/:projectId/replays/:sessionId/chunks`. The shared replay query joins replay chunks to project events for visitor/device/date filtering, aggregates duration and chunk counts, and orders by latest activity. Relational reads gunzip stored chunks; Tinybird reads parse the JSON rows. The UI reassembles chunks for rrweb playback and supports saved replay metadata.

## Privacy Boundary

Masking and blocking happen in the browser before data leaves the site. Replay access is protected by the dashboard API. Review masking configuration whenever new UI fields or sensitive surfaces are introduced.
