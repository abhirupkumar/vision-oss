import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getFunnel } from '@vision/db';
import { canViewProject } from '../../../lib/permissions/project.js';
import { getQueryFilters, setProjectDate } from '../../../lib/request.js';
import { unauthorized } from '../../../lib/response.js';

const reportResultSchema = z.object({
  projectId: z.string(),
  parameters: z.any().optional(),
  filters: z.any().optional(),
});

const app = new Hono<{ Variables: { auth: any } }>();

app.post('/', zValidator('json', reportResultSchema), async (c) => {
  const { projectId, parameters, filters } = c.req.valid('json');
  const auth = c.get('auth');

  if (!(await canViewProject(auth, projectId))) {
    return unauthorized();
  }

  const projectParams = await setProjectDate(projectId, parameters || {});
  const queryFilters = await getQueryFilters(filters || {}, projectId);

  const data = await getFunnel(projectId, projectParams as any, queryFilters);
  return c.json(data);
});

export default app;
