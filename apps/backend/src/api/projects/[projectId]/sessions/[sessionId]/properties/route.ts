import { Hono } from 'hono';
import { getSessionData } from '@vision/db';
import { canViewProject } from '../../../../../../lib/permissions/project.js';
import { unauthorized } from '../../../../../../lib/response.js';

const app = new Hono<{ Variables: { auth: any } }>();

app.get('/', async (c) => {
  const projectId = c.req.param('projectId');
  const sessionId = c.req.param('sessionId');
  const auth = c.get('auth');

  if (!(await canViewProject(auth, projectId))) {
    return unauthorized();
  }

  const data = await getSessionData(projectId, sessionId);
  return c.json(data);
});

export default app;
