import { and, asc, desc, eq, ilike, count } from 'drizzle-orm';
import { db } from '../client';
import { Integration } from '../schema';
import type { QueryFilters } from '@vision/shared-types';

export async function getIntegration(id: string) {
  return db.query.Integration.findFirst({
    where: eq(Integration.id, id),
  });
}

export async function getIntegrations(organizationId: string, filters: QueryFilters = {}) {
  const { search, page = 1, pageSize = 10, orderBy = 'createdAt', sort = 'desc' } = filters;
  const limit = Number(pageSize);
  const offset = (Number(page) - 1) * limit;

  const conditions = [eq(Integration.organizationId, organizationId)];

  if (search) {
    conditions.push(ilike(Integration.name, `%${search}%`));
  }

  const where = and(...conditions);

  const data = await db.query.Integration.findMany({
    where,
    orderBy: sort === 'desc' ? [desc((Integration as any)[orderBy])] : [asc((Integration as any)[orderBy])],
    limit,
    offset,
  });

  const countRes = await db
    .select({ count: count() })
    .from(Integration)
    .where(where);

  return {
    data,
    count: countRes[0].count,
    page: Number(page),
    pageSize: limit,
  };
}

export async function createIntegration(data: Partial<typeof Integration.$inferInsert>) {
  const [created] = await db
    .insert(Integration)
    .values({
      ...data,
      id: data.id || crypto.randomUUID(),
      organizationId: data.organizationId!,
      config: data.config || {},
      name: data.name!,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return created;
}

export async function updateIntegration(id: string, data: Partial<typeof Integration.$inferInsert>) {
  const [updated] = await db
    .update(Integration)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(Integration.id, id))
    .returning();
  return updated;
}

export async function deleteIntegration(id: string) {
  const [deleted] = await db.delete(Integration).where(eq(Integration.id, id)).returning();
  return deleted;
}
