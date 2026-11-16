import { Hono } from 'hono';
import { getMembers, getProjectAccessByUser } from '@vision/db';
import { canViewOrganization } from '../../../../lib/permissions/organization.js';
import { unauthorized } from '../../../../lib/response.js';

const app = new Hono<{ Variables: { auth: any } }>();

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

  const result = await getMembers({ organizationId }, filters);

  const membersWithAccess = await Promise.all(
    result.data.map(async (member: any) => {
      const projectAccess = await getProjectAccessByUser(member.userId, organizationId);
      return {
        ...member,
        projectAccess: projectAccess || [],
      };
    }),
  );

  return c.json({
    data: membersWithAccess,
    count: result.count,
    page: result.page,
    pageSize: result.pageSize,
  });
});

export default app;
