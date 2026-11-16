import { Hono } from 'hono';
import { canViewProject } from '@/lib/permissions/project.js';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getNotifications, getUnreadNotificationCount } from '@vision/db';

const app = new Hono<{ Variables: { auth: any } }>();

app.use('*', async (c, next) => {
  const auth = c.get('auth');
  const projectId = c.req.param('projectId');
  if (!(await canViewProject(auth, projectId))) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
});

const querySchema = z.object({
  source: z.string().optional(),
  type: z.string().optional(),
  severity: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

app.get('/', zValidator('query', querySchema), async (c) => {
  const projectId = c.req.param('projectId');
  const query = c.req.valid('query');
  const notifications = await getNotifications(projectId, query);
  return c.json({ notifications });
});

app.get('/unread-count', async (c) => {
  const projectId = c.req.param('projectId');
  const count = await getUnreadNotificationCount(projectId);
  return c.json({ count });
});

// mark-read is a no-op when using ClickHouse/Tinybird (read state is managed client-side).
// Kept for compatibility with relational setups.
app.post('/mark-read', zValidator('json', z.object({ ids: z.array(z.string()) })), async (c) => {
  // In ClickHouse mode this is a no-op; the client manages read state in localStorage.
  return c.json({ success: true });
});

export default app;
