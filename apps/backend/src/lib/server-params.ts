
// Mock getRequestFilters since it relies on constants.
import { DEFAULT_DATE_RANGE_VALUE, DEFAULT_PAGE_SIZE, FILTER_COLUMNS } from './constants.js';
import { getCompareDate, getMinimumUnit, maxDate, parseDateRange } from './date.js';
import { fetchProject } from './load.js';
import { filtersArrayToObject } from './params.js';
import { getProjectSegment } from '@vision/db';

function getRequestFilters(query: Record<string, any>) {
  const result: Record<string, any> = {};
  for (const key of Object.keys(FILTER_COLUMNS)) {
    const value = query[key];
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

export async function getServerQueryFilters(searchParams: Record<string, any>, projectId?: string) {
  // Extract date range from searchParams or default
  const dateValue = searchParams?.date || DEFAULT_DATE_RANGE_VALUE;
  const timezone = searchParams?.timezone;
  const offset = Number(searchParams?.offset || 0);

  // Parse date range
  const dateRangeObj = parseDateRange(dateValue, 'en-US', timezone);

  let startDate = dateRangeObj.startDate;
  let endDate = dateRangeObj.endDate;
  const unit = dateRangeObj.unit;

  // Apply offset if needed
  if (offset) {
    const { getOffsetDateRange } = await import('@/lib/date');
    const offsetRange = getOffsetDateRange(dateRangeObj, offset);
    startDate = offsetRange.startDate;
    endDate = offsetRange.endDate;
  }

  const dateRange = { startDate, endDate, unit, timezone };
  const filters = getRequestFilters(searchParams);

  if (projectId) {
    const project = await fetchProject(projectId);
    if (project?.resetAt) {
      dateRange.startDate = maxDate(dateRange.startDate, new Date(project.resetAt));
    }

    if (searchParams?.segment) {
      const segmentParams = (await getProjectSegment(projectId, searchParams.segment))
        ?.parameters as Record<string, any>;
      if (segmentParams?.filters) {
        Object.assign(filters, filtersArrayToObject(segmentParams.filters));
      }
    }
  }

  return {
    ...dateRange,
    ...filters,
    page: searchParams?.page,
    pageSize: searchParams?.pageSize || DEFAULT_PAGE_SIZE,
    orderBy: searchParams?.orderBy,
    sortDescending: searchParams?.sortDescending,
    search: searchParams?.search,
    compare: searchParams?.compare,
  };
}
