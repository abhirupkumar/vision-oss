import { sql } from 'drizzle-orm';
import { db } from '../../client';
import { FILTER_COLUMNS, OPERATORS } from '../analytics/constants';
import { filtersObjectToArray } from '../analytics/params';

export const DRIZZLE_DATE_FORMATS = {
  utc: 'YYYY-MM-DD"T"HH24:MI:SS"Z"',
  second: 'YYYY-MM-DD HH24:MI:SS',
  minute: 'YYYY-MM-DD HH24:MI:00',
  hour: 'YYYY-MM-DD HH24:00:00',
  day: 'YYYY-MM-DD',
  month: 'YYYY-MM-01',
  year: 'YYYY-01-01',
};

export function getDateStringSQL(
  data: any,
  unit: keyof typeof DRIZZLE_DATE_FORMATS = 'utc',
  timezone?: string,
) {
  if (timezone) {
    return `to_char(${data} AT TIME ZONE '${timezone}', '${DRIZZLE_DATE_FORMATS[unit]}')`;
  }
  return `to_char(${data}, '${DRIZZLE_DATE_FORMATS[unit]}')`;
}

export function getDateSQL(field: string, unit: string, timezone?: string) {
  if (timezone) {
    return `date_trunc('${unit}', ${field} AT TIME ZONE '${timezone}')`;
  }
  return `date_trunc('${unit}', ${field})`;
}

export function getTimestampDiffSQL(field1: string, field2: string, unit?: string) {
  return `EXTRACT(EPOCH FROM (${field1} - ${field2}))`;
}

export function getDayDiffQuery(field1: string, field2: string) {
  return `DATE_PART('day', ${field1} - ${field2})`;
}

export function getCastColumnQuery(column: string, type: string) {
  return `CAST(${column} AS ${type})`;
}

export function getAddIntervalQuery(field: string, interval: string) {
  return `${field} + interval '${interval}'`;
}

export function getDateWeeklySQL(field: string, timezone?: string) {
  // Extract DOW (0=Sun, 6=Sat), and pad hour to 2 chars.
  return `concat(extract(dow from ${field} at time zone '${timezone || 'UTC'}'), ':', to_char(${field} at time zone '${timezone || 'UTC'}', 'HH24'))`;
}

export function getSearchSQL(column: string, param: string = 'search') {
  return `and ${column} ilike concat('%', {{${param}}}, '%')`;
}

function mapFilter(column: string, operator: string | undefined, name: string) {
  switch (operator) {
    case OPERATORS.equals:
      return `${column} = {{${name}}}`;
    case OPERATORS.notEquals:
      return `${column} != {{${name}}}`;
    case OPERATORS.contains:
      return `${column} ilike concat('%', {{${name}}}, '%')`;
    case OPERATORS.doesNotContain:
      return `${column} not ilike concat('%', {{${name}}}, '%')`;
    default:
      return '';
  }
}

export function getFilterQuery(filters: Record<string, any>, options: any = {}) {
  const query = filtersObjectToArray(filters, options).reduce(
    (arr: string[], { name, column, operator }: any) => {
      const isCohort = options?.isCohort;

      if (isCohort) {
        column = FILTER_COLUMNS[String(name).slice('cohort_'.length) as keyof typeof FILTER_COLUMNS];
      }

      if (column) {
        let sqlCol = column;
        if (column === 'visitor_id' || name === 'visitorId') {
          sqlCol = 'project_event.visitor_id';
        } else if (column === 'session_id' || name === 'sessionId') {
          sqlCol = 'project_event.session_id';
        } else if (column === 'project_id' || name === 'projectId') {
          sqlCol = 'project_event.project_id';
        }

        if (name === 'eventType') {
          arr.push(`and ${mapFilter(sqlCol, operator as string, name as string)}::integer`);
        } else if (name === 'visitorId' || name === 'sessionId') {
          arr.push(`and ${mapFilter(sqlCol, operator as string, name as string)}::uuid`);
        } else {
          arr.push(`and ${mapFilter(sqlCol, operator as string, name as string)}`);
        }

        if (name === 'referrer') {
          arr.push(`and referrer_domain != hostname`);
        }
      }

      return arr;
    },
    [],
  );

  return query.join('\n');
}

export function getCohortQuery(filters: Record<string, any>) {
  if (!filters || Object.keys(filters).length === 0) {
    return '';
  }

  const filterQuery = getFilterQuery(filters, { isCohort: true });

  return `join (
      select distinct session_id
      from project_event
      where project_id = {{projectId::String}}
      and created_at between {{cohort_startDate}} and {{cohort_endDate}}
      ${filterQuery}
    ) as cohort
      on cohort.session_id = project_event.session_id
    `;
}

