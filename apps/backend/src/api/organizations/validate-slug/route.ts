import { Hono } from 'hono';
import { getOrganization } from '@vision/db';

const app = new Hono();

app.get('/', async (c) => {
  const slug = c.req.query('slug');

  if (!slug) {
    return c.json({ error: 'Missing slug' }, 400);
  }

  const organization = await getOrganization(slug);

  return c.json({ available: !organization });
});

export default app;
