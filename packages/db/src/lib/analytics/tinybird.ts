import formatInTimeZone from 'date-fns-tz/formatInTimeZone';
import debug from 'debug';
import {
  _getUTCString as getUTCString,
  _getDateSQL as getDateSQL,
  _getDateStringSQL as getDateStringSQL,
  _getFilterQuery as getFilterQuery,
  _parseFilters as parseFilters,
  _getSearchSQL as getSearchSQL,
  _CLICKHOUSE_DATE_FORMATS as CLICKHOUSE_DATE_FORMATS,
} from './clickhouse';
import { DEFAULT_PAGE_SIZE } from './constants';
import type { QueryFilters } from '@vision/shared-types';
import type { AnalyticsDriver } from './driver';

const log = debug('vision:tinybird');

function getTinybirdUrl() {
  return process.env.TINYBIRD_URL?.replace(/\/$/, '');
}

function getTinybirdToken() {
  return process.env.TINYBIRD_TOKEN;
}

function isEnabled() {
  return Boolean(getTinybirdUrl() && getTinybirdToken());
}

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${getTinybirdToken()}` };
}

function formatDateTimeValue(value: unknown): string {
  if (value instanceof Date) {
    return formatInTimeZone(value, 'UTC', 'yyyy-MM-dd HH:mm:ss');
  }

  if (typeof value === 'number') {
    const ms = value > 1e10 ? value : value * 1000;
    return formatInTimeZone(new Date(ms), 'UTC', 'yyyy-MM-dd HH:mm:ss');
  }

  if (typeof value === 'string') {
    const s = value.trim();
    if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/.test(s)) {
      return s.replace('T', ' ').slice(0, 19);
    }
    const parsed = new Date(s);
    if (!isNaN(parsed.getTime())) {
      return formatInTimeZone(parsed, 'UTC', 'yyyy-MM-dd HH:mm:ss');
    }
    return s;
  }

  return String(value);
}

function substituteParams(query: string, params: Record<string, unknown>): string {
  return query.replace(/\{(\w+):([^}]+)\}/g, (_match, name, rawType) => {
    if (!(name in params)) return `''`;

    const value = params[name];
    const type = rawType.trim().toUpperCase();

    if (value === null || value === undefined) return 'NULL';

    if (
      type.startsWith('UINT') ||
      type.startsWith('INT') ||
      type.startsWith('FLOAT') ||
      type.startsWith('DECIMAL')
    ) {
      return String(Number(value));
    }

    if (type.startsWith('ARRAY')) {
      const innerType = type.match(/ARRAY\((\w+)\)/)?.[1] ?? 'STRING';
      const arr = Array.isArray(value) ? value : [value];
      const items = arr.map(v =>
        innerType === 'STRING' || innerType.startsWith('FIXED')
          ? `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
          : String(Number(v)),
      );
      return `[${items.join(', ')}]`;
    }

    if (type.startsWith('DATETIME64') || type === 'DATETIME64') {
      return `toDateTime64('${formatDateTimeValue(value)}', 3, 'UTC')`;
    }
    if (type.startsWith('DATETIME') || type === 'DATETIME') {
      return `toDateTime('${formatDateTimeValue(value)}', 'UTC')`;
    }
    if (type === 'DATE') {
      return `toDate('${formatDateTimeValue(value).slice(0, 10)}')`;
    }

    let strValue = String(value);
    if (value instanceof Date) {
      strValue = formatDateTimeValue(value);
    }

    return `'${strValue.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  });
}

export async function rawQuery<T = unknown>(
  query: string,
  params: Record<string, unknown> = {},
  _name?: string,
): Promise<T> {
  if (!isEnabled()) throw new Error('Tinybird is not configured (TINYBIRD_URL/TINYBIRD_TOKEN missing)');

  const trimmed = query.trim().replace(/;+\s*$/, '');

  const truncateMatch = trimmed.match(/^TRUNCATE\s+TABLE\s+(\w+)/i);
  if (truncateMatch) {
    return truncateTable(truncateMatch[1]) as unknown as T;
  }

  const deleteMatch = trimmed.match(/^ALTER\s+TABLE\s+(\w+)\s+DELETE\s+WHERE\s+([\s\S]+)/i);
  if (deleteMatch) {
    return deleteRows(deleteMatch[1], deleteMatch[2].trim()) as unknown as T;
  }

  const substituted = substituteParams(trimmed, params);

  const qs = new URLSearchParams({ q: substituted + ' FORMAT JSON' });
  const url = `${getTinybirdUrl()}/v0/sql?${qs.toString()}`;
  log('QUERY %s', substituted.slice(0, 120));

  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tinybird query failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  return ((json as any).data ?? json) as T;
}

function getMultiSearchSQL(columns: string[]) {
  if (columns.length === 0) return '';
  const searchParams = columns.map(col => `positionCaseInsensitive(${col}, {search:String}) > 0`);
  return `and (${searchParams.join(' or ')})`;
}

export async function pagedRawQuery(
  query: string,
  queryParams: Record<string, any>,
  filters: QueryFilters,
  name?: string,
) {
  const { page = 1, pageSize, orderBy, sortDescending = false, search } = filters;
  const size = +(pageSize as any) || DEFAULT_PAGE_SIZE;
  const offset = +size * (+(page as any) - 1);
  const direction = sortDescending ? 'desc' : 'asc';

  const statements = [
    orderBy && `order by ${orderBy} ${direction}`,
    +size > 0 && `limit ${+size} offset ${+offset}`,
  ]
    .filter(Boolean)
    .join('\n');

  const count = await rawQuery<any[]>(
    `select count(*) as num from (${query}) t`,
    queryParams,
  ).then(res => res[0].num);

  const data = await rawQuery<any[]>(`${query}\n${statements}`, queryParams, name);

  return { data, count, page: +page, pageSize: size, orderBy, search };
}

export async function insert(table: string, values: Record<string, unknown>[]) {
  if (!isEnabled()) throw new Error('Tinybird is not configured');

  const cleanValues = values.map(v => {
    const obj: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(v)) {
      if (val !== null && val !== undefined) {
        obj[key] = val;
      }
    }
    return obj;
  });

  const ndjson = cleanValues.map(v => JSON.stringify(v)).join('\n');
  const url = `${getTinybirdUrl()}/v0/events?name=${encodeURIComponent(table)}`;
  log('INSERT %s (%d rows)', table, values.length);

  const res = await fetch(url, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: ndjson,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tinybird insert failed (${res.status}): ${text}`);
  }

  return res.json();
}

