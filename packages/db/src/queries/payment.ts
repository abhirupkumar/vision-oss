import { and, asc, desc, eq, count } from 'drizzle-orm';
import { db } from '../client';
import { PaymentConnection } from '../schema';
import type { QueryFilters } from '@vision/shared-types';

export async function getPaymentConnection(id: string) {
  return db.query.PaymentConnection.findFirst({
    where: eq(PaymentConnection.id, id),
  });
}

export async function getPaymentConnections(projectId: string, filters: QueryFilters = {}) {
  const { page = 1, pageSize = 10, orderBy = 'createdAt', sort = 'desc' } = filters;
  const limit = Number(pageSize);
  const offset = (Number(page) - 1) * limit;

  const conditions = [eq(PaymentConnection.projectId, projectId)];

  const where = and(...conditions);

  const data = await db.query.PaymentConnection.findMany({
    where,
    orderBy: sort === 'desc' ? [desc((PaymentConnection as any)[orderBy])] : [asc((PaymentConnection as any)[orderBy])],
    limit,
    offset,
  });

  const countRes = await db
    .select({ count: count() })
    .from(PaymentConnection)
    .where(where);

  return {
    data,
    count: countRes[0].count,
    page: Number(page),
    pageSize: limit,
  };
}

export async function createPaymentConnection(data: Partial<typeof PaymentConnection.$inferInsert>) {
  const [created] = await db
    .insert(PaymentConnection)
    .values({
      ...data,
      id: data.id || crypto.randomUUID(),
      projectId: data.projectId!,
      provider: data.provider!,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return created;
}

export async function updatePaymentConnection(id: string, data: Partial<typeof PaymentConnection.$inferInsert>) {
  const [updated] = await db
    .update(PaymentConnection)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(PaymentConnection.id, id))
    .returning();
  return updated;
}

export async function deletePaymentConnection(id: string) {
  const [deleted] = await db.delete(PaymentConnection).where(eq(PaymentConnection.id, id)).returning();
  return deleted;
}
