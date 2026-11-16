import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  createProject,
  getAllUserProjectsIncludingOrganizationOwner,
  getUserProjects,
  getProjectCount,
} from '@vision/db';
import { canCreateProject } from '../../lib/permissions/project.js';
import { canCreateOrganizationProject } from '../../lib/permissions/organization.js';
import redis from '../../lib/redis';
import { unauthorized } from '../../lib/response.js';

const CLOUD_PROJECT_LIMIT = 3;

const app = new Hono<{ Variables: { userId: string; auth: any } }>();

app.get('/', async (c) => {
  const userId = c.get('userId');
  const query = c.req.query();
  const includeOrganizations = query.includeOrganizations;
  const search = query.search;
  const page = parseInt(query.page || '1');
  const pageSize = parseInt(query.pageSize || '10');

  const filters = { search, page, pageSize };

  if (includeOrganizations) {
    return c.json(await getAllUserProjectsIncludingOrganizationOwner(userId, filters));
  }

  return c.json(await getUserProjects(userId, filters));
});

app.post(
  '/',
  zValidator(
    'json',
    z.object({
      name: z.string().max(100),
      domain: z.string().max(500),
      shareId: z.string().max(50).nullable().optional(),
      organizationId: z.string().nullable().optional(),
      autocaptureEnabled: z.boolean().optional(),
    })
  ),
  async (c) => {
    const data = c.req.valid('json');
    const userId = c.get('userId');
    const auth = c.get('auth');

    const { name, domain, shareId, organizationId, autocaptureEnabled } = data;

    if (process.env.CLOUD_MODE && !organizationId) {
      const account = await redis.client.get(`account:${auth.user.id}`);

      if (!account?.hasSubscription) {
        const count = await getProjectCount(auth.user.id);

        if (count >= CLOUD_PROJECT_LIMIT) {
          return unauthorized({ message: 'Project limit reached.' });
        }
      }
    }

    if (
      (organizationId && !(await canCreateOrganizationProject(auth, organizationId))) ||
      !(await canCreateProject(auth))
    ) {
      return unauthorized();
    }

    const projectData: any = {
      createdBy: auth.user.id,
      name,
      domain,
      shareId,
      organizationId,
      autocaptureEnabled: autocaptureEnabled ?? true,
    };

    if (!organizationId) {
      projectData.userId = auth.user.id;
    }

    const project = await createProject(projectData);

    return c.json(project);
  }
);

export default app;
