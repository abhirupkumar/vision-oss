import { and, asc, desc, eq, ilike, or, count } from 'drizzle-orm';
import { db } from '../client';
import { Member, User } from '../schema';
import { uuid } from '../lib/crypto';
import type { QueryFilters } from '../lib/types.js';

export async function findMember(criteria: { id?: string }) {
  if (!criteria.id) return null;
  return db.query.Member.findFirst({
    where: eq(Member.id, criteria.id),
  });
}

export async function getMember(organizationId: string, userId: string) {
  return db.query.Member.findFirst({
    where: and(eq(Member.organizationId, organizationId), eq(Member.userId, userId)),
  });
}

export async function getMembers(
  whereArgs: { organizationId?: string; userId?: string },
  filters?: QueryFilters,
) {
  const { search, page = 1, pageSize = 10, orderBy = 'createdAt', sort = 'desc' } = filters || {};
  const limit = Number(pageSize);
  const offset = (Number(page) - 1) * limit;

  const conditions = [];
  if (whereArgs.organizationId)
    conditions.push(eq(Member.organizationId, whereArgs.organizationId));
  if (whereArgs.userId) conditions.push(eq(Member.userId, whereArgs.userId));

  if (search) {
    // In Prisma it was: user: { email: 'contains' }
    // We need to join User to search by email, but with db.query we can't filter top level by relation
    // So we use db.select for search
    const query = db
      .select()
      .from(Member)
      .innerJoin(User, eq(Member.userId, User.id))
      .where(and(...conditions, ilike(User.email, `%${search}%`)))
      .orderBy(sort === 'desc' ? desc((Member as any)[orderBy]) : asc((Member as any)[orderBy]))
      .limit(limit)
      .offset(offset);

    const dataRes = await query;
    const data = dataRes.map(r => ({ ...r.member, user: r.user }));

    const countQuery = await db
      .select({ count: count() })
      .from(Member)
      .innerJoin(User, eq(Member.userId, User.id))
      .where(and(...conditions, ilike(User.email, `%${search}%`)));

    return {
      data,
      count: countQuery[0].count,
      page: Number(page),
      pageSize: limit,
    };
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db.query.Member.findMany({
    where,
    with: { user: true },
    orderBy: sort === 'desc' ? [desc((Member as any)[orderBy])] : [asc((Member as any)[orderBy])],
    limit,
    offset,
  });

  const countRes = await db
    .select({ count: count() })
    .from(Member)
    .where(where);

  return {
    data,
    count: countRes[0].count,
    page: Number(page),
    pageSize: limit,
  };
}

export async function createMember(userId: string, organizationId: string, role: string) {
  const [created] = await db
    .insert(Member)
    .values({
      id: uuid(),
      userId,
      organizationId,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return created;
}

export async function updateMember(memberId: string, data: any) {
  const [updated] = await db
    .update(Member)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(Member.id, memberId))
    .returning();
  return updated;
}

export async function deleteMember(organizationId: string, userId: string) {
  const [deleted] = await db
    .delete(Member)
    .where(and(eq(Member.organizationId, organizationId), eq(Member.userId, userId)))
    .returning();
  return deleted;
}

export async function deleteMemberById(id: string) {
  const [deleted] = await db.delete(Member).where(eq(Member.id, id)).returning();
  return deleted;
}
