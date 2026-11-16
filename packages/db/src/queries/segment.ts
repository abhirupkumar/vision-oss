import { and, asc, desc, eq, ilike, count } from 'drizzle-orm';
import { db } from '../client';
import { Segment } from '../schema';
import type { QueryFilters } from '@vision/shared-types';

export async function findSegment(criteria: { id?: string }) {
  if (!criteria.id) return null;
  return db.query.Segment.findFirst({
    where: eq(Segment.id, criteria.id),
  });
}

export async function getSegment(segmentId: string) {
  return findSegment({ id: segmentId });
}

export async function getSegments(
  whereArgs: { projectId?: string; type?: string },
  filters: QueryFilters = {},
) {
  const { search, page = 1, pageSize = 10, orderBy = 'createdAt', sort = 'desc' } = filters;
  const limit = Number(pageSize);
  const offset = (Number(page) - 1) * limit;

  const conditions = [];
  if (whereArgs.projectId) conditions.push(eq(Segment.projectId, whereArgs.projectId));
  if (whereArgs.type) conditions.push(eq(Segment.type, whereArgs.type));

  if (search) {
    conditions.push(ilike(Segment.name, `%${search}%`));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db.query.Segment.findMany({
    where,
    orderBy: sort === 'desc' ? [desc((Segment as any)[orderBy])] : [asc((Segment as any)[orderBy])],
    limit,
    offset,
  });

  const countRes = await db
    .select({ count: count() })
    .from(Segment)
    .where(where);

  return {
    data,
    count: countRes[0].count,
    page: Number(page),
    pageSize: limit,
  };
}

export async function getProjectSegment(projectId: string, segmentId: string) {
  return db.query.Segment.findFirst({
    where: and(eq(Segment.id, segmentId), eq(Segment.projectId, projectId)),
  });
}

export async function getProjectSegments(
  projectId: string,
  type: string,
  filters: QueryFilters = {},
) {
  return getSegments({ projectId, type }, filters);
}

export async function createSegment(data: Partial<typeof Segment.$inferInsert>) {
  const [created] = await db
    .insert(Segment)
    .values({
      ...data,
      id: data.id || crypto.randomUUID(),
      projectId: data.projectId!,
      type: data.type!,
      name: data.name!,
      parameters: data.parameters || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return created;
}

export async function updateSegment(segmentId: string, data: Partial<typeof Segment.$inferInsert>) {
  const [updated] = await db
    .update(Segment)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(Segment.id, segmentId))
    .returning();
  return updated;
}

export async function deleteSegment(segmentId: string) {
  const [deleted] = await db.delete(Segment).where(eq(Segment.id, segmentId)).returning();
  return deleted;
}
