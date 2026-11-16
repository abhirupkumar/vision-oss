import { and, asc, desc, eq, ilike, inArray, isNull, or, count } from 'drizzle-orm';
import { db } from '../client';
import {
  Member,
  Project,
  Report,
  Segment,
} from '../schema';
import { ROLES } from '../lib/constants';
import redis from '../lib/redis';
import type { QueryFilters } from '../lib/types.js';
import { getId } from './id';

export async function findProject(criteria: { id?: string; shareId?: string }) {
  const conditions = [];
  if (criteria.id) conditions.push(eq(Project.id, criteria.id));
  if (criteria.shareId) conditions.push(eq(Project.shareId, criteria.shareId));

  if (conditions.length === 0) return null;

  return db.query.Project.findFirst({
    where: and(...conditions),
  });
}

export async function getProject(projectId: string) {
  return findProject({ id: projectId });
}

export async function getSharedProject(shareId: string) {
  return db.query.Project.findFirst({
    where: and(eq(Project.shareId, shareId), isNull(Project.deletedAt)),
  });
}

export async function getProjects(
  whereArgs: { userId?: string; organizationId?: string; OR?: any[] },
  filters: QueryFilters = {},
) {
  const { search, page = 1, pageSize = 10, orderBy = 'createdAt', sort = 'desc' } = filters;
  const limit = Number(pageSize);
  const offset = (Number(page) - 1) * limit;

  const query = db.select().from(Project);

  const conditions = [isNull(Project.deletedAt)];

  if (whereArgs.userId) {
    conditions.push(eq(Project.userId, whereArgs.userId));
  }

  if (whereArgs.organizationId) {
    conditions.push(eq(Project.organizationId, whereArgs.organizationId));
  }

  if (whereArgs.OR) {
    // This is specifically for getAllUserProjectsIncludingOrganizationOwner where condition
    const orConditions = [];
    for (const cond of whereArgs.OR) {
      if (cond.userId) {
        orConditions.push(eq(Project.userId, cond.userId));
      } else if (cond.organization?.members?.some?.userId) {
        const uId = cond.organization.members.some.userId;
        const role = cond.organization.members.some.role;
        // We need to check if the project belongs to an organization where the user has this role
        // For simplicity with Drizzle without huge joins in conditions:
        const orgsWithUserRole = await db
          .select({ id: Member.organizationId })
          .from(Member)
          .where(and(eq(Member.userId, uId), eq(Member.role, role)));

        const orgIds = orgsWithUserRole.map(o => o.id);
        if (orgIds.length > 0) {
          orConditions.push(inArray(Project.organizationId, orgIds));
        } else {
          // Add an impossible condition if user has no orgs with that role
          orConditions.push(eq(Project.id, 'impossible_id'));
        }
      }
    }
    if (orConditions.length > 0) {
      conditions.push(or(...orConditions));
    }
  }

  if (search) {
    conditions.push(or(ilike(Project.name, `%${search}%`), ilike(Project.domain, `%${search}%`)));
  }

  const where = and(...conditions);

  const data = await db.query.Project.findMany({
    where,
    orderBy: sort === 'desc' ? [desc((Project as any)[orderBy])] : [asc((Project as any)[orderBy])],
    limit,
    offset,
  });

  const countRes = await db
    .select({ count: count() })
    .from(Project)
    .where(where);

  return {
    data,
    count: countRes[0].count,
    page: Number(page),
    pageSize: limit,
  };
}

export async function getAllUserProjectsIncludingOrganizationOwner(
  userId: string,
  filters?: QueryFilters,
) {
  return getProjects(
    {
      OR: [
        { userId },
        {
          organization: {
            members: {
              some: {
                role: ROLES.owner,
                userId,
              },
            },
          },
        },
      ],
    },
    {
      orderBy: 'name',
      sort: 'asc',
      ...filters,
    },
  );
}

