import { Hono } from 'hono';
import { getLlmCountryBreakdown } from '@vision/db';
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
    const data = await getLlmCountryBreakdown(projectId);
    return c.json(data);
  } catch (err) {
    console.error('[llm/country-breakdown] error:', err);
    return c.json([]);
  }
});

export default app;

