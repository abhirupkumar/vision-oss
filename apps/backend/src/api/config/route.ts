import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => {
  return c.json({
    cloudMode: !!process.env.CLOUD_MODE,
    analyticsBackend: (process.env.TINYBIRD_URL && process.env.TINYBIRD_TOKEN) ? 'tinybird' : 'clickhouse',
    faviconUrl: process.env.FAVICON_URL,
    linksUrl: process.env.LINKS_URL,
    pixelsUrl: process.env.PIXELS_URL,
    privateMode: !!process.env.PRIVATE_MODE,
    telemetryDisabled: !!process.env.DISABLE_TELEMETRY,
    trackerScriptName: process.env.TRACKER_SCRIPT_NAME,
    updatesDisabled: !!process.env.DISABLE_UPDATES,
  });
});

export default app;
