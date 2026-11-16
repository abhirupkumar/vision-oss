import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getPixel, updatePixel, deletePixel } from '@vision/db';

const app = new Hono<{ Variables: { user: any } }>();

app.get('/', async (c) => {
  const id = c.req.param('pixelId');
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const pixel = await getPixel(id);
  return c.json(pixel || { error: 'Not found' }, pixel ? 200 : 404);
});

app.patch(
  '/',
  zValidator('json', z.any()),
  async (c) => {
    const id = c.req.param('pixelId');
    const user = c.get('user');
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const body = c.req.valid('json');
    const result = await updatePixel(id, body);
    return c.json(result);
  }
);

app.delete('/', async (c) => {
  const id = c.req.param('pixelId');
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  await deletePixel(id);
  return c.json({ success: true });
});

export default app;
