import { Hono } from 'hono';
import { getLlmTimeSeries } from '@vision/db';
import { canViewProject } from '../../../../../lib/permissions/project.js';
import { unauthorized } from '../../../../../lib/response.js';

const app = new Hono<{ Variables: { auth: any } }>();

app.get('/', async (c) => {
  const projectId = c.req.param('projectId');
  const auth = c.get('auth');

  if (!(await canViewProject(auth, projectId))) {
    return unauthorized();
  }

  const { startDate, endDate, granularity = 'day' } = c.req.query();

  try {
    const data = await getLlmTimeSeries(
      projectId,
      new Date(startDate ?? Date.now() - 30 * 24 * 60 * 60 * 1000),
      new Date(endDate ?? Date.now()),
      granularity as 'day' | 'hour',
    );
    return c.json(data);
  } catch (err) {
    console.error('[llm/series] error:', err);
    return c.json([]);
  }
});

export default app;

