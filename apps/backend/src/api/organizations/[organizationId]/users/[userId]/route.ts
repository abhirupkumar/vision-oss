import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  getMember,
  getMembers,
  updateMember,
  deleteMember,
  setProjectAccess,
} from '@vision/db';
import {
  canUpdateOrganization,
  canDeleteMember,
} from '../../../../../lib/permissions/organization.js';
import { badRequest, notFound, ok, unauthorized } from '../../../../../lib/response.js';

const app = new Hono<{ Variables: { auth: any } }>();

const updateMemberSchema = z.object({
  role: z.string().optional(),
  projectAccess: z.array(z.string()).optional(),
});

app.post('/', zValidator('json', updateMemberSchema), async (c) => {
  const organizationId = c.req.param('organizationId');
  const userId = c.req.param('userId');
  const auth = c.get('auth');
  const { role, projectAccess } = c.req.valid('json');

  if (!(await canUpdateOrganization(auth, organizationId))) {
    return unauthorized();
  }

  const member = await getMember(organizationId, userId);
  if (!member) {
    return notFound();
  }

  if (role) {
    await updateMember(member.id, { role });
  }

  if (projectAccess !== undefined) {
    await setProjectAccess(userId, organizationId, projectAccess);
  }

  return c.json({ success: true });
});

app.delete('/', async (c) => {
  const organizationId = c.req.param('organizationId');
  const userId = c.req.param('userId');
  const auth = c.get('auth');

  if (!(await canDeleteMember(auth, organizationId, userId))) {
    return unauthorized();
  }

  const member = await getMember(organizationId, userId);
  if (!member) {
    return notFound();
  }

  if (member.role === 'owner') {
    const allMembers = await getMembers({ organizationId }, { pageSize: 100 });
    const owners = allMembers.data.filter((m: any) => m.role === 'owner');
    if (owners.length <= 1) {
      return badRequest({ message: 'Cannot remove the last owner of the organization' });
    }
  }

  await deleteMember(organizationId, userId);
  await setProjectAccess(userId, organizationId, []);

  return c.json({ success: true });
});

export default app;
