import { and, asc, desc, eq, count } from 'drizzle-orm';
import { db } from '../client';
import { Client } from '../schema';
import type { QueryFilters } from '@vision/shared-types';

export async function getClient(id: string) {
  return db.query.Client.findFirst({
    where: eq(Client.id, id),
  });
}

export async function getClients(projectId: string, filters: QueryFilters = {}) {
  const { page = 1, pageSize = 10, orderBy = 'createdAt', sort = 'desc' } = filters;
  const limit = Number(pageSize);
  const offset = (Number(page) - 1) * limit;

  const conditions = [eq(Client.projectId, projectId)];

  const where = and(...conditions);

  const data = await db.query.Client.findMany({
    where,
    orderBy: sort === 'desc' ? [desc((Client as any)[orderBy])] : [asc((Client as any)[orderBy])],
    limit,
    offset,
  });

  const countRes = await db
    .select({ count: count() })
    .from(Client)
    .where(where);

  return {
    data,
    count: countRes[0].count,
    page: Number(page),
    pageSize: limit,
  };
}

export async function createClient(data: Partial<typeof Client.$inferInsert>) {
  const [created] = await db
    .insert(Client)
    .values({
      ...data,
      id: data.id || crypto.randomUUID(),
      name: data.name!,
      ignoreCorsAndSecret: data.ignoreCorsAndSecret ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return created;
}

export async function updateClient(id: string, data: Partial<typeof Client.$inferInsert>) {
  const [updated] = await db
    .update(Client)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(Client.id, id))
    .returning();
  return updated;
}

export async function deleteClient(id: string) {
  const [deleted] = await db.delete(Client).where(eq(Client.id, id)).returning();
  return deleted;
}
