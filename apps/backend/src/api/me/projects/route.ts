import { Hono } from 'hono';
import { getAllUserProjectsIncludingOrganizationOwner, getUserProjects } from '@vision/db';

const app = new Hono<{ Variables: { user: any } }>();

app.get('/', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const query = c.req.query();
  const filters = {
    search: query.search,
    page: query.page ? parseInt(query.page) : undefined,
    pageSize: query.pageSize ? parseInt(query.pageSize) : undefined,
    orderBy: query.orderBy,
    sort: query.sort as any,
  };

  if (query.includeOrganizations) {
    const data = await getAllUserProjectsIncludingOrganizationOwner(user.id, filters as any);
    return c.json(data);
  }

  const data = await getUserProjects(user.id, filters as any);
  return c.json(data);
});

export default app;
