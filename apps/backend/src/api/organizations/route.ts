import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import crypto from 'node:crypto';
import { createOrganization, getUserOrganizations } from '@vision/db';
import { canCreateOrganization } from '../../lib/permissions/organization.js';
import { unauthorized } from '../../lib/response.js';

const app = new Hono<{ Variables: { userId: string; auth: any; } }>();

app.get('/', async (c) => {
  const userId = c.get('userId');
  const query = c.req.query();
  const filters = {
    search: query.search,
    page: query.page ? parseInt(query.page) : undefined,
    pageSize: query.pageSize ? parseInt(query.pageSize) : undefined,
    orderBy: query.orderBy,
    sort: query.sort as any,
  };

  const orgs = await getUserOrganizations(userId, filters as any);
  return c.json(orgs);
});

app.post('/', zValidator('json', z.object({
  name: z.string().max(100),
})), async (c) => {
  const { name } = c.req.valid('json');
  const userId = c.get('userId');
  const auth = c.get('auth');

  if (!(await canCreateOrganization(auth))) {
    return unauthorized();
  }

  const accessCode = `organization_${crypto.randomUUID().replace(/-/g, '')}`;
  const org = await createOrganization({
    name,
    accessCode,
  }, userId);

  return c.json(org);
});

export default app;
