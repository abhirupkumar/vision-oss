import { Hono } from 'hono';
import { getEventData } from '@vision/db';
import { canViewProject } from '../../../../../lib/permissions/project.js';
import { unauthorized } from '../../../../../lib/response.js';

const app = new Hono<{ Variables: { auth: any } }>();

app.get('/', async (c) => {
  const projectId = c.req.param('projectId');
  const eventId = c.req.param('eventId');
  const auth = c.get('auth');

  if (!(await canViewProject(auth, projectId))) {
    return unauthorized();
  }

  const data = await getEventData(projectId, eventId);
  return c.json(data);
});

export default app;