async function truncateTable(table: string) {
  log('TRUNCATE %s', table);
  const res = await fetch(`${getTinybirdUrl()}/v0/datasources/${encodeURIComponent(table)}/truncate`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tinybird truncate failed for ${table} (${res.status}): ${text}`);
  }
  return res.json();
}

async function deleteRows(table: string, condition: string) {
  log('DELETE FROM %s WHERE %s', table, condition);
  const res = await fetch(
    `${getTinybirdUrl()}/v0/datasources/${encodeURIComponent(table)}/rows?delete_condition=${encodeURIComponent(condition)}`,
    { method: 'DELETE', headers: authHeaders() },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tinybird delete rows failed for ${table} (${res.status}): ${text}`);
  }
  return res.json();
}

function findUnique<T>(data: T[]): T | null {
  if (data.length > 1) {
    throw new Error(`${data.length} records found when expecting 1.`);
  }

  return findFirst(data);
}

function findFirst<T>(data: T[]): T | null {
  return data[0] ?? null;
}

export const tinybirdDriver: AnalyticsDriver = {
  get enabled() { return isEnabled(); },
  getUTCString,
  getDateSQL,
  getDateStringSQL,
  getSearchSQL,
  getFilterQuery,
  parseFilters,
  pagedRawQuery,
  rawQuery,
  insert: insert as any,
  findFirst,
  findUnique,
};

export default tinybirdDriver;
