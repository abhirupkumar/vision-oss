import { Hono } from 'hono';
import { verifyToken, createClerkClient } from '@clerk/backend';
import { db, User, Member, Organization } from '@vision/db';
import { eq } from 'drizzle-orm';
import { uuid } from '../../../lib/crypto';

const app = new Hono();

app.post('/', async (c) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return c.json({ error: 'Unauthorized' }, 401);

  let clerkId: string;
  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });
    clerkId = payload.sub;
    if (!clerkId) return c.json({ error: 'Invalid token: missing subject' }, 401);
  } catch (err: any) {
    console.error('Clerk verifyToken error:', err);
    return c.json({ error: 'Invalid token: ' + (err.message || 'Verification failed') }, 401);
  }

  try {
    // 1. Fetch user by clerkId directly
    const [existingUser] = await db
      .select()
      .from(User)
      .where(eq(User.clerkId, clerkId))
      .limit(1);

    let user = existingUser;

    // 2. Auto-provision or link user if not found by clerkId
    if (!user) {
      const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
      const clerkUser = await clerkClient.users.getUser(clerkId);
      const email =
        clerkUser.emailAddresses?.find((e: any) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
        clerkUser.emailAddresses?.[0]?.emailAddress ||
        'no-email@example.com';
      const displayName = clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : null;
      const logoUrl = clerkUser.imageUrl || null;

      // Check if a user already exists with this email (e.g. from previous auth/database)
      const [existingByEmail] = await db
        .select()
        .from(User)
        .where(eq(User.email, email))
        .limit(1);

      if (existingByEmail) {
        // Link new clerkId to the existing user record
        const [updatedUser] = await db
          .update(User)
          .set({
            clerkId,
            displayName: displayName || existingByEmail.displayName,
            logoUrl: logoUrl || existingByEmail.logoUrl,
            updatedAt: new Date(),
          })
          .where(eq(User.id, existingByEmail.id))
          .returning();

        user = updatedUser;
      } else {
        const [newUser] = await db
          .insert(User)
          .values({
            id: uuid(),
            clerkId,
            email,
            role: 'user',
            displayName,
            logoUrl,
          })
          .returning();

        user = newUser;
      }
    }

    // 3. Fetch user's organizations cleanly via Member join
    const memberRows = await db
      .select({
        member: Member,
        organization: Organization,
      })
      .from(Member)
      .innerJoin(Organization, eq(Member.organizationId, Organization.id))
      .where(eq(Member.userId, user.id));

    const organizations = memberRows.map((r) => r.organization);
    const members = memberRows.map((r) => ({
      ...r.member,
      organization: r.organization,
    }));

    return c.json({
      ...user,
      members,
      organizations,
    });
  } catch (err: any) {
    console.error('Database verify error:', err?.message || err, err?.cause, err?.stack);
    const detail = err.cause?.message || (typeof err.cause === 'string' ? err.cause : JSON.stringify(err.cause)) || err.message;
    return c.json({
      error: 'Database error: ' + err.message,
      detail: detail,
    }, 500);
  }
});

export default app;
