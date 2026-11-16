
import { z } from 'zod';
import { DEFAULT_PAGE_SIZE, FILTER_COLUMNS } from './constants.js';
import { getAllowedUnits, getMinimumUnit, maxDate, parseDateRange } from './date.js';
import { fetchProject } from './load.js';
import { filtersArrayToObject } from './params.js';
import type { QueryFilters } from './types.js';
import { getProjectSegment } from '@vision/db';

export async function getJsonBody(request: Request) {
  try {
    return await request.clone().json();
  } catch {
    return undefined;
  }
}

export function getRequestDateRange(query: Record<string, string>) {
  const { startAt, endAt, unit, timezone } = query;

  const startDate = new Date(+startAt);
  const endDate = new Date(+endAt);

  return {
    startDate,
    endDate,
    timezone,
    unit: getAllowedUnits(startDate, endDate).includes(unit)
      ? unit
      : getMinimumUnit(startDate, endDate),
  };
}

export function getRequestFilters(query: Record<string, any>) {
  const result: Record<string, any> = {};

  for (const key of Object.keys(FILTER_COLUMNS)) {
    const value = query[key];
    if (value !== undefined) {
      result[key] = value;
    }
  }

  return result;
}

export async function setProjectDate(projectId: string, data: Record<string, any>) {
  const project = await fetchProject(projectId);

  if (project?.resetAt) {
    data.startDate = maxDate(data.startDate, new Date(project?.resetAt));
  }

  return data;
}

export async function getQueryFilters(
  params: Record<string, any>,
  projectIdOrSlug?: string,
): Promise<QueryFilters> {
  const dateRange = getRequestDateRange(params);
  const filters = getRequestFilters(params);

  if (projectIdOrSlug) {
    const project = await fetchProject(projectIdOrSlug);
    const projectId = project?.id;

    if (projectId) {
      await setProjectDate(projectId, dateRange);

      if (params.segment) {
        const segmentParams = (await getProjectSegment(projectId, params.segment))
          ?.parameters as Record<string, any>;

        Object.assign(filters, filtersArrayToObject(segmentParams.filters));
      }

      if (params.cohort) {
        const cohortParams = (await getProjectSegment(projectId, params.cohort))
          ?.parameters as Record<string, any>;

        const { startDate, endDate } = parseDateRange(cohortParams.dateRange);

        const cohortFilters = cohortParams.filters.map(({ name, ...props }) => ({
          ...props,
          name: `cohort_${name}`,
        }));

        cohortFilters.push({
          name: `cohort_${cohortParams.action.type}`,
          operator: 'eq',
          value: cohortParams.action.value,
        });

        Object.assign(filters, {
          ...filtersArrayToObject(cohortFilters),
          cohort_startDate: startDate,
          cohort_endDate: endDate,
        });
      }
    }
  }

  return {
    ...dateRange,
    ...filters,
    page: params?.page,
    pageSize: params?.pageSize ? params?.pageSize || DEFAULT_PAGE_SIZE : undefined,
    orderBy: params?.orderBy,
    sortDescending: params?.sortDescending,
    search: params?.search,
    compare: params?.compare,
  };
}
