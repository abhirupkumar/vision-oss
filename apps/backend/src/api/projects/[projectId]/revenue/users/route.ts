import { Hono } from 'hono';
import { getRevenueUsers } from '@vision/db';
import { canViewProject } from '../../../../../lib/permissions/project.js';
import { unauthorized } from '../../../../../lib/response.js';

const app = new Hono<{ Variables: { auth: any } }>();

app.get('/', async (c) => {
  const projectId = c.req.param('projectId');
  const auth = c.get('auth');

  if (!(await canViewProject(auth, projectId))) {
    return unauthorized();
  }

  const pageQuery = c.req.query('page');
  const page = pageQuery !== undefined ? Math.max(1, Number(pageQuery) || 1) : undefined;
  const limit = Math.max(1, Math.min(100, Number(c.req.query('limit') ?? (page ? 25 : 50))));

  try {
    const data = await getRevenueUsers(projectId, limit, page as any);
    return c.json(data);
  } catch (err) {
    console.error('[revenue/users] error:', err);
    return c.json(page !== undefined ? { data: [], total: 0, page: 1, limit, totalPages: 1 } : []);
  }
});

export default app;
