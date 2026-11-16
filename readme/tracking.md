# Tracking

## Browser Collection

There are two tracker surfaces in the repository:

- `apps/dashboard/src/tracker/index.js` is the canonical tracker source used by the dashboard build (compiled to `public/script.js`). It supports pageviews, SPA navigation, clicks, manual events, identify, performance, errors, replay, and A/B testing, exposing `window.vision.visitorId` and `window.vision.deviceId`.
- `sdk/js/browser/src` provides a typed SDK with the same major capabilities and modular implementations for pageviews, clicks, performance, errors, replay, and A/B tests.

## Initialization and Controls

The tracker reads project and host configuration, initializes a first pageview, hooks History API navigation, and optionally enables performance, errors, and replay. Collection can be disabled by missing project ID, `sigma.disabled` in local storage, a domain mismatch, explicit DNT configuration, or a server response marking the project disabled.

URLs can exclude query strings and hashes. A `beforeSend` callback can transform or drop payloads before transmission. Credentials default to omitted unless configured otherwise.

## Event Payloads

Base properties include project, screen, language, title, hostname, URL, referrer, optional tag, and optional identity. Manual events add an event name and data. Data attributes use `data-vision-event` plus `data-vision-event-*` values. The backend validates event, identify, and performance envelopes with Zod and limits fields such as event names to 50 characters.

## Collection Processing

`apps/backend/src/api/send/route.ts`:

1. Validates exactly one project/link/pixel identifier.
2. Reads and validates a signed cache token when project collection is used.
3. Loads the project and rejects missing projects.
4. Resolves IP, user agent, device, browser, OS, and geo information.
5. Filters bots and blocked IPs.
6. Derives visitor and session IDs.
7. Normalizes URLs, referrers, UTM parameters, and click IDs.
8. Persists events through `saveEvent`, and identify data through visitor query functions.
9. Returns updated cache/session values to the tracker.

## Performance and Errors

The browser observes TTFB, FCP, LCP, CLS, and INP. Metrics are flushed after a timeout and on page hide/navigation. Error capture listens for `error` and `unhandledrejection`, then posts to `/errors`; server-side persistence computes a fingerprint from normalized error type, message, and path.

## Identity and Session Semantics

Tracking does not require cookies. Anonymous visitor IDs use a project-scoped UUID derived from IP, user agent, and a monthly salt. Identified visitors use the supplied distinct ID in the derivation. Sessions use an hourly salt and expire after 30 minutes of active collection when no historical timestamp is supplied. The signed cache carries project, visitor, session, and issue time between requests.
