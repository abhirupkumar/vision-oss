import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db, User } from '@vision/db';
import { eq } from 'drizzle-orm';

const app = new Hono<{ Variables: { user: any } }>();

app.get('/', (c) => {
  return c.json(c.get('user'));
});

app.patch(
  '/',
  zValidator(
    'json',
    z.object({
      displayName: z.string().optional(),
      logoUrl: z.string().optional(),
    })
  ),
  async (c) => {
    const data = c.req.valid('json');
    const user = c.get('user');
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const [updated] = await db
      .update(User)
      .set(data)
      .where(eq(User.id, user.id))
      .returning();

    return c.json(updated);
  }
);

export default app;
