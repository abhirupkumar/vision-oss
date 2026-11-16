import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { secret } from '../../lib/crypto';
import { getClientInfo, hasBlockedIp } from '../../lib/detect.js';
import { parseToken } from '../../lib/jwt.js';
import { getProject, saveRecording, isOrganizationLocked, isProjectLocked } from '@vision/db';

interface Cache {
  visitorId: string;
  sessionId: string;
}

const app = new Hono();

const schema = z.object({
  type: z.literal('record'),
  payload: z.object({
    project: z.string(),
    events: z.array(z.any()).max(200),
    chunkIndex: z.coerce.number().int().optional().default(0),
    timestamp: z.coerce.number().int().optional(),
  }),
});

// Simple regex isbot check
const BOT_REGEX = /bot|googlebot|crawler|spider|robot|crawling|lighthouse|pingdom|semrush|ahrefs|uptime|baidu|yandex|duckduckbot|slurp|facebookexternalhit|twitterbot|linkedinbot|embedly|quora/i;
function isbot(userAgent?: string): boolean {
  if (!userAgent) return false;
  return BOT_REGEX.test(userAgent);
}

function serializeError(err: any) {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  }
  return { message: String(err) };
}

app.post('/', zValidator('json', schema), async (c) => {
  try {
    const { payload } = c.req.valid('json');
    const { project: projectId, events, timestamp, chunkIndex = 0 } = payload;

    if (!events?.length) {
      return c.json({ ok: true });
    }

    // Parse cache token to get session info
    const cacheHeader = c.req.header('x-vision-cache') || c.req.header('x-sigma-cache');

    if (!cacheHeader) {
      return c.json({ message: 'Missing session token.' }, 400);
    }

    const cache = (await parseToken(cacheHeader, secret())) as Cache | null;

    if (!cache?.visitorId || !cache?.sessionId) {
      return c.json({ message: 'Invalid session token.' }, 400);
    }

    const { visitorId, sessionId } = cache;

    // Query directly to avoid stale Redis cache for replayEnabled
    const project = await getProject(projectId);

    if (!project) {
      return c.json({ message: 'Project not found.' }, 400);
    }

    const locked = project.organizationId
      ? await isOrganizationLocked(project.organizationId)
      : await isProjectLocked(project.id);

    if (locked) {
      return c.json({ disabled: true, reason: 'No active plan or subscription expired, cancelled, or exhausted' });
    }

    // We no longer block based on project.replayEnabled so that 
    // it works as long as the frontend script has data-session-replay="true".

    // Client info for bot/IP checks
    const { ip, userAgent } = await getClientInfo(c.req.raw, {});

    if (!process.env.DISABLE_BOT_CHECK && isbot(userAgent || '')) {
      return c.json({ beep: 'boop' });
    }

    if (hasBlockedIp(ip)) {
      return c.json({ message: 'Forbidden' }, 403);
    }

    // Compute timestamps from events
    const eventTimestamps = events
      .map((e: any) => Number(e?.timestamp))
      .filter((t: number) => Number.isFinite(t) && t > 0);

    const fallbackMs = (timestamp || Math.floor(Date.now() / 1000)) * 1000;
    const minTimestamp = eventTimestamps.length ? Math.min(...eventTimestamps) : fallbackMs;
    const maxTimestamp = eventTimestamps.length ? Math.max(...eventTimestamps) : fallbackMs;

    const startedAt = new Date(minTimestamp);
    const endedAt = new Date(maxTimestamp);

    console.log('[Record] Calling saveRecording with:', {
      projectId,
      visitorId,
      sessionId,
      eventCount: events.length,
      chunkIndex: 0,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
    });

    await saveRecording({
      projectId,
      visitorId,
      sessionId,
      events,
      eventCount: events.length,
      chunkIndex,
      startedAt,
      endedAt
    });

    console.log('[Record] saveRecording succeeded for sessionId:', sessionId);
    return c.json({ ok: true });
  } catch (err: any) {
    console.error('[Record] API error - full details:');
    console.error('  message:', err?.message);
    console.error('  code:', err?.code);
    console.error('  detail:', err?.detail);
    console.error('  constraint:', err?.constraint);
    console.error('  stack:', err?.stack);
    return c.json({ ok: false, error: serializeError(err) }, 500);
  }
});

export default app;
