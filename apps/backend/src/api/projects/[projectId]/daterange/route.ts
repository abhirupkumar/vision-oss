import { Hono } from 'hono';
import { getProjectDateRange } from '@vision/db';
import { canViewProject } from '../../../../lib/permissions/project.js';
import { unauthorized } from '../../../../lib/response.js';

const app = new Hono<{ Variables: { auth: any } }>();

app.get('/', async (c) => {
  const projectId = c.req.param('projectId');
  const auth = c.get('auth');

  if (!(await canViewProject(auth, projectId))) {
    return unauthorized();
  }

  const dateRange = await getProjectDateRange(projectId);
  return c.json(dateRange);
});

export default app;
