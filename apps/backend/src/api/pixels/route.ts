import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getUserPixels, createPixel } from '@vision/db';

const app = new Hono<{ Variables: { user: any } }>();

app.get('/', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const pixels = await getUserPixels(user.id);
  return c.json(pixels);
});

app.post(
  '/',
  zValidator(
    'json',
    z.object({
      name: z.string().max(100),
      url: z.string().max(500),
      slug: z.string().max(100),
      organizationId: z.string().nullable().optional(),
      id: z.string().uuid().nullable().optional(),
    })
  ),
  async (c) => {
    const user = c.get('user');
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const body = c.req.valid('json');
    const { id, name, url, slug, organizationId } = body;

    const data: any = {
      id: id ?? crypto.randomUUID(),
      name,
      url,
      slug,
      organizationId,
    };

    if (!organizationId) {
      data.userId = user.id;
    }

    const result = await createPixel(data);
    return c.json(result);
  }
);

export default app;
