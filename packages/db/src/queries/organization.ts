import { and, asc, desc, eq, ilike, isNull, count } from 'drizzle-orm';
import { db } from '../client';
import { Member, Organization, Project } from '../schema';
import type { QueryFilters, PageResult } from '@vision/shared-types';

export async function findOrganization(criteria: { id?: string; accessCode?: string }) {
  if (!criteria.id && !criteria.accessCode) return null;
  const conditions = [];
  if (criteria.id) conditions.push(eq(Organization.id, criteria.id));
  if (criteria.accessCode) conditions.push(eq(Organization.accessCode, criteria.accessCode));
  return db.query.Organization.findFirst({
    where: and(...conditions),
  });
}

export async function getOrganization(
  organizationId: string,
  options: { includeMembers?: boolean } = {},
) {
  const { includeMembers } = options;

  return db.query.Organization.findFirst({
    where: eq(Organization.id, organizationId),
    with: includeMembers ? { members: true } : undefined,
  });
}

export async function getOrganizations(whereArgs: { deletedAt?: null }, filters: QueryFilters) {
  const { search, page = 1, pageSize = 10, orderBy = 'createdAt', sort = 'desc' } = filters;
  const limit = Number(pageSize);
  const offset = (Number(page) - 1) * limit;

  const conditions = [];
  if (whereArgs.deletedAt === null) conditions.push(isNull(Organization.deletedAt));

  if (search) {
    conditions.push(ilike(Organization.name, `%${search}%`));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db.query.Organization.findMany({
    where,
    orderBy:
      sort === 'desc'
        ? [desc((Organization as any)[orderBy])]
        : [asc((Organization as any)[orderBy])],
    limit,
    offset,
  });

  const countRes = await db
    .select({ count: count() })
    .from(Organization)
    .where(where);

  return {
    data,
    count: countRes[0].count,
    page: Number(page),
    pageSize: limit,
  };
}

export async function getUserOrganizations(userId: string, filters: QueryFilters = {}) {
  const { search, page = 1, pageSize = 10, orderBy = 'createdAt', sort = 'desc' } = filters;
  const limit = Number(pageSize);
  const offset = (Number(page) - 1) * limit;

  const query = db
    .select({
      organization: Organization,
      member: Member,
    })
    .from(Organization)
    .innerJoin(Member, eq(Organization.id, Member.organizationId))
    .where(
      and(
        isNull(Organization.deletedAt),
        eq(Member.userId, userId),
        search ? ilike(Organization.name, `%${search}%`) : undefined,
      ),
    );

  const dataRes = await query
    .orderBy(
      sort === 'desc' ? desc((Organization as any)[orderBy]) : asc((Organization as any)[orderBy]),
    )
    .limit(limit)
    .offset(offset);

  const data = await Promise.all(
    dataRes.map(async row => {
      const org = row.organization;

      const members = await db.query.Member.findMany({
        where: eq(Member.organizationId, org.id),
        with: { user: { columns: { id: true, email: true } } },
      });

      const projectsCountRes = await db
        .select({ count: count() })
        .from(Project)
        .where(and(eq(Project.organizationId, org.id), isNull(Project.deletedAt)));

      const activeMembersCount = members.filter(m => m.user && !(m.user as any).deletedAt).length;

      return {
        ...org,
        members,
        _count: {
          projects: projectsCountRes[0].count,
          members: activeMembersCount,
        },
      };
    }),
  );

  const countQuery = await db
    .select({ count: count() })
    .from(Organization)
    .innerJoin(Member, eq(Organization.id, Member.organizationId))
    .where(
      and(
        isNull(Organization.deletedAt),
        eq(Member.userId, userId),
        search ? ilike(Organization.name, `%${search}%`) : undefined,
      ),
    );

  return {
    data,
    count: countQuery[0].count,
    page: Number(page),
    pageSize: limit,
  };
}

export async function getAllUserOrganizations(userId: string) {
  const dataRes = await db
    .select({
      organization: Organization,
    })
    .from(Organization)
    .innerJoin(Member, eq(Organization.id, Member.organizationId))
    .where(and(isNull(Organization.deletedAt), eq(Member.userId, userId)));

  return Promise.all(
    dataRes.map(async row => {
      const org = row.organization;
      const members = await db.query.Member.findMany({
        where: eq(Member.organizationId, org.id),
        with: { user: { columns: { id: true, email: true } } },
      });
      return {
        id: org.id,
        name: org.name,
        logoUrl: org.logoUrl,
        members,
      };
    }),
  );
}

export async function createOrganization(
  data: Omit<typeof Organization.$inferInsert, 'id'>,
  userId: string,
): Promise<any> {
  const id = crypto.randomUUID();

  const res = await db.transaction(async (tx) => {
    const [org] = await tx
      .insert(Organization)
      .values({ ...data, id })
      .returning();
    await tx.insert(Member).values({
      id: crypto.randomUUID(),
      organizationId: id,
      userId,
      role: 'owner',
    });
    return org;
  });

  return res;
}

export async function updateOrganization(
  organizationId: string,
  data: Partial<typeof Organization.$inferInsert>,
) {
  const [updated] = await db
    .update(Organization)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(Organization.id, organizationId))
    .returning();

  return updated;
}

export async function deleteOrganization(organizationId: string) {
  const cloudMode = !!process.env.CLOUD_MODE;

  if (cloudMode) {
    const [deleted] = await db
      .update(Organization)
      .set({ deletedAt: new Date() })
      .where(eq(Organization.id, organizationId))
      .returning();
    return deleted;
  }

  return db.transaction(async (tx) => {
    await tx.delete(Member).where(eq(Member.organizationId, organizationId));
    const [deleted] = await tx
      .delete(Organization)
      .where(eq(Organization.id, organizationId))
      .returning();
    return deleted;
  });
}
