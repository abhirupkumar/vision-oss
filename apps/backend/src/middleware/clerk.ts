import { verifyToken } from '@clerk/backend';
import type { MiddlewareHandler } from 'hono';
import { db } from '@vision/db';
import { User } from '@vision/db';
import { eq } from 'drizzle-orm';

declare module 'hono' {
  interface ContextVariableMap {
    userId: string;
    clerkId: string;
    user: typeof User.$inferSelect;
    auth: { user: typeof User.$inferSelect & { isAdmin: boolean } };
  }
}

export const requireAuth = (): MiddlewareHandler => async (c, next) => {
  const publicRouteRegexes = [
    /^\/api\/send(.*)/,
    /^\/api\/collect(.*)/,
    /^\/api\/record(.*)/,
    /^\/api\/errors(.*)/,
    /^\/api\/webhooks(.*)/,
    /^\/api\/auth\/verify/,
    /^\/share\/(.*)/,
    /^\/llm-proxy(.*)/,
  ];

  const path = c.req.path;
  if (publicRouteRegexes.some((regex) => regex.test(path))) {
    return next();
  }

  const authHeader = c.req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '') || c.req.query('token');

  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });
    const clerkId = payload.sub;

    if (!clerkId) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    // Look up internal user
    let user;
    try {
      const [foundUser] = await db
        .select()
        .from(User)
        .where(eq(User.clerkId, clerkId))
        .limit(1);
      user = foundUser;
    } catch (dbErr) {
      console.error('[requireAuth] DB error looking up user:', dbErr);
      return c.json({ error: 'Database error' }, 500);
    }

    if (!user) return c.json({ error: 'User not found' }, 401);

    c.set('userId', user.id);
    c.set('clerkId', clerkId);
    c.set('user', user);
    c.set('auth', { user: { ...user, isAdmin: user.role === 'admin' } });
    await next();
  } catch (err) {
    return c.json({ error: 'Invalid token' }, 401);
  }
};
