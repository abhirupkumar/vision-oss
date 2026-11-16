import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  db,
  getProject,
  getUserByEmail,
  Member,
  Project,
  ProjectAccess,
} from '@vision/db';
import { and, eq } from 'drizzle-orm';
import { canUpdateProject } from '../../../../lib/permissions/project.js';
import { badRequest, ok, unauthorized } from '../../../../lib/response.js';
import { uuid } from '../../../../lib/crypto.js';

const app = new Hono<{ Variables: { auth: any } }>();

app.post(
  '/',
  zValidator(
    'json',
    z.object({
      email: z.string().email(),
    }),
  ),
  async (c) => {
    const projectId = c.req.param('projectId');
    const auth = c.get('auth');
    const { email } = c.req.valid('json');

    // 1. Permission check: caller must have update/owner rights on project
    if (!(await canUpdateProject(auth, projectId))) {
      return unauthorized();
    }

    const project = await getProject(projectId);
    if (!project) {
      return badRequest({ message: 'Project not found' });
    }

    // 2. Find target user by email
    const targetUser = await getUserByEmail(email.toLowerCase().trim());
    if (!targetUser) {
      return badRequest({ message: 'User not found' });
    }

    if (targetUser.id === auth.user.id) {
      return badRequest({ message: 'You cannot transfer a project to yourself.' });
    }

    // 3. Atomic transfer:
    // - Set targetUser as new project owner (userId and createdBy)
    // - Only strip the previous owner's access (other members stay intact!)
    // - Grant targetUser admin ProjectAccess
    // - If project belongs to an organization, ensure targetUser is a member of that organization
    await db.transaction(async (tx) => {
      await tx
        .update(Project)
        .set({
          userId: targetUser.id,
          createdBy: targetUser.id,
          updatedAt: new Date(),
        })
        .where(eq(Project.id, projectId));

      // Only remove the previous owner's ProjectAccess row. Other members remain!
      await tx
        .delete(ProjectAccess)
        .where(
          and(
            eq(ProjectAccess.projectId, projectId),
            eq(ProjectAccess.userId, auth.user.id),
          ),
        );

      // Ensure target user has admin access
      const existingAccess = await tx.query.ProjectAccess.findFirst({
        where: and(
          eq(ProjectAccess.projectId, projectId),
          eq(ProjectAccess.userId, targetUser.id),
        ),
      });

      if (existingAccess) {
        await tx
          .update(ProjectAccess)
          .set({ level: 'admin', updatedAt: new Date() })
          .where(eq(ProjectAccess.id, existingAccess.id));
      } else {
        await tx.insert(ProjectAccess).values({
          id: uuid(),
          projectId,
          userId: targetUser.id,
          organizationId: project.organizationId,
          level: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // If project has an organizationId, ensure target user is an organization member
      if (project.organizationId) {
        const existingMember = await tx.query.Member.findFirst({
          where: and(
            eq(Member.organizationId, project.organizationId),
            eq(Member.userId, targetUser.id),
          ),
        });

        if (!existingMember) {
          await tx.insert(Member).values({
            id: uuid(),
            organizationId: project.organizationId,
            userId: targetUser.id,
            role: 'admin',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    });

    return ok();
  },
);

export default app;
