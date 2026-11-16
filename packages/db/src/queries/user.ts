import { and, asc, desc, eq, ilike, inArray, isNull, or, count } from 'drizzle-orm';
import { db } from '../client';
import {
  Member,
  Organization,
  Project,
  Report,
  User,
} from '../schema';
import type { QueryFilters } from '@vision/shared-types';

export interface GetUserOptions {
  includePassword?: boolean;
  showDeleted?: boolean;
}

async function findUser(
  criteria: { id?: string; clerkId?: string; email?: string },
  options: GetUserOptions = {},
) {
  const { includePassword = false, showDeleted = false } = options;

  const conditions = [];
  if (criteria.id) conditions.push(eq(User.id, criteria.id));
  if (criteria.clerkId) conditions.push(eq(User.clerkId, criteria.clerkId));
  if (criteria.email) conditions.push(eq(User.email, criteria.email));
  if (!showDeleted) conditions.push(isNull(User.deletedAt));

  if (conditions.length === 0) return null;

  const user = await db.query.User.findFirst({
    where: and(...conditions),
    columns: {
      id: true,
      clerkId: true,
      email: true,
      password: includePassword,
      role: true,
      createdAt: true,
    },
  });

  return user as any;
}

export async function getUser(userId: string, options: GetUserOptions = {}) {
  return findUser({ id: userId }, options);
}

export async function getUserByClerkId(clerkId: string, options: GetUserOptions = {}) {
  return findUser({ clerkId }, options);
}

export async function getUserByEmail(email: string, options: GetUserOptions = {}) {
  return findUser({ email }, options);
}

export async function getUsers(whereArgs: { deletedAt?: null }, filters: QueryFilters = {}) {
  const { search, page = 1, pageSize = 10, orderBy = 'createdAt', sort = 'desc' } = filters;
  const limit = Number(pageSize);
  const offset = (Number(page) - 1) * limit;

  const conditions = [];
  if (whereArgs.deletedAt === null) conditions.push(isNull(User.deletedAt));

  if (search) {
    conditions.push(ilike(User.email, `%${search}%`));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db.query.User.findMany({
    where,
    orderBy: sort === 'desc' ? [desc((User as any)[orderBy])] : [asc((User as any)[orderBy])],
    limit,
    offset,
  });

  const countRes = await db
    .select({ count: count() })
    .from(User)
    .where(where);

  return {
    data,
    count: countRes[0].count,
    page: Number(page),
    pageSize: limit,
  };
}

export async function createUser(data: {
  id: string;
  clerkId: string;
  email: string;
  displayName?: string;
  password?: string;
  role: string;
}) {
  const [created] = await db
    .insert(User)
    .values({
      ...data,
      id: data.id || crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({
      id: User.id,
      email: User.email,
      role: User.role,
    });
  return created;
}

export async function updateUser(userId: string, data: any) {
  const [updated] = await db
    .update(User)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(User.id, userId))
    .returning({
      id: User.id,
      email: User.email,
      role: User.role,
      createdAt: User.createdAt,
    });
  return updated;
}

export async function deleteUser(userId: string) {
  const cloudMode = !!process.env.CLOUD_MODE;

  return await db.transaction(async tx => {
    const projects = await tx.query.Project.findMany({
      where: eq(Project.userId, userId),
    });
    const projectIds = projects.map(p => p.id);

    const orgMembers = await tx.query.Member.findMany({
      where: and(eq(Member.userId, userId), eq(Member.role, 'owner')),
    });
    const organizationIds = orgMembers.map(m => m.organizationId);

    if (cloudMode) {
      if (projectIds.length > 0) {
        await tx
          .update(Project)
          .set({ deletedAt: new Date() })
          .where(inArray(Project.id, projectIds));
      }

      const [updated] = await tx
        .update(User)
        .set({
          email: crypto.randomUUID() + '@deleted.com',
          deletedAt: new Date(),
        })
        .where(eq(User.id, userId))
        .returning();
      return [updated];
    }

    if (projectIds.length > 0) {
      await tx
        .delete(Report)
        .where(or(inArray(Report.projectId, projectIds), eq(Report.userId, userId)));

      await tx.delete(Project).where(inArray(Project.id, projectIds));
    } else {
      await tx.delete(Report).where(eq(Report.userId, userId));
    }

    if (organizationIds.length > 0) {
      await tx
        .delete(Member)
        .where(or(inArray(Member.organizationId, organizationIds), eq(Member.userId, userId)));
      await tx.delete(Organization).where(inArray(Organization.id, organizationIds));
    } else {
      await tx.delete(Member).where(eq(Member.userId, userId));
    }

    const [deleted] = await tx.delete(User).where(eq(User.id, userId)).returning();
    return [deleted];
  });
}
