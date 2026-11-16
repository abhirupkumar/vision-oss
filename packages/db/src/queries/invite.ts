import { and, asc, desc, eq, count, ilike } from 'drizzle-orm';
import { db } from '../client';
import { Invite } from '../schema';
import type { QueryFilters } from '@vision/shared-types';

export async function createInvite(data: any) {
  const [created] = await db
    .insert(Invite)
    .values({
      ...data,
      id: data.id || crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return created;
}

export async function getInvitesByEmail(email: string) {
  return await db.query.Invite.findMany({
    where: eq(Invite.email, email),
  });
}

export async function getInvites(criteria: any, filters?: QueryFilters) {
  const { search, page = 1, pageSize = 10, orderBy = 'createdAt', sort = 'desc' } = filters || {};
  const limit = Number(pageSize);
  const offset = (Number(page) - 1) * limit;

  const conditions = Object.keys(criteria).map(key => eq((Invite as any)[key], criteria[key]));
  if (search) {
    conditions.push(ilike(Invite.email, `%${search}%`));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db.query.Invite.findMany({
    where,
    orderBy: sort === 'desc' ? [desc((Invite as any)[orderBy])] : [asc((Invite as any)[orderBy])],
    limit,
    offset,
  });

  const countRes = await db
    .select({ count: count() })
    .from(Invite)
    .where(where);

  return {
    data,
    count: countRes[0].count,
    page: Number(page),
    pageSize: limit,
  };
}

export async function deleteInvite(id: string) {
  const [deleted] = await db.delete(Invite).where(eq(Invite.id, id)).returning();
  return deleted;
}
