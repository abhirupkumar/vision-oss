import { Hono } from 'hono';
import { getLlmUserBreakdown } from '@vision/db';
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
    const page = Math.max(1, Number(c.req.query('page') ?? 1));
    const limit = Math.max(1, Math.min(100, Number(c.req.query('limit') ?? 25)));
    const data = await getLlmUserBreakdown(projectId, limit, page);
    return c.json(data);
  } catch (err) {
    console.error('[llm/user-breakdown] error:', err);
    return c.json({ data: [], total: 0, page: 1, limit: 25, totalPages: 0 });
  }
});

export default app;

