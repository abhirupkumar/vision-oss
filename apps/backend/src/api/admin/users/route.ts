import { Hono } from 'hono';
import { getUsers } from '@vision/db';
import { unauthorized } from '../../../lib/response.js';

const app = new Hono<{ Variables: { user: any } }>();

// Middleware for admin check
app.use('*', async (c, next) => {
  const user = c.get('user');
  if (user?.role !== 'admin') {
    return unauthorized();
  }
  await next();
});

app.get('/', async (c) => {
  const query = c.req.query();
  const filters = {
    search: query.search,
    page: query.page ? parseInt(query.page) : undefined,
    pageSize: query.pageSize ? parseInt(query.pageSize) : undefined,
    orderBy: query.orderBy,
    sort: query.sort as any,
  };
  const result = await getUsers({ deletedAt: null }, filters as any);
  return c.json(result);
});

export default app;
