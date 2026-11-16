import { Hono } from 'hono';
import { getProjectSegments, getValues } from '@vision/db';
import { canViewProject } from '../../../../lib/permissions/project.js';
import { getQueryFilters } from '../../../../lib/request.js';
import { SESSION_COLUMNS, EVENT_COLUMNS, SEGMENT_TYPES, FILTER_COLUMNS } from '../../../../lib/constants.js';
import { badRequest, unauthorized } from '../../../../lib/response.js';

const app = new Hono<{ Variables: { auth: any } }>();

app.get('/', async (c) => {
  const projectId = c.req.param('projectId');
  const auth = c.get('auth');

  if (!(await canViewProject(auth, projectId))) {
    return unauthorized();
  }

  const query = c.req.query();
  const { type } = query;

  if (!type || (!SESSION_COLUMNS.includes(type) && !EVENT_COLUMNS.includes(type) && !SEGMENT_TYPES[type])) {
    return badRequest();
  }

  let values: any[];

  if (SEGMENT_TYPES[type]) {
    values = (await getProjectSegments(projectId, type))?.data?.map(segment => ({
      value: segment.name,
    })) || [];
  } else {
    const filters = await getQueryFilters(query, projectId);
    values = await getValues(projectId, FILTER_COLUMNS[type as keyof typeof FILTER_COLUMNS] || type, filters);
  }

  return c.json(values.filter(n => n).sort());
});

export default app;
