import { Hono } from 'hono';
import { getSessionMetrics, getEventMetrics, getPageviewMetrics, getChannelMetrics } from '@vision/db';
import { canViewProject } from '../../../../lib/permissions/project.js';
import { getQueryFilters } from '../../../../lib/request.js';
import { SESSION_COLUMNS, EVENT_COLUMNS, EVENT_TYPE } from '../../../../lib/constants.js';
import { badRequest, unauthorized } from '../../../../lib/response.js';

const app = new Hono<{ Variables: { auth: any } }>();

app.get('/', async (c) => {
  const projectId = c.req.param('projectId');
  const auth = c.get('auth');

  if (!(await canViewProject(auth, projectId))) {
    return unauthorized();
  }

  const query = c.req.query();
  const { type, limit, offset, search } = query;
  if (!type) return badRequest();

  const filters = await getQueryFilters(query, projectId);

  if (search) {
    (filters as any)[type] = `c.${search}`;
  }

  const limitNum = limit ? parseInt(limit) : undefined;
  const offsetNum = offset ? parseInt(offset) : undefined;

  if (SESSION_COLUMNS.includes(type)) {
    const data = await getSessionMetrics(projectId, { type, limit: limitNum, offset: offsetNum }, filters);
    return c.json(data);
  }

  if (EVENT_COLUMNS.includes(type)) {
    if (type === 'event') {
      filters.eventType = EVENT_TYPE.customEvent;
      const data = await getEventMetrics(projectId, { type, limit: limitNum, offset: offsetNum }, filters);
      return c.json(data);
    } else {
      const data = await getPageviewMetrics(projectId, { type, limit: limitNum, offset: offsetNum }, filters);
      return c.json(data);
    }
  }

  if (type === 'channel') {
    const data = await getChannelMetrics(projectId, filters);
    return c.json(data);
  }

  return badRequest();
});

export default app;
