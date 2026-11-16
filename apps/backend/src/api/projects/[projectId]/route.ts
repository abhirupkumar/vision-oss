import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  deleteProject,
  getProject,
  updateProject,
} from '@vision/db';
import {
  canDeleteProject,
  canUpdateProject,
  canViewProject
} from '../../../lib/permissions/project.js';
import { badRequest, ok, unauthorized } from '../../../lib/response.js';

const app = new Hono<{ Variables: { auth: any } }>();

app.get('/', async (c) => {
  const projectId = c.req.param('projectId');
  const auth = c.get('auth');

  if (!(await canViewProject(auth, projectId))) {
    return unauthorized();
  }

  const project = await getProject(projectId);

  return c.json(project);
});

const updateSchema = z.object({
  id: z.string().optional(),
  name: z.string().max(100).optional(),
  domain: z.string().max(500).optional(),
  shareId: z.string().nullable().optional(),
  autocaptureEnabled: z.boolean().optional(),
});

const handleUpdate = async (c: any) => {
  const projectId = c.req.param('projectId');
  const auth = c.get('auth');
  const data = c.req.valid('json');

  if (!(await canUpdateProject(auth, projectId))) {
    return unauthorized();
  }

  const { id: _ignoredId, ...updateData } = data;

  try {
    const project = await updateProject(projectId, updateData);
    return c.json(project);
  } catch (e: any) {
    if (e.message?.toLowerCase().includes('unique constraint') && e.message.includes('share_id')) {
      return badRequest({ message: 'That share ID is already taken.' });
    }
    throw e;
  }
};

app.post('/', zValidator('json', updateSchema), handleUpdate);
app.patch('/', zValidator('json', updateSchema), handleUpdate);

app.delete('/', async (c) => {
  const projectId = c.req.param('projectId');
  const auth = c.get('auth');

  if (!(await canDeleteProject(auth, projectId))) {
    return unauthorized();
  }

  await deleteProject(projectId);

  return ok();
});

export default app;
