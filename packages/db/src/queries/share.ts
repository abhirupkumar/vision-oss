import { and, asc, desc, eq, count } from 'drizzle-orm';
import { db } from '../client';
import { Share } from '../schema';
import type { QueryFilters } from '@vision/shared-types';

export async function findShare(criteria: { id?: string; slug?: string }) {
  const conditions = [];
  if (criteria.id) conditions.push(eq(Share.id, criteria.id));
  if (criteria.slug) conditions.push(eq(Share.slug, criteria.slug));

  if (conditions.length === 0) return null;

  return db.query.Share.findFirst({
    where: and(...conditions),
  });
}

export async function getShare(shareId: string) {
  return findShare({ id: shareId });
}

export async function getShareBySlug(slug: string) {
  return findShare({ slug });
}

export async function getShareByEntityId(entityId: string) {
  return db.query.Share.findFirst({
    where: eq(Share.entityId, entityId),
    orderBy: [desc(Share.createdAt)],
  });
}

export async function getSharesByEntityId(entityId: string, filters: QueryFilters = {}) {
  const { page = 1, pageSize = 10, orderBy = 'createdAt', sort = 'desc' } = filters;
  const limit = Number(pageSize);
  const offset = (Number(page) - 1) * limit;

  const data = await db.query.Share.findMany({
    where: eq(Share.entityId, entityId),
    orderBy: sort === 'desc' ? [desc((Share as any)[orderBy])] : [asc((Share as any)[orderBy])],
    limit,
    offset,
  });

  const countRes = await db
    .select({ count: count() })
    .from(Share)
    .where(eq(Share.entityId, entityId));

  return {
    data,
    count: countRes[0].count,
    page: Number(page),
    pageSize: limit,
  };
}

export async function createShare(data: any) {
  const [created] = await db
    .insert(Share)
    .values({
      ...data,
      id: data.id || crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return created;
}

export async function updateShare(shareId: string, data: any) {
  const [updated] = await db
    .update(Share)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(Share.id, shareId))
    .returning();
  return updated;
}

export async function deleteShare(shareId: string) {
  const [deleted] = await db.delete(Share).where(eq(Share.id, shareId)).returning();
  return deleted;
}

export async function deleteSharesByEntityId(entityId: string) {
  const [deleted] = await db.delete(Share).where(eq(Share.entityId, entityId)).returning();
  return deleted;
}
