import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const app = new Hono<{ Variables: { user: any } }>();

const passwordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

const handlePasswordChange = async (c: any) => {
  // Note: With Clerk, password management should ideally be done through Clerk UI/API.
  // This is kept here for compatibility if a local password hash exists.
  return c.json({ error: 'Password change must be done via Clerk.' }, 400);
};

app.patch('/', zValidator('json', passwordSchema), handlePasswordChange);
app.post('/', zValidator('json', passwordSchema), handlePasswordChange);

export default app;
