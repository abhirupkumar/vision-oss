import { Hono } from 'hono';
import { resolveErrorGroup } from '@vision/db';
import { canViewProject } from '../../../../../../lib/permissions/project.js';
import { unauthorized } from '../../../../../../lib/response.js';

const app = new Hono<{ Variables: { auth: any } }>();

app.post('/', async (c) => {
  const projectId = c.req.param('projectId');
  const fingerprint = c.req.param('fingerprint');
  const auth = c.get('auth');

  if (!(await canViewProject(auth, projectId))) {
    return unauthorized();
  }

  await resolveErrorGroup(projectId, fingerprint);

  return c.json({ status: 'ok' });
});

export default app;
