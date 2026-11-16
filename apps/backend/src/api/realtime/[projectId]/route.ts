import { Hono } from 'hono';
import { startOfMinute, subMinutes } from 'date-fns';
import { REALTIME_RANGE } from '../../../lib/constants.js';
import { getQueryFilters } from '../../../lib/request.js';
import { unauthorized } from '../../../lib/response.js';
import { canViewProject } from '../../../lib/permissions/project.js';
import { getRealtimeData } from '@vision/db';

const app = new Hono<{ Variables: { auth: any } }>();

app.get('/', async (c) => {
  const projectId = c.req.param('projectId');
  const auth = c.get('auth');

  if (!(await canViewProject(auth, projectId))) {
    return unauthorized();
  }

  const query = c.req.query();
  const filters = await getQueryFilters(
    {
      ...query,
      startAt: subMinutes(startOfMinute(new Date()), REALTIME_RANGE).getTime().toString(),
      endAt: Date.now().toString(),
    },
    projectId
  );

  const data = await getRealtimeData(projectId, filters);

  return c.json(data);
});

export default app;