export function getDateQuery(filters: Record<string, any>) {
  const { startDate, endDate, timezone } = filters;

  if (startDate) {
    if (endDate) {
      if (timezone) {
        return `and created_at between {{startDate}} AT TIME ZONE {{timezone}} and {{endDate}} AT TIME ZONE {{timezone}}`;
      }
      return `and created_at between {{startDate}} and {{endDate}}`;
    } else {
      if (timezone) {
        return `and created_at >= {{startDate}} AT TIME ZONE {{timezone}}`;
      }
      return `and created_at >= {{startDate}}`;
    }
  }

  return '';
}

export function getQueryParams(filters: Record<string, any>) {
  return {
    ...filters,
    ...filtersObjectToArray(filters).reduce((obj: any, { name, value }) => {
      if (name && value !== undefined) {
        obj[name] = value;
      }

      return obj;
    }, {}),
  };
}

export function parseFilters(filters: Record<string, any> = {}, options: any = {}) {
  const cohortFilters = Object.fromEntries(
    Object.entries(filters).filter(([key]) => key.startsWith('cohort_')),
  );

  let joinVisitorQuery = '';
  const filterParams = filtersObjectToArray(filters, options);
  const needsVisitorJoin =
    Boolean(options?.joinSession || options?.joinVisitor) ||
    filterParams.some(
      (f: any) =>
        f.column &&
        (String(f.column).includes('visitor.') ||
          [
            'city',
            'country',
            'os',
            'browser',
            'device',
            'screen',
            'language',
            'region',
          ].includes(String(f.column))),
    );
  if (needsVisitorJoin) {
    joinVisitorQuery = 'join visitor on visitor.visitor_id = project_event.visitor_id';
  }

  return {
    filterQuery: getFilterQuery(filters, options),
    dateQuery: getDateQuery(filters),
    queryParams: getQueryParams(filters),
    cohortQuery: getCohortQuery(cohortFilters),
    joinVisitorQuery,
  };
}

export async function rawQuery<T = any>(
  query: string,
  params: Record<string, any> = {},
  _name?: string,
): Promise<T> {
  const strings: string[] = [];
  const args: any[] = [];
  let nextStringPrefix = '';

  const regex = /\{\{([a-zA-Z0-9_]+)(?:::([a-zA-Z0-9_]+))?\}\}/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(query)) !== null) {
    strings.push(nextStringPrefix + query.substring(lastIndex, match.index));
    const paramName = match[1];
    const castType = match[2];

    args.push(params[paramName]);

    if (castType) {
      nextStringPrefix = `::${castType.toLowerCase() === 'uuid' ? 'uuid' : castType.toLowerCase()}`;
    } else {
      nextStringPrefix = '';
    }

    lastIndex = match.index + match[0].length;
  }
  strings.push(nextStringPrefix + query.substring(lastIndex));

  const templateObj = Object.assign([...strings], {
    raw: [...strings],
  }) as unknown as TemplateStringsArray;

  const finalSql = sql(templateObj, ...args);
  try {
    const result = await db.execute(finalSql);
    return (result as any) as any;
  } catch (error: any) {
    console.error(`[DB Error in rawQuery${_name ? ` (${_name})` : ''}]:`, error?.message || error);
    throw error;
  }
}

export async function pagedRawQuery(
  query: string,
  queryParams: Record<string, any>,
  filters: any,
  name?: string,
) {
  const { page = 1, pageSize, orderBy, sortDescending = false, search } = filters;
  const size = +(pageSize || 10);
  const offset = size * (+page - 1);
  const direction = sortDescending ? 'desc' : 'asc';

  const statements = [
    orderBy && `order by ${orderBy} ${direction}`,
    size > 0 && `limit ${size} offset ${offset}`,
  ]
    .filter(n => n)
    .join('\n');

  const countQuery = `select count(*) as num from (${query}) t`;
  const countResult = (await rawQuery(countQuery, queryParams, name)) as any[];
  const count = countResult[0]?.num || 0;

  const data = await rawQuery(`${query}\n${statements}`, queryParams, name);

  return { data, count: Number(count), page: +page, pageSize: size, orderBy, search };
}

export async function pagedQuery(model: string, query: any, filters: any) {
  throw new Error('pagedQuery is deprecated, use standard pagination');
}

export function getSearchParameters(search: string, searchParams: any[]) {
  throw new Error('getSearchParameters is deprecated');
}

export const drizzleDriver = {
  getDateStringSQL,
  getDateSQL,
  getTimestampDiffSQL,
  getAddIntervalQuery,
  getDateWeeklySQL,
  getDayDiffQuery,
  getCastColumnQuery,
  getSearchSQL,
  getFilterQuery,
  getDateQuery,
  parseFilters,
  rawQuery,
  pagedRawQuery,
  pagedQuery,
  getSearchParameters,
};

export default drizzleDriver;
