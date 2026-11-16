// Query filtering and pagination types shared across the stack
export interface Filter {
  name: string;
  value: any;
}
export interface QueryFilters {
  startDate?: Date | string;
  endDate?: Date | string;
  timezone?: string;
  unit?: string;
  eventType?: number;
  url?: string;
  referrer?: string;
  title?: string;
  query?: string;
  host?: string;
  os?: string;
  browser?: string;
  device?: string;
  country?: string;
  region?: string;
  city?: string;
  language?: string;
  event?: string;
  tag?: string;
  search?: string;
  page?: number | string;
  pageSize?: number | string;
  orderBy?: string;
  sort?: 'asc' | 'desc';
  sortDescending?: boolean;
  limit?: number;
  offset?: number;
  // Cohort filters (prefixed with cohort_)
  [key: string]: unknown;
}

export interface QueryOptions {
  joinSession?: boolean;
  isCohort?: boolean;
  cohortMode?: boolean;
  columns?: Record<string, string>;
  prefix?: string;
}

export interface PageResult<T = unknown> {
  data: T[];
  count: number | string;
  page: number;
  pageSize: number;
  orderBy?: string;
  search?: string;
}

export interface ParsedFilters {
  filterQuery: string;
  dateQuery: string;
  queryParams: Record<string, unknown>;
  cohortQuery: string;
}
