import { and, eq } from 'drizzle-orm';
import { db } from '../client';
import { ProjectAccess } from '../schema';
import { uuid } from '../lib/crypto';

export async function getProjectAccess(projectId: string, userId: string) {
  return db.query.ProjectAccess.findFirst({
    where: and(eq(ProjectAccess.projectId, projectId), eq(ProjectAccess.userId, userId)),
  });
}

export async function getProjectAccessByOrganization(
  projectId: string,
  organizationId: string,
  userId: string,
) {
  return db.query.ProjectAccess.findFirst({
    where: and(
      eq(ProjectAccess.projectId, projectId),
      eq(ProjectAccess.organizationId, organizationId),
      eq(ProjectAccess.userId, userId),
    ),
  });
}

export async function getProjectAccessByUser(userId: string, organizationId: string) {
  return db.query.ProjectAccess.findMany({
    where: and(eq(ProjectAccess.userId, userId), eq(ProjectAccess.organizationId, organizationId)),
  });
}

export async function setProjectAccess(
  userId: string,
  organizationId: string,
  projectIds: string[],
) {
  return await db.transaction(async tx => {
    await tx
      .delete(ProjectAccess)
      .where(
        and(eq(ProjectAccess.userId, userId), eq(ProjectAccess.organizationId, organizationId)),
      );

    if (projectIds.length > 0) {
      await tx.insert(ProjectAccess).values(
        projectIds.map(projectId => ({
          id: uuid(),
          projectId,
          userId,
          organizationId,
          level: 'write' as const,
        })),
      );
    }
  });
}
