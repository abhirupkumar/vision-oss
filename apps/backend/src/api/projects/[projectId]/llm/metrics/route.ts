import { Hono } from 'hono';
import { getLlmMetrics } from '@vision/db';
import { canViewProject } from '../../../../../lib/permissions/project.js';
import { unauthorized } from '../../../../../lib/response.js';

const app = new Hono<{ Variables: { auth: any } }>();

app.get('/', async (c) => {
  const projectId = c.req.param('projectId');
  const auth = c.get('auth');

  if (!(await canViewProject(auth, projectId))) {
    return unauthorized();
  }

  try {
    const data = await getLlmMetrics(projectId);
    return c.json(data);
  } catch (err) {
    console.error('[llm/metrics] error:', err);
    return c.json({ totalTokens: 0, totalCost: 0, avgLatency: 0, avgTtft: 0, cacheReads: 0, cacheWrites: 0 });
  }
});

export default app;

