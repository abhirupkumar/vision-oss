import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createUser, getUserByEmail } from '@vision/db';
import { canCreateUser } from '@/lib/permissions/user.js';
import { hashPassword } from '@/lib/password.js';

const app = new Hono<{ Variables: { auth: any } }>();

app.post(
  '/',
  zValidator(
    'json',
    z.object({
      id: z.string().uuid().optional(),
      email: z.string().email(),
      password: z.string().optional(),
      role: z.string().regex(/admin|user|view-only/i).optional(),
    })
  ),
  async (c) => {
    const auth = c.get('auth');
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);

    if (!(await canCreateUser(auth))) return c.json({ error: 'Unauthorized' }, 401);

    const body = c.req.valid('json');
    const { id, email, password, role } = body;

    const existingUser = await getUserByEmail(email, { showDeleted: true });

    if (existingUser) {
      return c.json({ error: 'User already exists' }, 400);
    }

    const newUser = await createUser({
      id: id || crypto.randomUUID(),
      clerkId: crypto.randomUUID(),
      email,
      password: password ? await hashPassword(password) : undefined,
      role: role ?? 'user',
    });

    return c.json(newUser);
  }
);

export default app;
