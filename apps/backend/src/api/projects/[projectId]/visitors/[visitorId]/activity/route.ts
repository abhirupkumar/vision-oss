import { Hono } from 'hono';
import { getVisitorActivity } from '@vision/db';
import { canViewProject } from '../../../../../../lib/permissions/project.js';
import { unauthorized } from '../../../../../../lib/response.js';

const app = new Hono<{ Variables: { auth: any } }>();

app.get('/', async (c) => {
  const projectId = c.req.param('projectId');
  const visitorId = c.req.param('visitorId');
  const auth = c.get('auth');

  if (!(await canViewProject(auth, projectId))) {
    return unauthorized();
  }

  const activity = await getVisitorActivity(projectId, visitorId);
  return c.json(activity);
});

export default app;