export async function getUserProjects(userId: string, filters?: QueryFilters) {
  const { search, page = 1, pageSize = 10, orderBy = 'name', sort = 'asc' } = filters || {};
  const limit = Number(pageSize);
  const offset = (Number(page) - 1) * limit;

  const conditions = [eq(Project.userId, userId), isNull(Project.deletedAt)];
  if (search) {
    conditions.push(or(ilike(Project.name, `%${search}%`), ilike(Project.domain, `%${search}%`)));
  }
  const where = and(...conditions);

  const data = await db.query.Project.findMany({
    where,
    with: { user: { columns: { id: true, email: true } } },
    orderBy: sort === 'desc' ? [desc((Project as any)[orderBy])] : [asc((Project as any)[orderBy])],
    limit,
    offset,
  });

  const countRes = await db
    .select({ count: count() })
    .from(Project)
    .where(where);

  return {
    data,
    count: countRes[0].count,
    page: Number(page),
    pageSize: limit,
  };
}

export async function getOrganizationProjects(organizationId: string, filters?: QueryFilters) {
  const { search, page = 1, pageSize = 10, orderBy = 'createdAt', sort = 'desc' } = filters || {};
  const limit = Number(pageSize);
  const offset = (Number(page) - 1) * limit;

  const conditions = [eq(Project.organizationId, organizationId), isNull(Project.deletedAt)];
  if (search) {
    conditions.push(or(ilike(Project.name, `%${search}%`), ilike(Project.domain, `%${search}%`)));
  }
  const where = and(...conditions);

  const data = await db.query.Project.findMany({
    where,
    with: { createUser: { columns: { id: true, email: true } } },
    orderBy: sort === 'desc' ? [desc((Project as any)[orderBy])] : [asc((Project as any)[orderBy])],
    limit,
    offset,
  });

  const countRes = await db
    .select({ count: count() })
    .from(Project)
    .where(where);

  return {
    data,
    count: countRes[0].count,
    page: Number(page),
    pageSize: limit,
  };
}

export async function createProject(data: Partial<typeof Project.$inferInsert> & { name: string }) {
  const id = await getId('project', data.name);
  const [created] = await db
    .insert(Project)
    .values({
      ...data,
      id,
      replayEnabled: data.replayEnabled ?? false,
      autocaptureEnabled: data.autocaptureEnabled ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return created;
}

export async function updateProject(projectId: string, data: Partial<typeof Project.$inferInsert>) {
  const [updated] = await db
    .update(Project)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(Project.id, projectId))
    .returning();
  return updated;
}

export async function resetProject(projectId: string) {
  const cloudMode = !!process.env.CLOUD_MODE;

  const res = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(Project)
      .set({ resetAt: new Date() })
      .where(eq(Project.id, projectId))
      .returning();
    return updated;
  });

  if (cloudMode && res) {
    await redis.client.set(`project:${projectId}`, res);
  }

  return res;
}

export async function deleteProject(projectId: string) {
  const cloudMode = !!process.env.CLOUD_MODE;

  const res = await db.transaction(async (tx) => {
    await tx.delete(Report).where(eq(Report.projectId, projectId));
    await tx.delete(Segment).where(eq(Segment.projectId, projectId));

    if (cloudMode) {
      const [updated] = await tx
        .update(Project)
        .set({ deletedAt: new Date() })
        .where(eq(Project.id, projectId))
        .returning();
      return updated;
    } else {
      const [deleted] = await tx
        .delete(Project)
        .where(eq(Project.id, projectId))
        .returning();
      return deleted;
    }
  });

  if (cloudMode) {
    await redis.client.del(`project:${projectId}`);
  }

  return res;
}

export async function getProjectCount(userId: string) {
  const countRes = await db
    .select({ count: count() })
    .from(Project)
    .where(and(eq(Project.userId, userId), isNull(Project.deletedAt)));
  return countRes[0].count;
}
