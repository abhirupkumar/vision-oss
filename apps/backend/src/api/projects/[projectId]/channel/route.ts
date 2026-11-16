import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { canViewProject } from '@/lib/permissions/project.js';
import { unauthorized } from '@/lib/response.js';
import { pubsub } from '@/lib/pubsub.js';

const app = new Hono<{ Variables: { auth: any } }>();

// Detect if running in Node.js (local dev) vs Cloudflare Worker
const isNode =
  typeof process !== 'undefined' && process.release?.name === 'node';

app.get('/', async (c) => {
  const projectId = c.req.param('projectId');
  const auth = c.get('auth');

  if (!(await canViewProject(auth, projectId))) {
    return unauthorized();
  }

  return streamSSE(c, async (stream) => {
    let unsubscribe: (() => Promise<void>) | null = null;
    let keepAliveInterval: ReturnType<typeof setInterval> | null = null;

    try {
      unsubscribe = await pubsub.subscribe(`notify:${projectId}`, (message) => {
        try {
          const notification = JSON.parse(message);
          stream.writeSSE({
            data: JSON.stringify(notification),
            event: 'notification',
          });
        } catch {
          // Ignore parse errors
        }
      });

      // Send initial ping so the client knows connection is live
      await stream.writeSSE({ data: 'connected', event: 'ping' });

      stream.onAbort(async () => {
        if (keepAliveInterval) clearInterval(keepAliveInterval);
        if (unsubscribe) await unsubscribe().catch(() => {});
      });

      if (isNode) {
        // In Node.js: keep the connection alive with a periodic ping
        keepAliveInterval = setInterval(() => {
          stream.writeSSE({ data: 'ping', event: 'ping' });
        }, 25000);

        // Wait indefinitely until the client disconnects
        await new Promise<void>((resolve) => {
          stream.onAbort(() => resolve());
        });
      } else {
        // In Cloudflare Workers: SSE streams are stateless per-request.
        // The Upstash subscribe() call handles its own async loop internally.
        // We use a long timeout to keep the response open as long as possible.
        await new Promise<void>((resolve) => {
          // CF Worker max CPU time guard - resolve after 25s to send keepalive
          // The client (useChannelSSE) will reconnect automatically.
          const timeout = setTimeout(() => resolve(), 25000);
          stream.onAbort(() => {
            clearTimeout(timeout);
            resolve();
          });
        });

        // Send one final keepalive ping before closing so client knows to reconnect
        try {
          await stream.writeSSE({ data: 'reconnect', event: 'ping' });
        } catch {
          // Stream may already be closed
        }
      }
    } catch (err) {
      console.error('[channel SSE] Stream error', err);
      if (keepAliveInterval) clearInterval(keepAliveInterval);
      if (unsubscribe) await unsubscribe().catch(() => {});
    }
  });
});

export default app;
