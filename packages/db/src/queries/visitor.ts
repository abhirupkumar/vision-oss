import type { QueryFilters } from '@vision/shared-types';
import { getProjectVisitors, getProjectVisitor } from './analytics/sessions';

export async function findVisitor(criteria: { id?: string; projectId?: string }) {
  if (!criteria.id) return null;
  if (criteria.projectId) {
    return getProjectVisitor(criteria.projectId, criteria.id);
  }
  return null;
}

export async function getVisitor(visitorId: string, projectId?: string) {
  return findVisitor({ id: visitorId, projectId });
}

export async function getVisitors(projectId: string, filters: QueryFilters = {}) {
  // Use analytics query engine (Tinybird/Clickhouse)
  try {
    const res = await getProjectVisitors(projectId, filters);
    if (res && res.data) return res;
  } catch (e) {
    console.error('getVisitors failed:', e);
  }

  const { page = 1, pageSize = 10 } = filters;
  const limit = Number(pageSize);

  return {
    data: [],
    count: 0,
    page: Number(page),
    pageSize: limit,
  };
}

export async function createVisitor(data: any) {
  return {
    id: data.id || crypto.randomUUID(),
    ...data,
    createdAt: new Date(),
  };
}

export async function updateVisitor(visitorId: string, data: any) {
  return {
    id: visitorId,
    ...data,
  };
}

export async function deleteVisitor(visitorId: string) {
  return null;
}
