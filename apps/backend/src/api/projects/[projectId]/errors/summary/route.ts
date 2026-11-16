import { Hono } from 'hono';
import { getErrorSummary } from '@vision/db';
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
  const data = await getErrorSummary(projectId, filters);

  return c.json(data[0] || { totalErrors: 0, uniqueErrorTypes: 0, affectedUsers: 0, affectedSessions: 0, errorRate: 0 });
});

export default app;
