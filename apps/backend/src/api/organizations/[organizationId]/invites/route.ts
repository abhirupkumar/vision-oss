import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  createInvite,
  getInvites,
  getMember,
  getUserByEmail,
} from '@vision/db';
import {
  canViewOrganization,
  canUpdateOrganization,
} from '../../../../lib/permissions/organization.js';
import { badRequest, unauthorized } from '../../../../lib/response.js';

const app = new Hono<{ Variables: { auth: any } }>();

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['member', 'admin']).default('member'),
  projectAccess: z.array(z.string()).default([]),
});

app.get('/', async (c) => {
  const organizationId = c.req.param('organizationId');
  const auth = c.get('auth');

  if (!(await canViewOrganization(auth, organizationId))) {
    return unauthorized();
  }

  const query = c.req.query();
  const filters = {
    search: query.search,
    page: query.page ? parseInt(query.page) : 1,
    pageSize: query.pageSize ? parseInt(query.pageSize) : 10,
    orderBy: query.orderBy || 'createdAt',
    sort: (query.sort as any) || 'desc',
  };

  const invites = await getInvites({ organizationId }, filters);
  return c.json(invites);
});

app.post('/', zValidator('json', inviteSchema), async (c) => {
  const organizationId = c.req.param('organizationId');
  const auth = c.get('auth');
  const { email, role, projectAccess } = c.req.valid('json');

  if (!(await canUpdateOrganization(auth, organizationId))) {
    return unauthorized();
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if already a member
  const existingUser = await getUserByEmail(normalizedEmail);
  if (existingUser) {
    const existingMember = await getMember(organizationId, existingUser.id);
    if (existingMember) {
      return badRequest({ message: 'User is already a member of this organization' });
    }
  }

  const invite = await createInvite({
    email: normalizedEmail,
    organizationId,
    createdById: auth.user.id,
    role,
    projectAccess,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiration
  });

  return c.json(invite);
});

export default app;
