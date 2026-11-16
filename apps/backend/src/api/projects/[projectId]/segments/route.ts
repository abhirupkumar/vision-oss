import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  createSegment,
  getProjectSegments,
} from '@vision/db';
import { canViewProject, canUpdateProject } from '../../../../lib/permissions/project.js';
import { getQueryFilters } from '../../../../lib/request.js';
import { unauthorized } from '../../../../lib/response.js';

const app = new Hono<{ Variables: { auth: any } }>();

app.get('/', async (c) => {
  const projectId = c.req.param('projectId');
  const auth = c.get('auth');

  if (!(await canViewProject(auth, projectId))) {
    return unauthorized();
  }

  const query = c.req.query();
  const filters = await getQueryFilters(query, projectId);
  
  // type is passed in the query params (e.g. 'segment' or 'cohort')
  const type = query.type || 'segment';

  const segments = await getProjectSegments(projectId, type, filters);

  return c.json(segments);
});

app.post(
  '/',
  zValidator(
    'json',
    z.object({
      name: z.string().max(100),
      type: z.string().max(50),
      parameters: z.any().optional(),
    })
  ),
  async (c) => {
    const projectId = c.req.param('projectId');
    const auth = c.get('auth');
    const data = c.req.valid('json');

    if (!(await canUpdateProject(auth, projectId))) {
      return unauthorized();
    }

    const segment = await createSegment({
      projectId,
      ...data,
    });

    return c.json(segment);
  }
);

export default app;
