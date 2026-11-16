import { Hono } from 'hono';
import { getOrganizationProjects } from '@vision/db';
import { canViewOrganization } from '../../../../lib/permissions/organization.js';
import { unauthorized } from '../../../../lib/response.js';

const app = new Hono<{ Variables: { auth: any; } }>();

app.get('/', async (c) => {
  const id = c.req.param('organizationId');
  const auth = c.get('auth');
  const query = c.req.query();
  const filters = {
    search: query.search,
    page: query.page ? parseInt(query.page) : undefined,
    pageSize: query.pageSize ? parseInt(query.pageSize) : undefined,
    orderBy: query.orderBy,
    sort: query.sort as any,
  };

  if (!(await canViewOrganization(auth, id))) {
    return unauthorized();
  }

  const projects = await getOrganizationProjects(id, filters as any);
  return c.json(projects);
});

export default app;
