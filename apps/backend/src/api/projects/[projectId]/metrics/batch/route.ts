import { Hono } from 'hono';
import { getSessionMetrics, getEventMetrics, getPageviewMetrics, getChannelMetrics } from '@vision/db';
import { canViewProject } from '../../../../../lib/permissions/project.js';
import { getQueryFilters } from '../../../../../lib/request.js';
import { SESSION_COLUMNS, EVENT_COLUMNS, EVENT_TYPE } from '../../../../../lib/constants.js';
import { badRequest, unauthorized } from '../../../../../lib/response.js';

const app = new Hono<{ Variables: { auth: any } }>();

app.get('/', async (c) => {
  const projectId = c.req.param('projectId');
  const auth = c.get('auth');

  if (!(await canViewProject(auth, projectId))) {
    return unauthorized();
  }

  const query = c.req.query();
  const { types, limit, offset, search } = query;
  if (!types) return badRequest();

  const filters = await getQueryFilters(query, projectId);
  const typesArray = types.split(',').map(t => t.trim()).filter(Boolean);
  const result: Record<string, any> = {};

  const limitNum = limit ? parseInt(limit) : undefined;
  const offsetNum = offset ? parseInt(offset) : undefined;

  const promises = typesArray.map(async (type) => {
    try {
      let data = null;
      const currentFilters = { ...filters };

      if (search) {
        (currentFilters as any)[type] = `c.${search}`;
      }

      if (SESSION_COLUMNS.includes(type)) {
        data = await getSessionMetrics(projectId, { type, limit: limitNum, offset: offsetNum }, currentFilters);
      } else if (EVENT_COLUMNS.includes(type)) {
        if (type === 'event') {
          currentFilters.eventType = EVENT_TYPE.customEvent;
          data = await getEventMetrics(projectId, { type, limit: limitNum, offset: offsetNum }, currentFilters);
        } else {
          data = await getPageviewMetrics(projectId, { type, limit: limitNum, offset: offsetNum }, currentFilters);
        }
      } else if (type === 'channel') {
        data = await getChannelMetrics(projectId, currentFilters);
      }

      result[type] = data || [];
    } catch (err: any) {
      console.error(`[metrics/batch] Error fetching metric '${type}':`, err?.message || err);
      result[type] = [];
    }
  });

  await Promise.all(promises);
  return c.json(result);
});

export default app;
