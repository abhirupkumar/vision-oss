import { type ClickHouseClient, createClient } from '@clickhouse/client-web';
import formatInTimeZone from 'date-fns-tz/formatInTimeZone';
import debug from 'debug';
import { DEFAULT_PAGE_SIZE, FILTER_COLUMNS, OPERATORS } from './constants';
import { filtersObjectToArray } from './params';
import type { QueryFilters, QueryOptions } from '@vision/shared-types';
import type { AnalyticsDriver } from './driver';

export const CLICKHOUSE_DATE_FORMATS: Record<string, string> = {
  utc: '%Y-%m-%dT%H:%i:%SZ',
  second: '%Y-%m-%d %H:%i:%S',
  minute: '%Y-%m-%d %H:%i:00',
  hour: '%Y-%m-%d %H:00:00',
  day: '%Y-%m-%d',
  month: '%Y-%m-01',
  year: '%Y-01-01',
};

const log = debug('vision:clickhouse');

let clickhouse: ClickHouseClient;

const CLICKHOUSE = Symbol.for('vision.clickhouse');

function getClient() {
  const {
    hostname,
    port,
    pathname,
    protocol,
    username = 'default',
    password,
  } = new URL(process.env.CLICKHOUSE_URL!);

  // Cloudflare Workers fetch() strictly requires http: or https:
  const safeProtocol = protocol.includes('http') ? protocol : (port === '8443' || port === '443' ? 'https:' : 'http:');
  const finalUrl = `${safeProtocol}//${hostname}:${port}`;

  console.log('[ClickHouse Init] Attempting to connect to URL:', finalUrl);

  const client = createClient({
    url: finalUrl,
    database: pathname.replace('/', ''),
    username: username,
    password,
  });

  if (process.env.NODE_ENV !== 'production') {
    (globalThis as any)[CLICKHOUSE] = client;
  }

  log('Clickhouse initialized');

  return client;
}

function getUTCString(date?: Date | string | number) {
  return formatInTimeZone(date || new Date(), 'UTC', 'yyyy-MM-dd HH:mm:ss');
}

function getDateStringSQL(data: any, unit: string = 'utc', timezone?: string) {
  if (timezone) {
    return `formatDateTime(${data}, '${CLICKHOUSE_DATE_FORMATS[unit]}', '${timezone}')`;
  }

  return `formatDateTime(${data}, '${CLICKHOUSE_DATE_FORMATS[unit]}')`;
}

function getDateSQL(field: string, unit: string, timezone?: string) {
  if (timezone) {
    return `toDateTime(date_trunc('${unit}', ${field}, '${timezone}'))`;
  }
  return `toDateTime(date_trunc('${unit}', ${field}))`;
}

export function getSearchSQL(column: string, param: string = 'search'): string {
  return `and positionCaseInsensitive(${column}, {${param}:String}) > 0`;
}

function mapFilter(column: string, operator: string, name: string, type: string = 'String') {
  const value = `{${name}:${type}}`;

  switch (operator) {
    case OPERATORS.equals:
      return `${column} = ${value}`;
    case OPERATORS.notEquals:
      return `${column} != ${value}`;
    case OPERATORS.contains:
      return `positionCaseInsensitive(${column}, ${value}) > 0`;
    case OPERATORS.doesNotContain:
      return `positionCaseInsensitive(${column}, ${value}) = 0`;
    default:
      return '';
  }
}

function getFilterQuery(filters: Record<string, any>, options: QueryOptions = {}) {
  const query = filtersObjectToArray(filters, options).reduce((arr: string[], f: any) => {
    const isCohort = options?.isCohort;

    if (isCohort) {
      f.column = FILTER_COLUMNS[f.name.slice('cohort_'.length)];
    }

    if (f.column) {
      if (f.name === 'eventType') {
        arr.push(`and ${mapFilter(f.column, f.operator as string, f.name, 'UInt32')}`);
      } else if (f.name === 'visitorId' || f.name === 'sessionId') {
        arr.push(`and ${mapFilter(f.column, f.operator as string, f.name, 'String')}`);
      } else {
        arr.push(`and ${mapFilter(f.column, f.operator as string, f.name)}`);
      }

      if (f.name === 'referrer') {
        arr.push(`and referrer_domain != hostname`);
      }
    }

    return arr;
  }, []);

  return query.join('\n');
}

