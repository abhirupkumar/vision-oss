import { and, asc, desc, eq, ilike, or, count } from 'drizzle-orm';
import { db } from '../client';
import { Report } from '../schema';
import type { QueryFilters } from '@vision/shared-types';

export async function findReport(criteria: { id?: string }) {
  if (!criteria.id) return null;
  return db.query.Report.findFirst({
    where: eq(Report.id, criteria.id),
  });
}

export async function getReport(reportId: string) {
  return findReport({ id: reportId });
}

export async function getReports(
  whereArgs: { userId?: string; projectId?: string },
  filters: QueryFilters = {},
) {
  const { search, page = 1, pageSize = 10, orderBy = 'createdAt', sort = 'desc' } = filters;
  const limit = Number(pageSize);
  const offset = (Number(page) - 1) * limit;

  const conditions = [];
  if (whereArgs.userId) conditions.push(eq(Report.userId, whereArgs.userId));
  if (whereArgs.projectId) conditions.push(eq(Report.projectId, whereArgs.projectId));

  if (search) {
    conditions.push(
      or(
        ilike(Report.name, `%${search}%`),
        ilike(Report.description, `%${search}%`),
        ilike(Report.type, `%${search}%`),
      ),
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db.query.Report.findMany({
    where,
    orderBy: sort === 'desc' ? [desc((Report as any)[orderBy])] : [asc((Report as any)[orderBy])],
    limit,
    offset,
  });

  const countRes = await db
    .select({ count: count() })
    .from(Report)
    .where(where);

  return {
    data,
    count: countRes[0].count,
    page: Number(page),
    pageSize: limit,
  };
}

export async function getUserReports(userId: string, filters?: QueryFilters) {
  const { search, page = 1, pageSize = 10, orderBy = 'createdAt', sort = 'desc' } = filters || {};
  const limit = Number(pageSize);
  const offset = (Number(page) - 1) * limit;

  const conditions = [eq(Report.userId, userId)];
  if (search) {
    conditions.push(
      or(
        ilike(Report.name, `%${search}%`),
        ilike(Report.description, `%${search}%`),
        ilike(Report.type, `%${search}%`),
      ),
    );
  }

  const where = and(...conditions);

  const data = await db.query.Report.findMany({
    where,
    with: {
      project: {
        columns: { domain: true, userId: true },
      },
    },
    orderBy: sort === 'desc' ? [desc((Report as any)[orderBy])] : [asc((Report as any)[orderBy])],
    limit,
    offset,
  });

  const countRes = await db
    .select({ count: count() })
    .from(Report)
    .where(where);

  return {
    data,
    count: countRes[0].count,
    page: Number(page),
    pageSize: limit,
  };
}

export async function getProjectReports(projectId: string, filters: QueryFilters = {}) {
  return getReports({ projectId }, filters);
}

export async function createReport(data: any) {
  const [created] = await db
    .insert(Report)
    .values({
      ...data,
      id: data.id || crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return created;
}

export async function updateReport(reportId: string, data: any) {
  const [updated] = await db
    .update(Report)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(Report.id, reportId))
    .returning();
  return updated;
}

export async function deleteReport(reportId: string) {
  const [deleted] = await db.delete(Report).where(eq(Report.id, reportId)).returning();
  return deleted;
}
