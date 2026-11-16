import { Hono } from 'hono';
import { deleteInvite } from '@vision/db';
import { canUpdateOrganization } from '../../../../../lib/permissions/organization.js';
import { notFound, ok, unauthorized } from '../../../../../lib/response.js';

const app = new Hono<{ Variables: { auth: any } }>();

app.delete('/', async (c) => {
  const organizationId = c.req.param('organizationId');
  const inviteId = c.req.param('inviteId');
  const auth = c.get('auth');

  if (!(await canUpdateOrganization(auth, organizationId))) {
    return unauthorized();
  }

  const deleted = await deleteInvite(inviteId);
  if (!deleted) {
    return notFound();
  }

  return c.json({ success: true });
});

export default app;
