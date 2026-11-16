import { and, asc, desc, eq, ilike, isNull, or } from 'drizzle-orm';
import { db } from '../client';
import { Link, Organization, User } from '../schema';
import { uuid } from '../lib/crypto';
import type { QueryFilters } from '../lib/types.js';

export async function findLink(criteria: { id?: string; slug?: string }) {
  const conditions = [];
  if (criteria.id) conditions.push(eq(Link.id, criteria.id));
  if (criteria.slug) conditions.push(eq(Link.slug, criteria.slug));

  if (conditions.length === 0) return null;

  return await db.query.Link.findFirst({
    where: and(...conditions),
  });
}

export async function getLink(linkId: string) {
  return findLink({ id: linkId });
}

export async function getLinks(
  whereArgs: { userId?: string; organizationId?: string; deletedAt?: null },
  filters: QueryFilters = {},
) {
  const { search, page = 1, pageSize = 10, orderBy = 'createdAt', sort = 'desc' } = filters;
  const limit = Number(pageSize);
  const offset = (Number(page) - 1) * limit;

  const conditions = [];
  if (whereArgs.userId) conditions.push(eq(Link.userId, whereArgs.userId));
  if (whereArgs.organizationId) conditions.push(eq(Link.organizationId, whereArgs.organizationId));
  if (whereArgs.deletedAt === null) conditions.push(isNull(Link.deletedAt));

  if (search) {
    conditions.push(
      or(
        ilike(Link.name, `%${search}%`),
        ilike(Link.url, `%${search}%`),
        ilike(Link.slug, `%${search}%`),
      ),
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db.query.Link.findMany({
    where,
    orderBy: sort === 'desc' ? [desc((Link as any)[orderBy])] : [asc((Link as any)[orderBy])],
    limit,
    offset,
  });

  const countRes = await db
    .select({ count: require('drizzle-orm').count() })
    .from(Link)
    .where(where);
  const count = countRes[0].count;

  return {
    data,
    count,
    page: Number(page),
    pageSize: limit,
  };
}

export async function getUserLinks(userId: string, filters?: QueryFilters) {
  return getLinks({ userId, deletedAt: null }, filters);
}

export async function getOrganizationLinks(organizationId: string, filters?: QueryFilters) {
  return getLinks({ organizationId }, filters);
}

export async function createLink(data: any) {
  const [created] = await db
    .insert(Link)
    .values({
      ...data,
      id: data.id || uuid(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return created;
}

export async function updateLink(linkId: string, data: any) {
  const [updated] = await db
    .update(Link)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(Link.id, linkId))
    .returning();
  return updated;
}

export async function deleteLink(linkId: string) {
  const [deleted] = await db.delete(Link).where(eq(Link.id, linkId)).returning();
  return deleted;
}
