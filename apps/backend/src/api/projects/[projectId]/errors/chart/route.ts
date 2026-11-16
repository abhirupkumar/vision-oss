import { Hono } from 'hono';
import { getErrorChartData } from '@vision/db';
import { canViewProject } from '../../../../../lib/permissions/project.js';
import { getQueryFilters } from '../../../../../lib/request.js';
import { unauthorized } from '../../../../../lib/response.js';

const app = new Hono<{ Variables: { auth: any } }>();

app.get('/', async (c) => {
  const projectId = c.req.param('projectId');
  const auth = c.get('auth');

  if (!(await canViewProject(auth, projectId))) {
    return unauthorized();
  }

  const query = c.req.query();
  const filters = await getQueryFilters(query, projectId);
  const data = await getErrorChartData(projectId, filters);

  return c.json(data);
});

export default app;
