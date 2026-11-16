import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getUser, updateUser, deleteUser, getUserByEmail } from '@vision/db';
import { canViewUser, canUpdateUser, canDeleteUser } from '@/lib/permissions/user.js';
import { hashPassword } from '@/lib/password.js';

const app = new Hono<{ Variables: { auth: any } }>();

app.get('/', async (c) => {
  const auth = c.get('auth');
  const userId = c.req.param('id');

  if (!auth || !(await canViewUser(auth, userId))) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const user = await getUser(userId);
  return c.json(user);
});

app.post(
  '/',
  zValidator(
    'json',
    z.object({
      email: z.string().max(255).optional(),
      password: z.string().max(255).optional(),
      role: z.string().regex(/admin|user|view-only/i).optional(),
    })
  ),
  async (c) => {
    const auth = c.get('auth');
    const userId = c.req.param('id');

    if (!auth || !(await canUpdateUser(auth, userId))) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = c.req.valid('json');
    const { email, password, role } = body;
    const user = await getUser(userId);

    if (!user) return c.json({ error: 'User not found' }, 404);

    const data: any = {};

    if (password) {
      data.password = await hashPassword(password);
    }

    if (role && auth.user.isAdmin) {
      data.role = role;
    }

    if (email && auth.user.isAdmin) {
      data.email = email;
    }

    if (data.email && user.email !== data.email) {
      const existing = await getUserByEmail(email);
      if (existing) {
        return c.json({ error: 'User already exists' }, 400);
      }
    }

    const updated = await updateUser(userId, data);
    return c.json(updated);
  }
);

app.delete('/', async (c) => {
  const auth = c.get('auth');
  const userId = c.req.param('id');

  if (!auth || !(await canDeleteUser(auth))) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  if (userId === auth.user.id) {
    return c.json({ error: 'You cannot delete yourself.' }, 400);
  }

  await deleteUser(userId);
  return c.json({ success: true });
});

export default app;