function getCohortQuery(filters: Record<string, any>) {
  if (!filters || Object.keys(filters).length === 0) {
    return '';
  }

  const filterQuery = getFilterQuery(filters, { isCohort: true });

  return `join (
      select distinct session_id
      from project_event
      where project_id = {projectId:String}
      and created_at between {cohort_startDate:DateTime64} and {cohort_endDate:DateTime64}
      ${filterQuery}
    ) as cohort
      on cohort.session_id = project_event.session_id
    `;
}

function getDateQuery(filters: Record<string, any>) {
  const { startDate, endDate, timezone } = filters;

  if (startDate) {
    if (endDate) {
      if (timezone) {
        return `and created_at between toTimezone({startDate:DateTime64},{timezone:String}) and toTimezone({endDate:DateTime64},{timezone:String})`;
      }
      return `and created_at between {startDate:DateTime64} and {endDate:DateTime64}`;
    } else {
      if (timezone) {
        return `and created_at >= toTimezone({startDate:DateTime64},{timezone:String})`;
      }
      return `and created_at >= {startDate:DateTime64}`;
    }
  }

  return '';
}

function getMultiSearchSQL(columns: string[]) {
  if (columns.length === 0) return '';
  const searchParams = columns.map(col => `positionCaseInsensitive(${col}, {search:String}) > 0`);
  return `and (${searchParams.join(' or ')})`;
}

function getQueryParams(filters: Record<string, any>) {
  const params = {
    ...filters,
    ...filtersObjectToArray(filters).reduce((obj: any, { name, value }: any) => {
      obj[name] = value;
      return obj;
    }, {}),
  };

  const dateKeys = ['startDate', 'endDate', 'cohort_startDate', 'cohort_endDate'];
  for (const key of dateKeys) {
    if (params[key]) {
      try {
        const dateString = new Date(params[key]).toISOString();
        params[key] = dateString.replace('T', ' ').replace('Z', '');
      } catch (e) {
        // ignore invalid dates
      }
    }
  }

  return params;
}

function parseFilters(filters: Record<string, any>, options?: QueryOptions) {
  const cohortFilters = Object.fromEntries(
    Object.entries(filters).filter(([key]) => key.startsWith('cohort_')),
  );

  return {
    filterQuery: getFilterQuery(filters, options),
    dateQuery: getDateQuery(filters),
    queryParams: getQueryParams(filters),
    cohortQuery: getCohortQuery(cohortFilters),
  };
}

async function pagedRawQuery(
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
    .filter(n => n)
    .join('\n');

  const count = await rawQuery<any[]>(`select count(*) as num from (${query}) t`, queryParams).then(
    res => res[0].num,
  );

  const data = await rawQuery<any[]>(`${query}${statements}`, queryParams, name);

  return { data, count, page: +page, pageSize: size, orderBy, search };
}

async function rawQuery<T = unknown>(
  query: string,
  params: Record<string, unknown> = {},
  name?: string,
): Promise<T> {
  if (process.env.LOG_QUERY) {
    log({ query, params, name });
  }

  await connect();

  const resultSet = await clickhouse.query({
    query: query,
    query_params: params,
    format: 'JSONEachRow',
    clickhouse_settings: {
      date_time_output_format: 'iso',
      output_format_json_quote_64bit_integers: 0,
    },
  });

  return (await resultSet.json()) as T;
}

async function insert(table: string, values: any[]) {
  await connect();

  return clickhouse.insert({ table, values, format: 'JSONEachRow' }) as any;
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

async function connect() {
  if (process.env.CLICKHOUSE_URL && !clickhouse) {
    clickhouse = (globalThis as any)[CLICKHOUSE] || getClient();
  }

  return clickhouse;
}

export const clickhouseDriver: AnalyticsDriver = {
  get enabled() {
    return Boolean(process.env.CLICKHOUSE_URL);
  },
  getDateStringSQL,
  getDateSQL,
  getSearchSQL,
  getFilterQuery,
  getUTCString,
  parseFilters,
  pagedRawQuery,
  findUnique,
  findFirst,
  rawQuery,
  insert,
};

export default clickhouseDriver;

export {
  getUTCString as _getUTCString,
  getDateSQL as _getDateSQL,
  getDateStringSQL as _getDateStringSQL,
  getFilterQuery as _getFilterQuery,
  parseFilters as _parseFilters,
  getSearchSQL as _getSearchSQL,
  CLICKHOUSE_DATE_FORMATS as _CLICKHOUSE_DATE_FORMATS
};
