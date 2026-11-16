import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  getProjectSegment,
  updateSegment,
  deleteSegment,
} from '@vision/db';
import { canViewProject, canUpdateProject } from '../../../../../lib/permissions/project.js';
import { unauthorized, notFound, ok } from '../../../../../lib/response.js';

const app = new Hono<{ Variables: { auth: any } }>();

app.get('/', async (c) => {
  const projectId = c.req.param('projectId');
  const segmentId = c.req.param('segmentId');
  const auth = c.get('auth');

  if (!(await canViewProject(auth, projectId))) {
    return unauthorized();
  }

  const segment = await getProjectSegment(projectId, segmentId);
  if (!segment) {
    return notFound();
  }

  return c.json(segment);
});

app.post(
  '/',
  zValidator(
    'json',
    z.object({
      name: z.string().max(100).optional(),
      type: z.string().max(50).optional(),
      parameters: z.any().optional(),
    })
  ),
  async (c) => {
    const projectId = c.req.param('projectId');
    const segmentId = c.req.param('segmentId');
    const auth = c.get('auth');
    const data = c.req.valid('json');

    if (!(await canUpdateProject(auth, projectId))) {
      return unauthorized();
    }

    const segment = await getProjectSegment(projectId, segmentId);
    if (!segment) {
      return notFound();
    }

    const updated = await updateSegment(segmentId, data);

    return c.json(updated);
  }
);

app.delete('/', async (c) => {
  const projectId = c.req.param('projectId');
  const segmentId = c.req.param('segmentId');
  const auth = c.get('auth');

  if (!(await canUpdateProject(auth, projectId))) {
    return unauthorized();
  }

  const segment = await getProjectSegment(projectId, segmentId);
  if (!segment) {
    return notFound();
  }

  await deleteSegment(segmentId);

  return ok();
});

export default app;
