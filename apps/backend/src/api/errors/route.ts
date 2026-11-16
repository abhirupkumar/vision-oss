import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { isBot } from '@/lib/bots/index.js';
import { getClientInfo, hasBlockedIp } from '@/lib/detect.js';
import { fetchProject } from '@/lib/load.js';
import { saveErrorSpans, isOrganizationLocked, isProjectLocked } from '@vision/db';
import { redis } from '@vision/db';

const app = new Hono();

const errorSpanSchema = z.object({
  project: z.string().uuid(),
  errorType: z.string().max(100).default('Error'),
  message: z.string().max(2000),
  filename: z.string().max(500).optional(),
  lineno: z.coerce.number().int().optional(),
  colno: z.coerce.number().int().optional(),
  stack: z.string().max(10000).optional(),
  path: z.string().max(500).optional(),
  hostname: z.string().max(100).optional(),
  level: z.enum(['fatal', 'error', 'warning', 'info']).default('error'),
  anonymousId: z.string().optional(),
  sessionId: z.string().optional(),
  timestamp: z.coerce.number().int().optional(),
});

const batchedErrorsSchema = z.array(errorSpanSchema).max(20);

app.post('/', zValidator('json', batchedErrorsSchema), async (c) => {
  try {
    const payloads = c.req.valid('json');
    if (payloads.length === 0) {
      return c.json({ status: 'ok', count: 0 });
    }

    const projectId = payloads[0].project;
    const project = await fetchProject(projectId);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const locked = project.organizationId
      ? await isOrganizationLocked(project.organizationId)
      : await isProjectLocked(project.id);

    if (locked) {
      return c.json({ disabled: true, reason: 'No active plan or subscription expired, cancelled, or exhausted' });
    }

    // Process each span
    const spansToSave = [];
    for (const payload of payloads) {
      const { userAgent, browser, os, device, ip, country, region, city } = await getClientInfo(c.req.raw, {
        ip: c.req.header('x-forwarded-for'),
        userAgent: c.req.header('user-agent'),
        hostname: payload.hostname,
        browser: undefined,
        os: undefined,
        device: undefined,
      } as any);

      if (hasBlockedIp(ip)) {
        continue;
      }

      if (isBot(userAgent)) {
        continue;
      }

      spansToSave.push({
        projectId,
        sessionId: payload.sessionId || 'unknown',
        visitorId: payload.anonymousId || 'unknown',
        errorType: payload.errorType,
        message: payload.message,
        filename: payload.filename,
        lineno: payload.lineno,
        colno: payload.colno,
        stack: payload.stack,
        urlPath: payload.path,
        hostname: payload.hostname || c.req.header('host'),
        browser,
        os,
        device,
        country,
        region,
        city,
        level: payload.level,
        createdAt: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      });
    }

    if (spansToSave.length > 0) {
      await saveErrorSpans(spansToSave);
    }

    return c.json({ status: 'ok', count: spansToSave.length });
  } catch (error) {
    console.error('Failed to save errors:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

export default app;
