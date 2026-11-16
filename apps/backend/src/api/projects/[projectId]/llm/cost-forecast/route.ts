import { Hono } from 'hono';
import { getLlmCostForecast } from '@vision/db';
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
    const data = await getLlmCostForecast(projectId);
    return c.json(data);
  } catch (err) {
    console.error('[llm/cost-forecast] error:', err);
    return c.json({ mtdCost: 0, projectedMonthCost: 0, daysElapsed: 1, daysInMonth: 30 });
  }
});

export default app;

