import type { QueryFilters, QueryOptions, ParsedFilters } from '@vision/shared-types';

export interface AnalyticsDriver {
  enabled: boolean;
  rawQuery<T = unknown>(query: string, params?: Record<string, unknown>, name?: string): Promise<T>;
  pagedRawQuery(
    query: string,
    params: Record<string, unknown>,
    filters: QueryFilters,
    name?: string,
  ): Promise<{ data: unknown[]; count: number | string; page: number; pageSize: number; orderBy?: string; search?: string }>;
  insert(table: string, values: Record<string, unknown>[]): Promise<void>;
  getUTCString(date?: Date | string | number): string;
  getDateSQL(field: string, unit: string, timezone?: string): string;
  getDateStringSQL(data: any, unit?: string, timezone?: string): string;
  getSearchSQL(column: string, param?: string): string;
  getFilterQuery(filters: Record<string, any>, options?: QueryOptions): string;
  parseFilters(filters: Record<string, any>, options?: QueryOptions): ParsedFilters;
  findFirst<T>(data: T[]): T | null;
  findUnique<T>(data: T[]): T | null;
}

// The driver is selected at runtime based on env vars.
export async function createAnalyticsDriver(): Promise<AnalyticsDriver> {
  if (process.env.TINYBIRD_URL && process.env.TINYBIRD_TOKEN) {
    const { tinybirdDriver } = await import('./tinybird.js');
    return tinybirdDriver;
  }
  if (process.env.CLICKHOUSE_URL) {
    const { clickhouseDriver } = await import('./clickhouse.js');
    return clickhouseDriver;
  }
  throw new Error('No analytics backend configured. Set TINYBIRD_URL+TINYBIRD_TOKEN or CLICKHOUSE_URL.');
}
