import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getOrganization, updateOrganization, deleteOrganization } from '@vision/db';
import {
  canViewOrganization,
  canUpdateOrganization,
  canDeleteOrganization,
} from '../../../lib/permissions/organization.js';
import { notFound, unauthorized } from '../../../lib/response.js';

const app = new Hono<{ Variables: { auth: any; } }>();

app.get('/', async (c) => {
  const id = c.req.param('organizationId');
  const auth = c.get('auth');

  if (!(await canViewOrganization(auth, id))) {
    return unauthorized();
  }

  const org = await getOrganization(id, { includeMembers: true });
  if (!org) return notFound();
  return c.json(org);
});

const updateSchema = z.object({
  id: z.string().optional(),
  name: z.string().max(100).optional(),
  logoUrl: z.string().optional(),
  accessCode: z.string().optional(),
});

const handleUpdate = async (c: any) => {
  const id = c.req.param('organizationId');
  const body = c.req.valid('json');
  const auth = c.get('auth');

  if (!(await canUpdateOrganization(auth, id))) {
    return unauthorized();
  }

  const { id: _ignoreId, ...data } = body;
  const org = await updateOrganization(id, data);
  if (!org) return notFound();
  return c.json(org);
};

app.post('/', zValidator('json', updateSchema), handleUpdate);
app.patch('/', zValidator('json', updateSchema), handleUpdate);

app.delete('/', async (c) => {
  const id = c.req.param('organizationId');
  const auth = c.get('auth');

  if (!(await canDeleteOrganization(auth, id))) {
    return unauthorized();
  }

  const deleted = await deleteOrganization(id);
  if (!deleted) return notFound();
  return c.json({ success: true });
});

export default app;
