import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { findOrganization, getMember, createMember } from '@vision/db';
import { ROLES } from '../../../lib/constants.js';
import { badRequest, notFound } from '../../../lib/response.js';

const app = new Hono<{ Variables: { auth: any; } }>();

app.post('/', zValidator('json', z.object({
  accessCode: z.string().max(50),
})), async (c) => {
  const { accessCode } = c.req.valid('json');
  const auth = c.get('auth');

  if (!auth?.user?.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const organization = await findOrganization({ accessCode });

  if (!organization) {
    return notFound();
  }

  const member = await getMember(organization.id, auth.user.id);

  if (member) {
    return badRequest();
  }

  const user = await createMember(auth.user.id, organization.id, ROLES.organizationMember);

  return c.json(user);
});

export default app;
