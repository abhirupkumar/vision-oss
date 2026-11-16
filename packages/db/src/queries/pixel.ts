import { and, asc, desc, eq, ilike, or } from 'drizzle-orm';
import { db } from '../client';
import { Pixel } from '../schema';
import { uuid } from '../lib/crypto';
import type { QueryFilters } from '../lib/types.js';

export async function findPixel(criteria: { id?: string; slug?: string }) {
  if (!criteria.id && !criteria.slug) return null;
  return db.query.Pixel.findFirst({
    where: criteria.slug ? eq(Pixel.slug, criteria.slug) : eq(Pixel.id, criteria.id as string),
  });
}

export async function getPixel(pixelId: string) {
  return findPixel({ id: pixelId });
}

export async function getPixels(
  whereArgs: { userId?: string; organizationId?: string },
  filters: QueryFilters = {},
) {
  const { search, page = 1, pageSize = 10, orderBy = 'createdAt', sort = 'desc' } = filters;
  const limit = Number(pageSize);
  const offset = (Number(page) - 1) * limit;

  const conditions = [];
  if (whereArgs.userId) conditions.push(eq(Pixel.userId, whereArgs.userId));
  if (whereArgs.organizationId) conditions.push(eq(Pixel.organizationId, whereArgs.organizationId));

  if (search) {
    conditions.push(or(ilike(Pixel.name, `%${search}%`), ilike(Pixel.slug, `%${search}%`)));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db.query.Pixel.findMany({
    where,
    orderBy: sort === 'desc' ? [desc((Pixel as any)[orderBy])] : [asc((Pixel as any)[orderBy])],
    limit,
    offset,
  });

  const countRes = await db
    .select({ count: require('drizzle-orm').count() })
    .from(Pixel)
    .where(where);

  return {
    data,
    count: countRes[0].count,
    page: Number(page),
    pageSize: limit,
  };
}

export async function getUserPixels(userId: string, filters?: QueryFilters) {
  return getPixels({ userId }, filters);
}

export async function getOrganizationPixels(organizationId: string, filters?: QueryFilters) {
  return getPixels({ organizationId }, filters);
}

export async function createPixel(data: any) {
  const [created] = await db
    .insert(Pixel)
    .values({
      ...data,
      id: data.id || uuid(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return created;
}

export async function updatePixel(pixelId: string, data: any) {
  const [updated] = await db
    .update(Pixel)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(Pixel.id, pixelId))
    .returning();
  return updated;
}

export async function deletePixel(pixelId: string) {
  const [deleted] = await db.delete(Pixel).where(eq(Pixel.id, pixelId)).returning();
  return deleted;
}
