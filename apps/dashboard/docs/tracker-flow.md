# Tracker Data Flow

The tracker script (`src/tracker/index.js`) is the data collection agent that runs on client projects.

## 1. Initialization
When embedded on a project, the tracker script reads its attributes (`data-project-id`, `data-host-url`, etc.) and sets up event listeners. It does not use cookies, ensuring GDPR compliance by default.

## 2. Event Tracking
- **Page Views**: The script hooks into the browser's `History API` (`pushState`, `replaceState`) to detect client-side navigation. This ensures Single Page Applications (SPAs) are tracked accurately without full page reloads.
- **Click Events**: It attaches a global click listener to the `document`. If a user clicks an element containing `data-umami-event="eventName"`, it automatically extracts any associated `data-umami-event-*` attributes and sends a custom event.
- **Manual Tracking**: Exposes the `window.umami.track(eventName, eventData)` and `window.umami.identify(id, data)` methods for developers to trigger events programmatically.

## 3. Data Transmission
- Events are sent via a `fetch()` POST request to the Collection API (`/api/send`).
- The payload contains `project`, `hostname`, `url`, `referrer`, `screen`, `language`, and the event name/data.

## 4. API Processing (`/api/send`)
1. **Validation**: Uses Zod to ensure the payload is well-formed.
2. **Caching**: Uses a short-lived JWT token passed via the `x-umami-cache` header to avoid querying the database for project validation on every hit.
3. **Bot & IP Detection**: Rejects traffic from known bot User-Agents or blocked IPs.
4. **Session Resolution**: Derives a `sessionId` securely without relying on cookies. Uses a hash of the visitor's IP, User-Agent, and a rotating monthly salt (or a provided distinct ID).
5. **Persistence**: Writes the visit and event data into PostgreSQL (Prisma) or ClickHouse depending on configuration.
