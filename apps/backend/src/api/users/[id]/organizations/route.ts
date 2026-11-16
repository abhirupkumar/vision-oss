import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getUserOrganizations } from '@vision/db';

const app = new Hono<{ Variables: { auth: any } }>();

app.get(
  '/',
  zValidator('query', z.any()),
  async (c) => {
    const auth = c.get('auth');
    const userId = c.req.param('id');

    if (!auth || (auth.user.id !== userId && !auth.user.isAdmin)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const query = c.req.valid('query') || {};
    const organizations = await getUserOrganizations(userId, query);

    return c.json(organizations);
  }
);

export default app;
