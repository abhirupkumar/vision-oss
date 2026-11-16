import { subMinutes } from 'date-fns';
import clickhouse from '../../lib/analytics/clickhouse';
import {
  EVENT_COLUMNS,
  FILTER_COLUMNS,
  SESSION_COLUMNS,
  DEFAULT_RESET_DATE,
  EMAIL_DOMAINS,
  PAID_AD_PARAMS,
  SEARCH_DOMAINS,
  SHOPPING_DOMAINS,
  SOCIAL_DOMAINS,
  VIDEO_DOMAINS,
  GROUPED_DOMAINS,
  EVENT_TYPE
} from '../../lib/analytics/constants';
import { CLICKHOUSE, DRIZZLE, runQuery } from '../../lib/routing';
import drizzle from '../../lib/relational/drizzle';
import tinybird from '../../lib/analytics/tinybird';
import type { QueryFilters } from '@vision/shared-types';

// ==========================================
// helper functions
// ==========================================
function toClickHouseStringArray(arr: string[]): string {
  return arr.map(p => `'${p.replace(/'/g, "\\'")}'`).join(', ');
}

function toPostgresLikeClause(column: string, arr: string[]) {
  return arr.map(val => `${column} ilike '%${val.replace(/'/g, "''")}%'`).join(' OR\n  ');
}

function toPostgresPositionClause(column: string, arr: string[]) {
  return arr.map(val => `${column} ilike '%${val.replace(/'/g, "''")}%'`).join(' OR\n  ');
}

function toClickHouseGroupedReferrer(
  domains: any[],
  column: string = 'referrer_domain',
): string {
  return [
    'CASE',
    ...domains.map(group => {
      const matches = Array.isArray(group.match) ? group.match : [group.match];
      const formattedArray = matches.map(m => `'${m}'`).join(', ');
      return `  WHEN multiSearchAny(${column}, [${formattedArray}]) != 0 THEN '${group.domain}'`;
    }),
    "  ELSE 'Other'",
    'END',
  ].join('\n');
}

function toPostgresGroupedReferrer(
  domains: any[],
  column: string = 'referrer_domain',
): string {
  return [
    'CASE',
    ...domains.map(group => {
      const matches = Array.isArray(group.match) ? group.match : [group.match];
      return `WHEN ${toPostgresLikeClause(column, matches)} THEN '${group.domain}'`;
    }),
    "  ELSE 'Other'",
    'END',
  ].join('\n');
}

// ==========================================
// 1. getProjectStats
// ==========================================
export interface ProjectStatsData {
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
  revenue: number;
  visits_with_duration?: number;
}

export async function getProjectStats(
  ...args: [projectId: string, filters: QueryFilters]
): Promise<ProjectStatsData> {
  const [projectId, filters] = args;
  const cacheKey = `stats:${projectId}:${JSON.stringify(filters)}`;

  return runQuery(
    {
      [DRIZZLE]: () => relationalGetProjectStats(...args),
      [CLICKHOUSE]: () => clickhouseGetProjectStats(...args),
    },
    cacheKey,
  );
}

async function relationalGetProjectStats(
  projectId: string,
  filters: QueryFilters,
): Promise<ProjectStatsData> {
  const { getTimestampDiffSQL, parseFilters, rawQuery } = drizzle;
  const { filterQuery, joinVisitorQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
  });

  return rawQuery(
    `
    select
      cast(coalesce(sum(t.c), 0) as bigint) as "pageviews",
      count(distinct t.visitor_id) as "visitors",
      count(distinct t.session_id) as "visits",
      coalesce(sum(case when t.c = 1 then 1 else 0 end), 0) as "bounces",
      cast(coalesce(sum(${getTimestampDiffSQL('t.min_time', 't.max_time')}), 0) as bigint) as "totaltime",
      coalesce(sum(case when t.max_time > t.min_time then 1 else 0 end), 0) as "visits_with_duration",
      0 as "revenue"
    from (
      select
        project_event.visitor_id,
        project_event.session_id,
        count(*) as "c",
        min(project_event.created_at) as "min_time",
        max(project_event.created_at) as "max_time"
      from project_event
      ${cohortQuery}
      ${joinVisitorQuery}  
      where project_event.project_id = {{projectId::String}}
        and project_event.created_at between {{startDate}} and {{endDate}}
        and project_event.event_type != 2
        ${filterQuery}
      group by 1, 2
    ) as t
    `,
    queryParams,
    'getProjectStats',
  ).then(result => result?.[0]);
}

async function clickhouseGetProjectStats(
  projectId: string,
  filters: QueryFilters,
): Promise<ProjectStatsData> {
  const { rawQuery, parseFilters } = tinybird.enabled ? tinybird : clickhouse;
  const { filterQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
  });

  let sql = '';

  if (EVENT_COLUMNS.some(item => Object.keys(filters).includes(item))) {
    sql = `
    select
      sum(t.c) as "pageviews",
      uniq(t.visitor_id) as "visitors",
      uniq(t.session_id) as "visits",
      sum(if(t.c = 1, 1, 0)) as "bounces",
      sum(max_time-min_time) as "totaltime",
      sum(if(max_time > min_time, 1, 0)) as "visits_with_duration",
      0 as "revenue"
    from (
      select
        visitor_id,
        session_id,
        count(*) c,
        min(created_at) min_time,
        max(created_at) max_time
      from project_event
      ${cohortQuery}
      where project_id = {projectId:String}
        and created_at between {startDate:DateTime64} and {endDate:DateTime64}
        and event_type != 2
        ${filterQuery}
      group by visitor_id, session_id
    ) as t;
    `;
  } else {
    sql = `
    select
      sum(t.views) as "pageviews",
      uniq(t.visitor_id) as "visitors",
      uniq(t.session_id) as "visits",
      sumIf(1, t.views = 1) as "bounces",
      sum(t.end_time-t.start_time) as "totaltime",
      sumIf(1, t.end_time > t.start_time) as "visits_with_duration",
      sum(t.revenue) as "revenue"
    from (select
            argMaxMerge(visitor_id) as visitor_id,
            session_id,
            sumMerge(views) as views,
            minMerge(start_time) as start_time,
            maxMerge(end_time) as end_time,
            sumMerge(revenue) as revenue
        from project_session_stats
        ${cohortQuery}
    where project_id = {projectId:String}
      and session_date between toDate({startDate:DateTime64}) and toDate({endDate:DateTime64})
      ${filterQuery}
      group by session_id
      HAVING start_time between {startDate:DateTime64} and {endDate:DateTime64}
    ) as t;
    `;
  }

  return rawQuery(sql, queryParams, 'getProjectStats').then(result => result?.[0]);
}

// ==========================================
// 2. getActiveVisitors
// ==========================================
export async function getActiveVisitors(...args: [projectId: string]) {
  return runQuery({
    [DRIZZLE]: () => relationalGetActiveVisitors(...args),
    [CLICKHOUSE]: () => clickhouseGetActiveVisitors(...args),
  });
}

async function relationalGetActiveVisitors(projectId: string) {
  const { rawQuery } = drizzle;
  const startDate = subMinutes(new Date(), 5);

  const result = await rawQuery(
    `
    select count(distinct visitor_id) as "visitors"
    from project_event
    where project_id = {{projectId::String}}
    and created_at >= {{startDate}}
    `,
    { projectId, startDate },
    'getActiveVisitors',
  );

  return result?.[0] ?? null;
}

async function clickhouseGetActiveVisitors(projectId: string): Promise<{ x: number }> {
  const { rawQuery } = tinybird.enabled ? tinybird : clickhouse;
  const startDate = subMinutes(new Date(), 5);

  const result = await rawQuery(
    `
    select
      count(distinct visitor_id) as "visitors"
    from project_event
    where project_id = {projectId:String}
      and created_at >= {startDate:DateTime64}
    `,
    { projectId, startDate },
    'getActiveVisitors',
  );

  return result[0] ?? null;
}

// ==========================================
// 3. getWeeklyTraffic
// ==========================================
export async function getWeeklyTraffic(...args: [projectId: string, filters: QueryFilters]) {
  return runQuery({
    [DRIZZLE]: () => relationalGetWeeklyTraffic(...args),
    [CLICKHOUSE]: () => clickhouseGetWeeklyTraffic(...args),
  });
}

async function relationalGetWeeklyTraffic(projectId: string, filters: QueryFilters) {
  const timezone = 'utc';
  const { rawQuery, getDateWeeklySQL, parseFilters } = drizzle;
  const { filterQuery, joinVisitorQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
  });

  return rawQuery(
    `
    select
      ${getDateWeeklySQL('project_event.created_at', timezone)} as time,
      count(distinct project_event.visitor_id) as value
    from project_event
    ${cohortQuery}
    ${joinVisitorQuery}
    where project_event.project_id = {{projectId::String}}
      and project_event.created_at between {{startDate}} and {{endDate}}
      ${filterQuery}
    group by time
    order by 2
    `,
    queryParams,
    'getWeeklyTraffic',
  ).then(formatWeeklyResults);
}

async function clickhouseGetWeeklyTraffic(projectId: string, filters: QueryFilters) {
  const { timezone = 'utc' } = filters;
  const { rawQuery, parseFilters } = tinybird.enabled ? tinybird : clickhouse;
  const { filterQuery, cohortQuery, queryParams } = await parseFilters({ ...filters, projectId });

  let sql = '';

  if (EVENT_COLUMNS.some(item => Object.keys(filters).includes(item))) {
    sql = `
    select
      formatDateTime(toDateTime(created_at, '${timezone}'), '%w:%H') as time,
      count(distinct visitor_id) as value
    from project_event
    ${cohortQuery}
    where project_id = {projectId:String}
      and created_at between {startDate:DateTime64} and {endDate:DateTime64}
      ${filterQuery}
    group by time
    order by time
    `;
  } else {
    sql = `
    select
      formatDateTime(toDateTime(created_at, '${timezone}'), '%w:%H') as time,
      count(distinct visitor_id) as value
    from project_event_stats_hourly project_event
    ${cohortQuery}
    where project_id = {projectId:String}
      and created_at between {startDate:DateTime64} and {endDate:DateTime64}
      ${filterQuery}
    group by time
    order by time
    `;
  }

  return rawQuery(sql, queryParams, 'getWeeklyTraffic').then(formatWeeklyResults);
}

function formatWeeklyResults(data: any) {
  const days = [];

  for (let i = 0; i < 7; i++) {
    days.push([]);

    for (let j = 0; j < 24; j++) {
      days[i].push(
        Number(
          data.find(({ time }) => time === `${i}:${j.toString().padStart(2, '0')}`)?.value || 0,
        ),
      );
    }
  }

  return days;
}

// ==========================================
// 4. getProjectDateRange
// ==========================================
export async function getProjectDateRange(...args: [projectId: string]) {
  return runQuery({
    [DRIZZLE]: () => relationalGetProjectDateRange(...args),
    [CLICKHOUSE]: () => clickhouseGetProjectDateRange(...args),
  });
}

async function relationalGetProjectDateRange(projectId: string) {
  const { rawQuery, parseFilters } = drizzle;
  const { queryParams } = parseFilters({
    startDate: new Date(DEFAULT_RESET_DATE),
    projectId,
  });

  const result = await rawQuery(
    `
    select
      min(created_at) as "startDate",
      max(created_at) as "endDate"
    from project_event
    where project_id = {{projectId::String}}
      and created_at >= {{startDate}}
    `,
    queryParams,
  );

  return result[0] ?? null;
}

async function clickhouseGetProjectDateRange(projectId: string) {
  const { rawQuery, parseFilters } = tinybird.enabled ? tinybird : clickhouse;
  const { queryParams } = parseFilters({
    startDate: new Date(DEFAULT_RESET_DATE),
    projectId,
  });

  const result = await rawQuery(
    `
    select
      min(created_at) as startDate,
      max(created_at) as endDate
    from project_event_stats_hourly
    where project_id = {projectId:String}
      and created_at >= {startDate:DateTime64}
    `,
    queryParams,
  );

  return result[0] ?? null;
}

// ==========================================
// 5. getValues
// ==========================================
export async function getValues(
  ...args: [projectId: string, column: string, filters: QueryFilters]
) {
  return runQuery({
    [DRIZZLE]: () => relationalGetValues(...args),
    [CLICKHOUSE]: () => clickhouseGetValues(...args),
  });
}

async function relationalGetValues(projectId: string, column: string, filters: QueryFilters) {
  const { rawQuery, getSearchSQL } = drizzle;
  const params: Record<string, string> = {};
  const { startDate, endDate, search } = filters;

  let searchQuery = '';
  let excludeDomain = '';

  if (column === 'referrer_domain') {
    excludeDomain = `and project_event.referrer_domain != project_event.hostname
      and project_event.referrer_domain != ''`;
  }

  if (search) {
    if (decodeURIComponent(search).includes(',')) {
      searchQuery = `AND (${decodeURIComponent(search)
        .split(',')
        .slice(0, 5)
        .map((value: string, index: number) => {
          const key = `search${index}`;
          params[key] = value;
          return getSearchSQL(column, key).replace('and ', '');
        })
        .join(' OR ')})`;
    } else {
      searchQuery = getSearchSQL(column);
    }
  }

  return rawQuery(
    `
    select ${column} as "value", count(*) as "count"
    from project_event
    inner join visitor
      on visitor.visitor_id = project_event.visitor_id
        and visitor.project_id = project_event.project_id
    where project_event.project_id = {{projectId::String}}
      and project_event.created_at between {{startDate}} and {{endDate}}
      ${searchQuery}
      ${excludeDomain}
    group by 1
    order by 2 desc
    limit 10
    `,
    {
      projectId,
      startDate,
      endDate,
      search: `%${search}%`,
      ...params,
    },
    'getValues',
  );
}

async function clickhouseGetValues(projectId: string, column: string, filters: QueryFilters) {
  const { rawQuery, getSearchSQL } = tinybird.enabled ? tinybird : clickhouse;
  const params: Record<string, string> = {};
  const { startDate, endDate, search } = filters;

  let searchQuery = '';
  let excludeDomain = '';

  if (column === 'referrer_domain') {
    excludeDomain = `and referrer_domain != hostname and referrer_domain != ''`;
  }

  if (search) {
    if (decodeURIComponent(search).includes(',')) {
      searchQuery = `AND (${decodeURIComponent(search)
        .split(',')
        .slice(0, 5)
        .map((value: string, index: number) => {
          const key = `search${index}`;
          params[key] = value;
          return getSearchSQL(column, key).replace('and ', '');
        })
        .join(' OR ')})`;
    } else {
      searchQuery = getSearchSQL(column);
    }
  }

  return rawQuery(
    `
    select ${column} as "value", count(*) as "count"
    from project_event
    where project_id = {projectId:String}
      and created_at between {startDate:DateTime64} and {endDate:DateTime64}
      ${searchQuery}
      ${excludeDomain}
    group by 1
    order by 2 desc
    limit 10
    `,
    {
      projectId,
      startDate,
      endDate,
      search,
      ...params,
    },
    'getValues',
  );
}

// ==========================================
// 6. getChannelMetrics
// ==========================================
export async function getChannelMetrics(...args: [projectId: string, filters?: QueryFilters]) {
  return runQuery({
    [DRIZZLE]: () => relationalGetChannelMetrics(...args),
    [CLICKHOUSE]: () => clickhouseGetChannelMetrics(...args),
  });
}

async function relationalGetChannelMetrics(projectId: string, filters: QueryFilters) {
  const { rawQuery, parseFilters } = drizzle;
  const { queryParams, filterQuery, joinVisitorQuery, cohortQuery, dateQuery } = parseFilters({
    ...filters,
    projectId,
  });

  return rawQuery(
    `
    WITH prefix AS (
      select case when project_event.utm_medium LIKE 'p%' OR
          project_event.utm_medium LIKE '%ppc%' OR
          project_event.utm_medium LIKE '%retargeting%' OR
          project_event.utm_medium LIKE '%paid%' then 'paid' else 'organic' end prefix,
          project_event.referrer_domain,
          project_event.url_query,
          project_event.utm_medium,
          project_event.utm_source,
          project_event.session_id
      from project_event
      ${cohortQuery}
      ${joinVisitorQuery}
      where project_event.project_id = {{projectId::String}}
        and project_event.event_type != 2
        ${dateQuery}
        ${filterQuery}),
 
    channels as (
      select case
          when referrer_domain = '' and url_query = '' then 'direct'
          when ${toPostgresLikeClause('url_query', PAID_AD_PARAMS)} then 'paidAds'
          when ${toPostgresLikeClause('utm_medium', ['referral', 'app', 'link'])} then 'referral'
          when utm_medium ilike '%affiliate%' then 'affiliate'
          when utm_medium ilike '%sms%' or utm_source ilike '%sms%' then 'sms'
          when ${toPostgresLikeClause('referrer_domain', SEARCH_DOMAINS)} or utm_medium ilike '%organic%' then concat(prefix, 'Search')
          when ${toPostgresLikeClause('referrer_domain', SOCIAL_DOMAINS)} then concat(prefix, 'Social')
          when ${toPostgresLikeClause('referrer_domain', EMAIL_DOMAINS)} or utm_medium ilike '%mail%' then 'email'
          when ${toPostgresLikeClause('referrer_domain', SHOPPING_DOMAINS)} or utm_medium ilike '%shop%' then concat(prefix, 'Shopping')
          when ${toPostgresLikeClause('referrer_domain', VIDEO_DOMAINS)} or utm_medium ilike '%video%' then concat(prefix, 'Video')
          else '' end AS x,
        count(distinct session_id) y
      from prefix
      group by 1
      order by y desc)
 
    select x, sum(y) y
    from channels
    where x != ''
    group by x
    order by y desc;
    `,
    queryParams,
    'getChannelMetrics',
  ).then(results => results.map((item: any) => ({ ...item, y: Number(item.y) })));
}

async function clickhouseGetChannelMetrics(
  projectId: string,
  filters: QueryFilters,
): Promise<{ x: string; y: number }[]> {
  const { rawQuery, parseFilters } = tinybird.enabled ? tinybird : clickhouse;
  const { queryParams, filterQuery, cohortQuery, dateQuery } = parseFilters({
    ...filters,
    projectId,
  });

  const hasFilters =
    Object.keys(filters).filter(k => k !== 'startDate' && k !== 'endDate').length > 0;

  let sql = '';

  if (hasFilters) {
    sql = `
      WITH channels as (
        select case when multiSearchAny(utm_medium, ['cp', 'ppc', 'retargeting', 'paid']) != 0 then 'paid' else 'organic' end prefix,
            case
            when referrer_domain = '' and url_query = '' then 'direct'
            when multiSearchAny(url_query, [${toClickHouseStringArray(PAID_AD_PARAMS)}]) != 0 then 'paidAds'
            when multiSearchAny(utm_medium, ['referral', 'app','link']) != 0 then 'referral'
            when position(utm_medium, 'affiliate') > 0 then 'affiliate'
            when position(utm_medium, 'sms') > 0 or position(utm_source, 'sms') > 0 then 'sms'
            when multiSearchAny(referrer_domain, [${toClickHouseStringArray(SEARCH_DOMAINS)}]) != 0 or position(utm_medium, 'organic') > 0 then concat(prefix, 'Search')
            when multiSearchAny(referrer_domain, [${toClickHouseStringArray(SOCIAL_DOMAINS)}]) != 0 then concat(prefix, 'Social')
            when multiSearchAny(referrer_domain, [${toClickHouseStringArray(EMAIL_DOMAINS)}]) != 0 or position(utm_medium, 'mail') > 0 then 'email'
            when multiSearchAny(referrer_domain, [${toClickHouseStringArray(SHOPPING_DOMAINS)}]) != 0 or position(utm_medium, 'shop') > 0 then concat(prefix, 'Shopping')
            when multiSearchAny(referrer_domain, [${toClickHouseStringArray(VIDEO_DOMAINS)}]) != 0 or position(utm_medium, 'video') > 0 then concat(prefix, 'Video')
            else '' end AS x,
          count(distinct session_id) y
        from project_event
        ${cohortQuery}
        where project_id = {projectId:String}
          and event_type != 2
          ${dateQuery}
          ${filterQuery}
        group by 1, 2
        order by y desc)
 
      select x, sum(y) y
      from channels
      where x != ''
      group by x
      order by y desc;
    `;
  } else {
    sql = `
      select channel as x, uniqMerge(sessions) y
      from project_channel_stats_hourly
      ${cohortQuery}
      where project_id = {projectId:String}
        ${dateQuery}
      group by x
      order by y desc;
    `;
  }

  return rawQuery(sql, queryParams, 'getChannelMetrics');
}

// ==========================================
// 7. getChannelExpandedMetrics
// ==========================================
export interface ChannelExpandedMetricsData {
  name: string;
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
}

export async function getChannelExpandedMetrics(
  ...args: [projectId: string, filters?: QueryFilters]
): Promise<ChannelExpandedMetricsData[]> {
  return runQuery({
    [DRIZZLE]: () => relationalGetChannelExpandedMetrics(...args),
    [CLICKHOUSE]: () => clickhouseGetChannelExpandedMetrics(...args),
  });
}

async function relationalGetChannelExpandedMetrics(
  projectId: string,
  filters: QueryFilters,
): Promise<ChannelExpandedMetricsData[]> {
  const { rawQuery, parseFilters, getTimestampDiffSQL } = drizzle;
  const { queryParams, filterQuery, joinVisitorQuery, cohortQuery, dateQuery } = parseFilters({
    ...filters,
    projectId,
  });

  return rawQuery(
    `
      WITH prefix AS (
        select case when project_event.utm_medium LIKE 'p%' OR
            project_event.utm_medium LIKE '%ppc%' OR
            project_event.utm_medium LIKE '%retargeting%' OR
            project_event.utm_medium LIKE '%paid%' then 'paid' else 'organic' end prefix,
            project_event.referrer_domain,
            project_event.url_query,
            project_event.utm_medium,
            project_event.utm_source,
            project_event.visitor_id,
            project_event.session_id,
            count(*) c,
            min(project_event.created_at) min_time,
            max(project_event.created_at) as "max_time"
        from project_event
        ${cohortQuery}
        ${joinVisitorQuery}
        where project_event.project_id = {{projectId::String}}
          and project_event.event_type != 2
          ${dateQuery}
          ${filterQuery}
        group by prefix, 
            project_event.referrer_domain,
            project_event.url_query,
            project_event.utm_medium,
            project_event.utm_source,
            project_event.visitor_id,
            project_event.session_id),
   
      channels as (
        select case
            when referrer_domain = '' and url_query = '' then 'direct'
            when ${toPostgresPositionClause('url_query', PAID_AD_PARAMS)} then 'paidAds'
            when ${toPostgresPositionClause('utm_medium', ['referral', 'app', 'link'])} then 'referral'
            when utm_medium ilike '%affiliate%' then 'affiliate'
            when utm_medium ilike '%sms%' or utm_source ilike '%sms%' then 'sms'
            when ${toPostgresPositionClause('referrer_domain', SEARCH_DOMAINS)} or utm_medium ilike '%organic%' then concat(prefix, 'Search')
            when ${toPostgresPositionClause('referrer_domain', SOCIAL_DOMAINS)} then concat(prefix, 'Social')
            when ${toPostgresPositionClause('referrer_domain', EMAIL_DOMAINS)} or utm_medium ilike '%mail%' then 'email'
            when ${toPostgresPositionClause('referrer_domain', SHOPPING_DOMAINS)} or utm_medium ilike '%shop%' then concat(prefix, 'Shopping')
            when ${toPostgresPositionClause('referrer_domain', VIDEO_DOMAINS)} or utm_medium ilike '%video%' then concat(prefix, 'Video')
            else '' end AS name,
            visitor_id,
            session_id,
            c,
            min_time,
            max_time
        from prefix)
   
      select
        name,
        sum(c) as "pageviews",
        count(distinct visitor_id) as "visitors",
        count(distinct session_id) as "visits",
        sum(case when c = 1 then 1 else 0 end) as "bounces",
        sum(${getTimestampDiffSQL('min_time', 'max_time')}) as "totaltime"
      from channels
      where name != ''
      group by name 
      order by visitors desc, visits desc
      `,
    queryParams,
    'getChannelExpandedMetrics',
  ).then(results => results.map((item: any) => ({ ...item, y: Number(item.y) })));
}

async function clickhouseGetChannelExpandedMetrics(
  projectId: string,
  filters: QueryFilters,
): Promise<ChannelExpandedMetricsData[]> {
  const { rawQuery, parseFilters } = tinybird.enabled ? tinybird : clickhouse;
  const { queryParams, filterQuery, cohortQuery } = parseFilters({
    ...filters,
    projectId,
  });

  return rawQuery(
    `
    select
      name,
      sum(t.c) as "pageviews",
      uniq(t.visitor_id) as "visitors",
      uniq(t.session_id) as "visits",
      sum(if(t.c = 1, 1, 0)) as "bounces",
      sum(max_time-min_time) as "totaltime"
    from (
      select case when multiSearchAny(utm_medium, ['cp', 'ppc', 'retargeting', 'paid']) != 0 then 'paid' else 'organic' end prefix,
          case
          when referrer_domain = '' and url_query = '' then 'direct'
          when multiSearchAny(url_query, [${toClickHouseStringArray(
      PAID_AD_PARAMS,
    )}]) != 0 then 'paidAds'
          when multiSearchAny(utm_medium, ['referral', 'app','link']) != 0 then 'referral'
          when position(utm_medium, 'affiliate') > 0 then 'affiliate'
          when position(utm_medium, 'sms') > 0 or position(utm_source, 'sms') > 0 then 'sms'
          when multiSearchAny(referrer_domain, [${toClickHouseStringArray(
      SEARCH_DOMAINS,
    )}]) != 0 or position(utm_medium, 'organic') > 0 then concat(prefix, 'Search')
          when multiSearchAny(referrer_domain, [${toClickHouseStringArray(
      SOCIAL_DOMAINS,
    )}]) != 0 then concat(prefix, 'Social')
          when multiSearchAny(referrer_domain, [${toClickHouseStringArray(
      EMAIL_DOMAINS,
    )}]) != 0 or position(utm_medium, 'mail') > 0 then 'email'
          when multiSearchAny(referrer_domain, [${toClickHouseStringArray(
      SHOPPING_DOMAINS,
    )}]) != 0 or position(utm_medium, 'shop') > 0 then concat(prefix, 'Shopping')
          when multiSearchAny(referrer_domain, [${toClickHouseStringArray(
      VIDEO_DOMAINS,
    )}]) != 0 or position(utm_medium, 'video') > 0 then concat(prefix, 'Video')
          else '' end AS name,
        visitor_id,
        session_id,
        count(*) c,
        min(created_at) min_time,
        max(created_at) max_time
      from project_event
      ${cohortQuery}
      where project_id = {projectId:String}
        and created_at between {startDate:DateTime64} and {endDate:DateTime64}
        and event_type != 2
        and name != ''
        ${filterQuery}
      group by prefix, name, visitor_id, session_id
    ) as t
    group by name 
    order by visitors desc, visits desc;
    `,
    queryParams,
    'getChannelExpandedMetrics',
  );
}

// ==========================================
// 8. getPageviewStats
// ==========================================
export async function getPageviewStats(...args: [projectId: string, filters: QueryFilters]) {
  const [projectId, filters] = args;
  const cacheKey = `pageviews:${projectId}:${JSON.stringify(filters)}`;

  return runQuery(
    {
      [DRIZZLE]: () => relationalGetPageviewStats(...args),
      [CLICKHOUSE]: () => clickhouseGetPageviewStats(...args),
    },
    cacheKey,
  );
}

async function relationalGetPageviewStats(projectId: string, filters: QueryFilters) {
  const { timezone = 'utc', unit = 'day' } = filters;
  const { getDateSQL, parseFilters, rawQuery } = drizzle;
  const { filterQuery, cohortQuery, joinVisitorQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
  });

  return rawQuery(
    `
    select
      ${getDateSQL('project_event.created_at', unit, timezone)} x,
      count(*) y
    from project_event
    ${cohortQuery}
    ${joinVisitorQuery}  
    where project_event.project_id = {{projectId::String}}
      and project_event.created_at between {{startDate}} and {{endDate}}
      and project_event.event_type != 2
      ${filterQuery}
    group by 1
    order by 1
    `,
    queryParams,
    'getPageviewStats',
  );
}

async function clickhouseGetPageviewStats(
  projectId: string,
  filters: QueryFilters,
): Promise<{ x: string; y: number }[]> {
  const { timezone = 'UTC', unit = 'day' } = filters;
  const { parseFilters, rawQuery, getDateSQL } = tinybird.enabled ? tinybird : clickhouse;
  const { filterQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
  });

  let sql = '';

  if (EVENT_COLUMNS.some(item => Object.keys(filters).includes(item)) || unit === 'minute') {
    sql = `
    select
      g.t as x,
      g.y as y
    from (
      select
        ${getDateSQL('min_time', unit, timezone)} as t,
        sum(views) as y
      from (
        select
          session_id,
          min(created_at) as min_time,
          count(*) as views
        from project_event
        ${cohortQuery}
        where project_id = {projectId:String}
          and created_at between {startDate:DateTime64} and {endDate:DateTime64}
          and event_type != 2
          ${filterQuery}
        group by session_id
      )
      group by t
    ) as g
    order by t
    `;
  } else {
    sql = `
    select
      g.t as x,
      g.y as y
    from (
      select
        ${getDateSQL('start_time', unit, timezone)} as t,
        sum(views) as y
      from (
        select
          session_id,
          minMerge(start_time) as start_time,
          sumMerge(views) as views
        from project_session_stats
        ${cohortQuery}
        where project_id = {projectId:String}
          and session_date between toDate({startDate:DateTime64}) and toDate({endDate:DateTime64})
          ${filterQuery}
        group by session_id
        HAVING start_time between {startDate:DateTime64} and {endDate:DateTime64}
      )
      group by t
    ) as g
    order by t
    `;
  }

  return rawQuery(sql, queryParams, 'getPageviewStats');
}

// ==========================================
// 9. getPageviewMetrics
// ==========================================
export interface PageviewMetricsParameters {
  type: string;
  limit?: number | string;
  offset?: number | string;
}

export interface PageviewMetricsData {
  x: string;
  y: number;
}

export async function getPageviewMetrics(
  ...args: [projectId: string, parameters: PageviewMetricsParameters, filters: QueryFilters]
) {
  return runQuery({
    [DRIZZLE]: () => relationalGetPageviewMetrics(...args),
    [CLICKHOUSE]: () => clickhouseGetPageviewMetrics(...args),
  });
}

async function relationalGetPageviewMetrics(
  projectId: string,
  parameters: PageviewMetricsParameters,
  filters: QueryFilters,
): Promise<PageviewMetricsData[]> {
  const { type, limit = 500, offset = 0 } = parameters;
  let column = FILTER_COLUMNS[type as keyof typeof FILTER_COLUMNS] || type;
  const { rawQuery, parseFilters } = drizzle;
  const { filterQuery, joinVisitorQuery, cohortQuery, queryParams } = parseFilters(
    {
      ...filters,
      projectId,
    },
    { joinSession: SESSION_COLUMNS.includes(type) },
  );

  let entryExitQuery = '';
  let excludeDomain = '';

  if (column === 'referrer_domain') {
    excludeDomain = `and project_event.referrer_domain != project_event.hostname
      and project_event.referrer_domain != ''`;
  }

  if (type === 'entry' || type === 'exit') {
    const order = type === 'entry' ? 'asc' : 'desc';
    column = `x.${column}`;

    entryExitQuery = `
      join (
        select distinct on (session_id)
          session_id,
          url_path
        from project_event
        where project_event.project_id = {{projectId::String}}
          and project_event.created_at between {{startDate}} and {{endDate}}
          and project_event.event_type != 2
        order by session_id, created_at ${order}
      ) x
      on x.session_id = project_event.session_id
    `;
  }

  return rawQuery(
    `
    select ${column} x,
      count(distinct project_event.visitor_id) as y
    from project_event
    ${cohortQuery}
    ${joinVisitorQuery}
    ${entryExitQuery}
    where project_event.project_id = {{projectId::String}}
      and project_event.created_at between {{startDate}} and {{endDate}}
      and project_event.event_type != 2
      ${excludeDomain}
      ${filterQuery}
    group by 1
    order by 2 desc
    limit ${limit}
    offset ${offset}
    `,
    { ...queryParams, ...parameters },
    'getPageviewMetrics',
  );
}

async function clickhouseGetPageviewMetrics(
  projectId: string,
  parameters: PageviewMetricsParameters,
  filters: QueryFilters,
): Promise<{ x: string; y: number }[]> {
  const { type, limit = 500, offset = 0 } = parameters;
  let column = FILTER_COLUMNS[type as keyof typeof FILTER_COLUMNS] || type;
  const { rawQuery, parseFilters } = tinybird.enabled ? tinybird : clickhouse;
  const { filterQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
  });

  let sql = '';
  let excludeDomain = '';

  if (EVENT_COLUMNS.some(item => Object.keys(filters).includes(item))) {
    let entryExitQuery = '';

    if (column === 'referrer_domain') {
      excludeDomain = `and referrer_domain != hostname and referrer_domain != ''`;
    }

    if (type === 'entry' || type === 'exit') {
      const aggregrate = type === 'entry' ? 'argMin' : 'argMax';
      column = `x.${column}`;

      entryExitQuery = `
      JOIN (select session_id,
          ${aggregrate}(url_path, created_at) url_path
      from project_event
    where project_id = {projectId:String}
        and created_at between {startDate:DateTime64} and {endDate:DateTime64}
        and event_type != 2
      group by session_id) x
      ON x.session_id = project_event.session_id`;
    }

    sql = `
    select ${column} x, 
      uniq(project_event.visitor_id) as y
    from project_event
    ${cohortQuery}
    ${entryExitQuery}
    where project_id = {projectId:String}
      and created_at between {startDate:DateTime64} and {endDate:DateTime64}
      and event_type != 2
      ${excludeDomain}
      ${filterQuery}
    group by x
    order by y desc
    limit ${limit}
    offset ${offset}
    `;
  } else {
    const RAW_COLUMNS = new Set([
      'url_path',
      'referrer_domain',
      'referrer_path',
      'referrer_query',
      'url_query',
      'page_title',
      'hostname',
    ]);

    let entryExitQuery = '';

    if (column === 'referrer_domain') {
      excludeDomain = `and referrer_domain != hostname and referrer_domain != ''`;
    }

    if (type === 'entry' || type === 'exit') {
      const aggregrate = type === 'entry' ? 'argMin' : 'argMax';
      column = `x.${column}`;

      entryExitQuery = `
      JOIN (select session_id,
          ${aggregrate}(url_path, created_at) url_path
      from project_event
    where project_id = {projectId:String}
        and created_at between {startDate:DateTime64} and {endDate:DateTime64}
        and event_type != 2
      group by session_id) x
      ON x.session_id = project_event.session_id`;
    }

    const hasFilters =
      Object.keys(filters).filter(k => k !== 'startDate' && k !== 'endDate').length > 0;
    const isEntryOrExit = type === 'entry' || type === 'exit';

    let fromTable = RAW_COLUMNS.has(FILTER_COLUMNS[type as keyof typeof FILTER_COLUMNS] || type)
      ? 'project_event'
      : 'project_event_stats_hourly as project_event';
    let aggregate = 'uniq(visitor_id)';

    if (!hasFilters && !isEntryOrExit) {
      if (type === 'path' || type === 'url_path') {
        fromTable = 'project_pageview_stats_hourly';
        aggregate = 'uniqMerge(visitors)';
      } else if (type === 'referrer' || type === 'referrer_domain') {
        fromTable = 'project_referrer_stats_hourly';
        aggregate = 'uniqMerge(visitors)';
        excludeDomain = '';
      }
    }

    sql = `
    select ${column} as x,
      ${aggregate} as y
    from ${fromTable}
    ${cohortQuery}
    ${entryExitQuery}
    where project_id = {projectId:String}
        and created_at between {startDate:DateTime64} and {endDate:DateTime64}
        ${fromTable === 'project_event' || fromTable.includes('project_event_stats_hourly') ? 'and event_type != 2' : ''}
        ${excludeDomain}
        ${filterQuery}
    group by x
    order by y desc
    limit ${limit}
    offset ${offset}
    `;
  }

  return rawQuery(sql, { ...queryParams, ...parameters }, 'getPageviewMetrics');
}

// ==========================================
// 10. getPageviewExpandedMetrics
// ==========================================
export interface PageviewExpandedMetricsParameters {
  type: string;
  limit?: number | string;
  offset?: number | string;
}

export interface PageviewExpandedMetricsData {
  name: string;
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
}

export async function getPageviewExpandedMetrics(
  ...args: [projectId: string, parameters: PageviewExpandedMetricsParameters, filters: QueryFilters]
) {
  return runQuery({
    [DRIZZLE]: () => relationalGetPageviewExpandedMetrics(...args),
    [CLICKHOUSE]: () => clickhouseGetPageviewExpandedMetrics(...args),
  });
}

async function relationalGetPageviewExpandedMetrics(
  projectId: string,
  parameters: PageviewExpandedMetricsParameters,
  filters: QueryFilters,
): Promise<PageviewExpandedMetricsData[]> {
  const { type, limit = 500, offset = 0 } = parameters;
  let column = FILTER_COLUMNS[type as keyof typeof FILTER_COLUMNS] || type;
  const { rawQuery, parseFilters, getTimestampDiffSQL } = drizzle;
  const { filterQuery, joinVisitorQuery, cohortQuery, queryParams } = parseFilters(
    {
      ...filters,
      projectId,
    },
    { joinSession: SESSION_COLUMNS.includes(type) },
  );

  let entryExitQuery = '';
  let excludeDomain = '';

  if (column === 'referrer_domain') {
    excludeDomain = `and project_event.referrer_domain != project_event.hostname
      and project_event.referrer_domain != ''`;
    if (type === 'domain') {
      column = toPostgresGroupedReferrer(GROUPED_DOMAINS);
    }
  }

  if (type === 'entry' || type === 'exit') {
    const aggregrate = type === 'entry' ? 'min' : 'max';

    entryExitQuery = `
      join (
        select session_id,
            ${aggregrate}(created_at) target_created_at
        from project_event
        where project_event.project_id = {{projectId::String}}
          and project_event.created_at between {{startDate}} and {{endDate}}
          and project_event.event_type != 2
        group by session_id
      ) x
      on x.session_id = project_event.session_id
          and x.target_created_at = project_event.created_at
    `;
  }

  return rawQuery(
    `
    select
      name,
      sum(t.c) as "pageviews",
      count(distinct t.visitor_id) as "visitors",
      count(distinct t.session_id) as "visits",
      sum(case when t.c = 1 then 1 else 0 end) as "bounces",
      sum(${getTimestampDiffSQL('t.min_time', 't.max_time')}) as "totaltime"
    from (
      select
        ${column} as name,
        project_event.visitor_id,
        project_event.session_id,
        count(*) as "c",
        min(project_event.created_at) as "min_time",
        max(project_event.created_at) as "max_time"
      from project_event
      ${cohortQuery}
      ${joinVisitorQuery} 
      ${entryExitQuery} 
      where project_event.project_id = {{projectId::String}}
      and project_event.created_at between {{startDate}} and {{endDate}}
      and project_event.event_type != 2
        ${excludeDomain}
        ${filterQuery}
      group by ${column}, project_event.visitor_id, project_event.session_id
    ) as t
    where name != ''
    group by name 
    order by visitors desc, visits desc
    limit ${limit}
    offset ${offset}
    `,
    queryParams,
    'getPageviewExpandedMetrics',
  );
}

async function clickhouseGetPageviewExpandedMetrics(
  projectId: string,
  parameters: PageviewExpandedMetricsParameters,
  filters: QueryFilters,
): Promise<{ x: string; y: number }[]> {
  const { type, limit = 500, offset = 0 } = parameters;
  let column = FILTER_COLUMNS[type as keyof typeof FILTER_COLUMNS] || type;
  const { rawQuery, parseFilters } = tinybird.enabled ? tinybird : clickhouse;
  const { filterQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
  });

  let excludeDomain = '';
  let entryExitQuery = '';

  if (column === 'referrer_domain') {
    excludeDomain = `and referrer_domain != hostname and referrer_domain != ''`;
    if (type === 'domain') {
      column = toClickHouseGroupedReferrer(GROUPED_DOMAINS);
    }
  }

  if (type === 'entry' || type === 'exit') {
    const aggregrate = type === 'entry' ? 'argMin' : 'argMax';
    column = `x.${column}`;

    entryExitQuery = `
      JOIN (select session_id,
          ${aggregrate}(url_path, created_at) url_path
      from project_event
      where project_id = {projectId:String}
        and created_at between {startDate:DateTime64} and {endDate:DateTime64}
        and event_type != 2
      group by session_id) x
      ON x.session_id = project_event.session_id`;
  }

  return rawQuery(
    `
    select
      name,
      sum(t.c) as "pageviews",
      uniq(t.visitor_id) as "visitors",
      uniq(t.session_id) as "visits",
      sum(if(t.c = 1, 1, 0)) as "bounces",
      sum(max_time-min_time) as "totaltime"
    from (
      select
        ${column} name,
        visitor_id,
        session_id,
        count(*) c,
        min(created_at) min_time,
        max(created_at) max_time
      from project_event
      ${cohortQuery}
      ${entryExitQuery}
      where project_id = {projectId:String}
        and created_at between {startDate:DateTime64} and {endDate:DateTime64}
        and event_type != 2
        and name != ''
        ${excludeDomain}
        ${filterQuery}
      group by name, visitor_id, session_id
    ) as t
    group by name 
    order by visitors desc, visits desc
    limit ${limit}
    offset ${offset}
    `,
    { ...queryParams, ...parameters },
    'getPageviewExpandedMetrics',
  );
}

// ==========================================
// 11. getSessionStats
// ==========================================
export async function getSessionStats(...args: [projectId: string, filters: QueryFilters]) {
  return runQuery({
    [DRIZZLE]: () => relationalGetSessionStats(...args),
    [CLICKHOUSE]: () => clickhouseGetSessionStats(...args),
  });
}

async function relationalGetSessionStats(projectId: string, filters: QueryFilters) {
  const { timezone = 'utc', unit = 'day' } = filters;
  const { getDateSQL, getTimestampDiffSQL, parseFilters, rawQuery } = drizzle;
  const { filterQuery, joinVisitorQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
  });

  return rawQuery(
    `
    select
      ${getDateSQL('t.min_time', unit, timezone)} x,
      count(distinct t.session_id) y,
      count(distinct t.visitor_id) visitors,
      coalesce(sum(case when t.c = 1 then 1 else 0 end), 0) as bounces,
      cast(coalesce(sum(${getTimestampDiffSQL('t.min_time', 't.max_time')}), 0) as bigint) as totaltime,
      coalesce(sum(case when t.max_time > t.min_time then 1 else 0 end), 0) as visits_with_duration
    from (
      select
        project_event.session_id,
        project_event.visitor_id,
        count(*) as "c",
        min(project_event.created_at) as "min_time",
        max(project_event.created_at) as "max_time"
      from project_event
      ${cohortQuery}
      ${joinVisitorQuery}
      where project_event.project_id = {{projectId::String}}
        and project_event.created_at between {{startDate}} and {{endDate}}
        and project_event.event_type != 2
        ${filterQuery}
      group by 1, 2
    ) as t
    group by 1
    order by 1
    `,
    queryParams,
    'getSessionStats',
  );
}

async function clickhouseGetSessionStats(
  projectId: string,
  filters: QueryFilters,
): Promise<
  { x: string; y: number; visitors: number; bounces: number; totaltime: number; visits_with_duration: number }[]
> {
  const { timezone = 'UTC', unit = 'day' } = filters;
  const { parseFilters, rawQuery, getDateSQL } = tinybird.enabled ? tinybird : clickhouse;
  const { filterQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
  });

  let sql = '';

  if (EVENT_COLUMNS.some(item => Object.keys(filters).includes(item)) || unit === 'minute') {
    sql = `
    select
      g.t as x,
      g.y as y,
      coalesce(v.visitors, 0) as visitors,
      g.bounces as bounces,
      g.totaltime as totaltime,
      g.visits_with_duration as visits_with_duration
    from (
      select
        ${getDateSQL('min_time', unit, timezone)} as t,
        count(distinct session_id) as y,
        sum(if(c = 1, 1, 0)) as bounces,
        sum(max_time-min_time) as totaltime,
        sum(if(max_time > min_time, 1, 0)) as visits_with_duration
      from (
        select
          session_id,
          count(*) c,
          min(created_at) min_time,
          max(created_at) max_time
        from project_event
        ${cohortQuery}
        where project_id = {projectId:String}
          and created_at between {startDate:DateTime64} and {endDate:DateTime64}
          and event_type != 2
          ${filterQuery}
        group by session_id
      )
      group by t
    ) as g
    left join (
      select
        ${getDateSQL('first_time', unit, timezone)} as t,
        count(distinct visitor_id) as visitors
      from (
        select
          visitor_id,
          min(min_time) as first_time
        from (
          select
            session_id,
            argMax(visitor_id, created_at) as visitor_id,
            min(created_at) min_time
          from project_event
          ${cohortQuery}
          where project_id = {projectId:String}
            and created_at between {startDate:DateTime64} and {endDate:DateTime64}
            and event_type != 2
            ${filterQuery}
          group by session_id
        )
        group by visitor_id
      )
      group by t
    ) as v on g.t = v.t
    order by t
    `;
  } else {
    sql = `
    select
      g.t as x,
      g.y as y,
      coalesce(v.visitors, 0) as visitors,
      g.bounces as bounces,
      g.totaltime as totaltime,
      g.visits_with_duration as visits_with_duration
    from (
      select
        ${getDateSQL('start_time', unit, timezone)} as t,
        uniq(session_id) as y,
        sumIf(1, views = 1) as bounces,
        sum(end_time-start_time) as totaltime,
        sumIf(1, end_time > start_time) as visits_with_duration
      from (
        select
          session_id,
          sumMerge(views) as views,
          minMerge(start_time) as start_time,
          maxMerge(end_time) as end_time
        from project_session_stats
        ${cohortQuery}
        where project_id = {projectId:String}
          and session_date between toDate({startDate:DateTime64}) and toDate({endDate:DateTime64})
          ${filterQuery}
        group by session_id
        HAVING start_time between {startDate:DateTime64} and {endDate:DateTime64}
      )
      group by t
    ) as g
    left join (
      select
        ${getDateSQL('first_time', unit, timezone)} as t,
        uniq(visitor_id) as visitors
      from (
        select
          visitor_id,
          min(start_time) as first_time
        from (
          select
            session_id,
            argMaxMerge(visitor_id) as visitor_id,
            minMerge(start_time) as start_time
          from project_session_stats
          ${cohortQuery}
          where project_id = {projectId:String}
            and session_date between toDate({startDate:DateTime64}) and toDate({endDate:DateTime64})
            ${filterQuery}
          group by session_id
          HAVING start_time between {startDate:DateTime64} and {endDate:DateTime64}
        )
        group by visitor_id
      )
      group by t
    ) as v on g.t = v.t
    order by t
    `;
  }

  return rawQuery(sql, queryParams, 'getSessionStats');
}

// ==========================================
// 12. getSessionMetrics
// ==========================================
export interface SessionMetricsParameters {
  type: string;
  limit?: number | string;
  offset?: number | string;
}

export async function getSessionMetrics(
  ...args: [projectId: string, parameters: SessionMetricsParameters, filters: QueryFilters]
) {
  return runQuery({
    [DRIZZLE]: () => relationalGetSessionMetrics(...args),
    [CLICKHOUSE]: () => clickhouseGetSessionMetrics(...args),
  });
}

async function relationalGetSessionMetrics(
  projectId: string,
  parameters: SessionMetricsParameters,
  filters: QueryFilters,
) {
  const { type, limit = 500, offset = 0 } = parameters;
  let column = FILTER_COLUMNS[type as keyof typeof FILTER_COLUMNS] || type;
  const { parseFilters, rawQuery } = drizzle;
  const { filterQuery, joinVisitorQuery, cohortQuery, queryParams } = parseFilters(
    {
      ...filters,
      projectId,
    },
    {
      joinSession: SESSION_COLUMNS.includes(type),
    },
  );
  const includeCountry = column === 'city' || column === 'region';

  if (type === 'language') {
    column = `lower(left(${type}, 2))`;
  }

  return rawQuery(
    `
    select 
      ${column} x,
      count(distinct project_event.visitor_id) y
      ${includeCountry ? ', country' : ''}
    from project_event
    ${cohortQuery}
    ${joinVisitorQuery}
    where project_event.project_id = {{projectId::String}}
      and project_event.created_at between {{startDate}} and {{endDate}}
      and project_event.event_type != 2
    ${filterQuery}
    group by 1 
    ${includeCountry ? ', 3' : ''}
    order by 2 desc
    limit ${limit}
    offset ${offset}
    `,
    { ...queryParams, ...parameters },
    'getSessionMetrics',
  );
}

async function clickhouseGetSessionMetrics(
  projectId: string,
  parameters: SessionMetricsParameters,
  filters: QueryFilters,
): Promise<{ x: string; y: number }[]> {
  const { type, limit = 500, offset = 0 } = parameters;
  let column = FILTER_COLUMNS[type as keyof typeof FILTER_COLUMNS] || type;
  const { parseFilters, rawQuery } = tinybird.enabled ? tinybird : clickhouse;
  const { filterQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
  });
  const includeCountry = column === 'city' || column === 'region';

  if (type === 'language') {
    column = `lower(left(${type}, 2))`;
  }

  let sql = '';

  if (EVENT_COLUMNS.some(item => Object.keys(filters).includes(item))) {
    sql = `
    select
      ${column} x,
      count(distinct visitor_id) y
      ${includeCountry ? ', country' : ''}
    from project_event
    ${cohortQuery}
    where project_id = {projectId:String}
      and created_at between {startDate:DateTime64} and {endDate:DateTime64}
      and event_type != 2
      ${filterQuery}
    group by x 
    ${includeCountry ? ', country' : ''}
    order by y desc
    limit ${limit}
    offset ${offset}
    `;
  } else {
    sql = `
    select
      ${column} x,
      uniq(visitor_id) y
      ${includeCountry ? ', country' : ''}
    from project_event_stats_hourly as project_event
    ${cohortQuery}
    where project_id = {projectId:String}
      and created_at between {startDate:DateTime64} and {endDate:DateTime64}
      and event_type != 2
      ${filterQuery}
    group by x 
    ${includeCountry ? ', country' : ''}
    order by y desc
    limit ${limit}
    offset ${offset}
    `;
  }

  return rawQuery(sql, { ...queryParams, ...parameters }, 'getSessionMetrics');
}

// ==========================================
// 13. getSessionExpandedMetrics
// ==========================================
export interface SessionExpandedMetricsParameters {
  type: string;
  limit?: number | string;
  offset?: number | string;
}

export interface SessionExpandedMetricsData {
  name: string;
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
}

export async function getSessionExpandedMetrics(
  ...args: [projectId: string, parameters: SessionExpandedMetricsParameters, filters: QueryFilters]
): Promise<SessionExpandedMetricsData[]> {
  return runQuery({
    [DRIZZLE]: () => relationalGetSessionExpandedMetrics(...args),
    [CLICKHOUSE]: () => clickhouseGetSessionExpandedMetrics(...args),
  });
}

async function relationalGetSessionExpandedMetrics(
  projectId: string,
  parameters: SessionExpandedMetricsParameters,
  filters: QueryFilters,
): Promise<SessionExpandedMetricsData[]> {
  const { type, limit = 500, offset = 0 } = parameters;
  let column = FILTER_COLUMNS[type as keyof typeof FILTER_COLUMNS] || type;
  const { parseFilters, rawQuery, getTimestampDiffSQL } = drizzle;
  const { filterQuery, joinVisitorQuery, cohortQuery, queryParams } = parseFilters(
    {
      ...filters,
      projectId,
    },
    {
      joinSession: SESSION_COLUMNS.includes(type),
    },
  );
  const includeCountry = column === 'city' || column === 'region';

  if (type === 'language') {
    column = `lower(left(${type}, 2))`;
  }

  return rawQuery(
    `
    select
      name,
      ${includeCountry ? 'country,' : ''}
      sum(t.c) as "pageviews",
      count(distinct t.visitor_id) as "visitors",
      count(distinct t.session_id) as "visits",
      sum(case when t.c = 1 then 1 else 0 end) as "bounces",
      sum(${getTimestampDiffSQL('t.min_time', 't.max_time')}) as "totaltime"
    from (
      select
        ${column} name,
        ${includeCountry ? 'country,' : ''}
        project_event.visitor_id,
        project_event.session_id,
        count(*) as "c",
        min(project_event.created_at) as "min_time",
        max(project_event.created_at) as "max_time"
      from project_event
      ${cohortQuery}
      ${joinVisitorQuery}  
      where project_event.project_id = {{projectId::String}}
        and project_event.created_at between {{startDate}} and {{endDate}}
        and project_event.event_type != 2
        ${filterQuery}
      group by name, project_event.visitor_id, project_event.session_id
      ${includeCountry ? ', country' : ''}
    ) as t
    group by name 
    ${includeCountry ? ', country' : ''}
    order by visitors desc, visits desc
    limit ${limit}
    offset ${offset}
    `,
    { ...queryParams, ...parameters },
    'getSessionExpandedMetrics',
  );
}

async function clickhouseGetSessionExpandedMetrics(
  projectId: string,
  parameters: SessionExpandedMetricsParameters,
  filters: QueryFilters,
): Promise<SessionExpandedMetricsData[]> {
  const { type, limit = 500, offset = 0 } = parameters;
  let column = FILTER_COLUMNS[type as keyof typeof FILTER_COLUMNS] || type;
  const { parseFilters, rawQuery } = tinybird.enabled ? tinybird : clickhouse;
  const { filterQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
  });
  const includeCountry = column === 'city' || column === 'region';

  if (type === 'language') {
    column = `lower(left(${type}, 2))`;
  }

  return rawQuery(
    `
    select
      name,
      ${includeCountry ? 'country,' : ''}
      sum(t.c) as "pageviews",
      uniq(t.visitor_id) as "visitors",
      uniq(t.session_id) as "visits",
      sum(if(t.c = 1, 1, 0)) as "bounces",
      sum(max_time-min_time) as "totaltime"
    from (
      select
        ${column} name,
        ${includeCountry ? 'country,' : ''}
        visitor_id,
        session_id,
        count(*) c,
        min(created_at) min_time,
        max(created_at) max_time
      from project_event
      ${cohortQuery}
      where project_id = {projectId:String}
        and created_at between {startDate:DateTime64} and {endDate:DateTime64}
        and event_type != 2
        and name != ''
        ${filterQuery}
      group by name, visitor_id, session_id
      ${includeCountry ? ', country' : ''}
    ) as t
    group by name 
    ${includeCountry ? ', country' : ''}
    order by visitors desc, visits desc
    limit ${limit}
    offset ${offset}
    `,
    { ...queryParams, ...parameters },
    'getSessionExpandedMetrics',
  );
}

// ==========================================
// 14. getEventStats
// ==========================================
export interface ProjectEventMetric {
  x: string;
  t: string;
  y: number;
}

export async function getEventStats(
  ...args: [projectId: string, filters: QueryFilters]
): Promise<ProjectEventMetric[]> {
  return runQuery({
    [DRIZZLE]: () => relationalGetEventStats(...args),
    [CLICKHOUSE]: () => clickhouseGetEventStats(...args),
  });
}

async function relationalGetEventStats(projectId: string, filters: QueryFilters) {
  const { timezone = 'utc', unit = 'day' } = filters;
  const { rawQuery, getDateSQL, parseFilters } = drizzle;
  const { filterQuery, cohortQuery, joinVisitorQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
    eventType: EVENT_TYPE.customEvent,
  });

  return rawQuery(
    `
    select
      event_name x,
      ${getDateSQL('project_event.created_at', unit, timezone)} t,
      count(*) y
    from project_event
    ${cohortQuery}
    ${joinVisitorQuery}
    where project_event.project_id = {{projectId::String}}
      and project_event.created_at between {{startDate}} and {{endDate}}
      ${filterQuery}
    group by 1, 2
    order by 2
    `,
    queryParams,
    'getEventStats',
  );
}

async function clickhouseGetEventStats(
  projectId: string,
  filters: QueryFilters,
): Promise<{ x: string; t: string; y: number }[]> {
  const { timezone = 'UTC', unit = 'day' } = filters;
  const { rawQuery, getDateSQL, parseFilters } = tinybird.enabled ? tinybird : clickhouse;
  const { filterQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
    eventType: EVENT_TYPE.customEvent,
  });

  let sql = '';

  if (filterQuery || cohortQuery) {
    sql = `
    select
      event_name x,
      ${getDateSQL('created_at', unit, timezone)} t,
      count(*) y
    from project_event
    ${cohortQuery}
    where project_id = {projectId:String}
      and created_at between {startDate:DateTime64} and {endDate:DateTime64}
      and event_type = {eventType:UInt32}
      ${filterQuery}
    group by x, t
    order by t
    `;
  } else {
    sql = `
    select
      event_name x,
      ${getDateSQL('created_at', unit, timezone)} t,
      sum(views) y
    from project_event_stats_hourly project_event
    where project_id = {projectId:String}
      and created_at between {startDate:DateTime64} and {endDate:DateTime64}
      and event_type = {eventType:UInt32}
    group by x, t
    order by t
    `;
  }

  return rawQuery(sql, queryParams, 'getEventStats');
}

// ==========================================
// 15. getEventMetrics
// ==========================================
export interface EventMetricParameters {
  type: string;
  limit?: string | number;
  offset?: string | number;
}

export interface EventMetricData {
  x: string;
  y: number;
}

export async function getEventMetrics(
  ...args: [projectId: string, parameters: EventMetricParameters, filters: QueryFilters]
): Promise<EventMetricData[]> {
  return runQuery({
    [DRIZZLE]: () => relationalGetEventMetrics(...args),
    [CLICKHOUSE]: () => clickhouseGetEventMetrics(...args),
  });
}

async function relationalGetEventMetrics(
  projectId: string,
  parameters: EventMetricParameters,
  filters: QueryFilters,
) {
  const { type, limit = 500, offset = 0 } = parameters;
  const column = FILTER_COLUMNS[type as keyof typeof FILTER_COLUMNS] || type;
  const { rawQuery, parseFilters } = drizzle;
  const { filterQuery, cohortQuery, joinVisitorQuery, queryParams } = parseFilters(
    {
      ...filters,
      projectId,
      eventType: EVENT_TYPE.customEvent,
    },
    { joinSession: SESSION_COLUMNS.includes(type) },
  );

  return rawQuery(
    `
    select ${column} x,
      count(*) as y
    from project_event
    ${cohortQuery}
    ${joinVisitorQuery}
    where project_event.project_id = {{projectId::String}}
      and project_event.created_at between {{startDate}} and {{endDate}}
      ${filterQuery}
    group by 1
    order by 2 desc
    limit ${limit}
    offset ${offset}
    `,
    { ...queryParams, ...parameters },
    'getEventMetrics',
  );
}

async function clickhouseGetEventMetrics(
  projectId: string,
  parameters: EventMetricParameters,
  filters: QueryFilters,
): Promise<EventMetricData[]> {
  const { type, limit = 500, offset = 0 } = parameters;
  const column = FILTER_COLUMNS[type as keyof typeof FILTER_COLUMNS] || type;
  const { rawQuery, parseFilters } = tinybird.enabled ? tinybird : clickhouse;
  const { filterQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
    eventType: EVENT_TYPE.customEvent,
  });

  return rawQuery(
    `select ${column} x,
            count(*) as y
     from project_event
      ${cohortQuery}
     where project_id = {projectId:String}
        and created_at between {startDate:DateTime64} and {endDate:DateTime64}
        ${filterQuery}
     group by x
     order by y desc
         limit ${limit}
     offset ${offset}
    `,
    { ...queryParams, ...parameters },
    'getEventMetrics',
  );
}

// ==========================================
// 16. getEventExpandedMetrics
// ==========================================
export interface EventExpandedMetricParameters {
  type: string;
  limit?: string | number;
  offset?: string | number;
}

export interface EventExpandedMetricData {
  name: string;
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
}

export async function getEventExpandedMetrics(
  ...args: [projectId: string, parameters: EventExpandedMetricParameters, filters: QueryFilters]
): Promise<EventExpandedMetricData[]> {
  return runQuery({
    [DRIZZLE]: () => relationalGetEventExpandedMetrics(...args),
    [CLICKHOUSE]: () => clickhouseGetEventExpandedMetrics(...args),
  });
}

async function relationalGetEventExpandedMetrics(
  projectId: string,
  parameters: EventExpandedMetricParameters,
  filters: QueryFilters,
) {
  const { type, limit = 500, offset = 0 } = parameters;
  const column = FILTER_COLUMNS[type as keyof typeof FILTER_COLUMNS] || type;
  const { rawQuery, parseFilters, getTimestampDiffSQL } = drizzle;
  const { filterQuery, cohortQuery, joinVisitorQuery, queryParams } = parseFilters(
    {
      ...filters,
      projectId,
      eventType: EVENT_TYPE.customEvent,
    },
    { joinSession: SESSION_COLUMNS.includes(type) },
  );

  return rawQuery(
    `
    select
      name,
      sum(t.c) as "pageviews",
      count(distinct t.visitor_id) as "visitors",
      count(distinct t.session_id) as "visits",
      sum(case when t.c = 1 then 1 else 0 end) as "bounces",
      sum(${getTimestampDiffSQL('t.min_time', 't.max_time')}) as "totaltime"
    from (
      select
        ${column} name,
        project_event.visitor_id,
        project_event.session_id,
        count(*) as "c",
        min(project_event.created_at) as "min_time",
        max(project_event.created_at) as "max_time"
      from project_event
      ${cohortQuery}
      ${joinVisitorQuery}  
      where project_event.project_id = {{projectId::String}}
        and project_event.created_at between {{startDate}} and {{endDate}}
        ${filterQuery}
      group by name, project_event.visitor_id, project_event.session_id
    ) as t
    group by name 
    order by visitors desc, visits desc
    limit ${limit}
    offset ${offset}
    `,
    queryParams,
    'getEventExpandedMetrics',
  );
}

async function clickhouseGetEventExpandedMetrics(
  projectId: string,
  parameters: EventExpandedMetricParameters,
  filters: QueryFilters,
): Promise<EventExpandedMetricData[]> {
  const { type, limit = 500, offset = 0 } = parameters;
  const column = FILTER_COLUMNS[type as keyof typeof FILTER_COLUMNS] || type;
  const { rawQuery, parseFilters } = tinybird.enabled ? tinybird : clickhouse;
  const { filterQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
    eventType: EVENT_TYPE.customEvent,
  });

  return rawQuery(
    `
    select
      name,
      sum(t.c) as "pageviews",
      uniq(t.visitor_id) as "visitors",
      uniq(t.session_id) as "visits",
      sum(if(t.c = 1, 1, 0)) as "bounces",
      sum(max_time-min_time) as "totaltime"
    from (
      select
        ${column} name,
        visitor_id,
        session_id,
        count(*) c,
        min(created_at) min_time,
        max(created_at) max_time
      from project_event
      ${cohortQuery}
      where project_id = {projectId:String}
        and created_at between {startDate:DateTime64} and {endDate:DateTime64}
        and name != ''
        ${filterQuery}
      group by name, visitor_id, session_id
    ) as t
    group by name 
    order by visitors desc, visits desc
    limit ${limit}
    offset ${offset}
    `,
    { ...queryParams, ...parameters },
    'getEventExpandedMetrics',
  );
}

// ==========================================
// 17. getRealtimeActivity
// ==========================================
export async function getRealtimeActivity(...args: [projectId: string, filters: QueryFilters]) {
  return runQuery({
    [DRIZZLE]: () => relationalGetRealtimeActivity(...args),
    [CLICKHOUSE]: () => clickhouseGetRealtimeActivity(...args),
  });
}

async function relationalGetRealtimeActivity(projectId: string, filters: QueryFilters) {
  const { rawQuery, parseFilters } = drizzle;
  const { queryParams, filterQuery, cohortQuery, dateQuery } = parseFilters({
    ...filters,
    projectId,
  });

  return rawQuery(
    `
    select
        project_event.visitor_id as "visitorId",
        project_event.session_id as "sessionId",
        project_event.event_name as "eventName",
        project_event.created_at as "createdAt",
        visitor.browser,
        visitor.os,
        visitor.device,
        visitor.country,
        project_event.url_path as "urlPath",
        project_event.referrer_domain as "referrerDomain"
    from project_event
    ${cohortQuery}
    inner join visitor
      on visitor.visitor_id = project_event.visitor_id
        and visitor.project_id = project_event.project_id
    where project_event.project_id = {{projectId::String}}
    ${filterQuery}
    ${dateQuery}
    order by project_event.created_at desc
    limit 100
    `,
    queryParams,
    'getRealtimeActivity',
  );
}

async function clickhouseGetRealtimeActivity(projectId: string, filters: QueryFilters): Promise<any[]> {
  const { rawQuery, parseFilters } = tinybird.enabled ? tinybird : clickhouse;
  const { queryParams, filterQuery, cohortQuery, dateQuery } = parseFilters({
    ...filters,
    projectId,
  });

  return rawQuery(
    `
        select
            visitor_id as visitorId,
            session_id as sessionId,
            event_name as eventName,
            created_at as createdAt,
            browser,
            os,
            device,
            country,
            url_path as urlPath,
            referrer_domain as referrerDomain
        from project_event
        ${cohortQuery}
        where project_id = {projectId:String}
        ${filterQuery}
        ${dateQuery}
        order by createdAt desc
        limit 100
    `,
    queryParams,
    'getRealtimeActivity',
  );
}

// ==========================================
// 18. getRealtimeData
// ==========================================
function increment(data: object, key: string) {
  if (key) {
    if (!(data as any)[key]) {
      (data as any)[key] = 1;
    } else {
      (data as any)[key] += 1;
    }
  }
}

export async function getRealtimeData(projectId: string, filters: QueryFilters) {
  const [activity, pageviews, sessions] = await Promise.all([
    getRealtimeActivity(projectId, filters),
    getPageviewStats(projectId, filters),
    getSessionStats(projectId, filters),
  ]);

  const uniques = new Set();

  const { countries, urls, referrers, events } = activity.reverse().reduce(
    (
      obj: { countries: any; urls: any; referrers: any; events: any },
      event: {
        visitorId: string;
        sessionId: string;
        urlPath: string;
        referrerDomain: string;
        country: string;
        eventName: string;
      },
    ) => {
      const { countries, urls, referrers, events } = obj;
      const { visitorId, sessionId, urlPath, referrerDomain, country, eventName } = event;

      if (!uniques.has(visitorId)) {
        uniques.add(visitorId);
        increment(countries, country);
        events.push({ __type: 'session', ...event });
      }

      increment(urls, urlPath);
      increment(referrers, referrerDomain);
      events.push({ __type: eventName ? 'event' : 'pageview', ...event });

      return obj;
    },
    {
      countries: {},
      urls: {},
      referrers: {},
      events: [],
    },
  );

  return {
    countries,
    urls,
    referrers,
    events: events.reverse(),
    series: {
      views: pageviews,
      visitors: sessions,
    },
    totals: {
      views: pageviews.reduce((sum: number, { y }: { y: number }) => Number(sum) + Number(y), 0),
      visitors: sessions.reduce((sum: number, { y }: { y: number }) => Number(sum) + Number(y), 0),
      events: activity.filter((e: any) => e.eventName).length,
      countries: Object.keys(countries).length,
    },
    timestamp: Date.now(),
  };
}

// ==========================================
// 19. getPerformanceStats
// ==========================================
export interface PerformanceParameters {
  startDate: Date;
  endDate: Date;
  unit?: string;
  timezone?: string;
  metric?: string;
}

export interface PerformanceResult {
  chart: { t: string; p50: number; p75: number; p95: number }[];
  summary: {
    lcp: { p50: number; p75: number; p95: number };
    inp: { p50: number; p75: number; p95: number };
    cls: { p50: number; p75: number; p95: number };
    fcp: { p50: number; p75: number; p95: number };
    ttfb: { p50: number; p75: number; p95: number };
    count: number;
  };
}

export async function getPerformanceStats(
  ...args: [projectId: string, parameters: PerformanceParameters, filters: QueryFilters]
) {
  return runQuery({
    [DRIZZLE]: () => relationalGetPerformanceStats(...args),
    [CLICKHOUSE]: () => clickhouseGetPerformanceStats(...args),
  });
}

async function relationalGetPerformanceStats(
  projectId: string,
  parameters: PerformanceParameters,
  filters: QueryFilters,
): Promise<PerformanceResult> {
  const { startDate, endDate, unit = 'day', timezone = 'utc', metric = 'lcp' } = parameters;
  const { getDateSQL, rawQuery, parseFilters } = drizzle;
  const { filterQuery, joinVisitorQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
  });

  const chart = await rawQuery(
    `
    select
      ${getDateSQL('created_at', unit, timezone)} t,
      percentile_cont(0.5) within group (order by ${metric}) as p50,
      percentile_cont(0.75) within group (order by ${metric}) as p75,
      percentile_cont(0.95) within group (order by ${metric}) as p95
    from project_event
    ${cohortQuery}
    ${joinVisitorQuery}
    where project_event.project_id = {{projectId::String}}
      and project_event.event_type = 5
      and project_event.created_at between {{startDate}} and {{endDate}}
      ${filterQuery}
    group by t
    order by t
    `,
    { ...queryParams, startDate, endDate },
  );

  const summaryResult = await rawQuery(
    `
    select
      percentile_cont(0.5) within group (order by lcp) as lcp_p50,
      percentile_cont(0.75) within group (order by lcp) as lcp_p75,
      percentile_cont(0.95) within group (order by lcp) as lcp_p95,
      percentile_cont(0.5) within group (order by inp) as inp_p50,
      percentile_cont(0.75) within group (order by inp) as inp_p75,
      percentile_cont(0.95) within group (order by inp) as inp_p95,
      percentile_cont(0.5) within group (order by cls) as cls_p50,
      percentile_cont(0.75) within group (order by cls) as cls_p75,
      percentile_cont(0.95) within group (order by cls) as cls_p95,
      percentile_cont(0.5) within group (order by fcp) as fcp_p50,
      percentile_cont(0.75) within group (order by fcp) as fcp_p75,
      percentile_cont(0.95) within group (order by fcp) as fcp_p95,
      percentile_cont(0.5) within group (order by ttfb) as ttfb_p50,
      percentile_cont(0.75) within group (order by ttfb) as ttfb_p75,
      percentile_cont(0.95) within group (order by ttfb) as ttfb_p95,
      count(*) as count
    from project_event
    ${cohortQuery}
    ${joinVisitorQuery}
    where project_event.project_id = {{projectId::String}}
      and project_event.event_type = 5
      and project_event.created_at between {{startDate}} and {{endDate}}
      ${filterQuery}
    `,
    { ...queryParams, startDate, endDate },
  ).then(result => result?.[0]);

  const summary = {
    lcp: {
      p50: Number(summaryResult?.lcp_p50 || 0),
      p75: Number(summaryResult?.lcp_p75 || 0),
      p95: Number(summaryResult?.lcp_p95 || 0),
    },
    inp: {
      p50: Number(summaryResult?.inp_p50 || 0),
      p75: Number(summaryResult?.inp_p75 || 0),
      p95: Number(summaryResult?.inp_p95 || 0),
    },
    cls: {
      p50: Number(summaryResult?.cls_p50 || 0),
      p75: Number(summaryResult?.cls_p75 || 0),
      p95: Number(summaryResult?.cls_p95 || 0),
    },
    fcp: {
      p50: Number(summaryResult?.fcp_p50 || 0),
      p75: Number(summaryResult?.fcp_p75 || 0),
      p95: Number(summaryResult?.fcp_p95 || 0),
    },
    ttfb: {
      p50: Number(summaryResult?.ttfb_p50 || 0),
      p75: Number(summaryResult?.ttfb_p75 || 0),
      p95: Number(summaryResult?.ttfb_p95 || 0),
    },
    count: Number(summaryResult?.count || 0),
  };

  return { chart, summary };
}

async function clickhouseGetPerformanceStats(
  projectId: string,
  parameters: PerformanceParameters,
  filters: QueryFilters,
): Promise<PerformanceResult> {
  const { startDate, endDate, unit = 'day', timezone = 'utc', metric = 'lcp' } = parameters;
  const { getDateSQL, rawQuery, parseFilters } = tinybird.enabled ? tinybird : clickhouse;
  const { filterQuery, cohortQuery, queryParams } = parseFilters({ ...filters, projectId });

  const chart = await rawQuery<{ t: string; p50: number; p75: number; p95: number }[]>(
    `
    select
      ${getDateSQL('created_at', unit, timezone)} t,
      quantile(0.5)(${metric}) as p50,
      quantile(0.75)(${metric}) as p75,
      quantile(0.95)(${metric}) as p95
    from project_event
    ${cohortQuery}
    where project_event.project_id = {projectId:String}
      and project_event.event_type = 5
      and project_event.created_at between {startDate:DateTime64} and {endDate:DateTime64}
      ${filterQuery}
    group by t
    order by t
    `,
    { ...queryParams, startDate, endDate },
  );

  const summaryResult = await rawQuery<any>(
    `
    select
      quantile(0.5)(lcp) as lcp_p50,
      quantile(0.75)(lcp) as lcp_p75,
      quantile(0.95)(lcp) as lcp_p95,
      quantile(0.5)(inp) as inp_p50,
      quantile(0.75)(inp) as inp_p75,
      quantile(0.95)(inp) as inp_p95,
      quantile(0.5)(cls) as cls_p50,
      quantile(0.75)(cls) as cls_p75,
      quantile(0.95)(cls) as cls_p95,
      quantile(0.5)(fcp) as fcp_p50,
      quantile(0.75)(fcp) as fcp_p75,
      quantile(0.95)(fcp) as fcp_p95,
      quantile(0.5)(ttfb) as ttfb_p50,
      quantile(0.75)(ttfb) as ttfb_p75,
      quantile(0.95)(ttfb) as ttfb_p95,
      count() as count
    from project_event
    ${cohortQuery}
    where project_event.project_id = {projectId:String}
      and project_event.event_type = 5
      and project_event.created_at between {startDate:DateTime64} and {endDate:DateTime64}
      ${filterQuery}
    `,
    { ...queryParams, startDate, endDate },
  ).then(result => result?.[0]);

  const summary = {
    lcp: {
      p50: Number(summaryResult?.lcp_p50 || 0),
      p75: Number(summaryResult?.lcp_p75 || 0),
      p95: Number(summaryResult?.lcp_p95 || 0),
    },
    inp: {
      p50: Number(summaryResult?.inp_p50 || 0),
      p75: Number(summaryResult?.inp_p75 || 0),
      p95: Number(summaryResult?.inp_p95 || 0),
    },
    cls: {
      p50: Number(summaryResult?.cls_p50 || 0),
      p75: Number(summaryResult?.cls_p75 || 0),
      p95: Number(summaryResult?.cls_p95 || 0),
    },
    fcp: {
      p50: Number(summaryResult?.fcp_p50 || 0),
      p75: Number(summaryResult?.fcp_p75 || 0),
      p95: Number(summaryResult?.fcp_p95 || 0),
    },
    ttfb: {
      p50: Number(summaryResult?.ttfb_p50 || 0),
      p75: Number(summaryResult?.ttfb_p75 || 0),
      p95: Number(summaryResult?.ttfb_p95 || 0),
    },
    count: Number(summaryResult?.count || 0),
  };

  return { chart, summary };
}

export interface PerformanceMetricsData {
  name: string;
  p50: number;
  p75: number;
  p95: number;
  count: number;
}

export async function getPerformanceMetrics(
  ...args: [
    projectId: string,
    parameters: PerformanceParameters,
    filters: QueryFilters,
    column: string,
    limit?: number,
  ]
) {
  return runQuery({
    [DRIZZLE]: () => relationalGetPerformanceMetrics(...args),
    [CLICKHOUSE]: () => clickhouseGetPerformanceMetrics(...args),
  });
}

async function relationalGetPerformanceMetrics(
  projectId: string,
  parameters: PerformanceParameters,
  filters: QueryFilters,
  column: string,
  limit?: number,
): Promise<PerformanceMetricsData[]> {
  const { startDate, endDate, metric = 'lcp' } = parameters;
  const { rawQuery, parseFilters } = drizzle;
  const { filterQuery, joinVisitorQuery, cohortQuery, queryParams } = parseFilters(
    { ...filters, projectId },
    { joinSession: (SESSION_COLUMNS as readonly string[]).includes(column) },
  );

  return rawQuery(
    `
    select
      ${column} as "name",
      percentile_cont(0.5) within group (order by ${metric}) as p50,
      percentile_cont(0.75) within group (order by ${metric}) as p75,
      percentile_cont(0.95) within group (order by ${metric}) as p95,
      count(*) as count
    from project_event
    ${cohortQuery}
    ${joinVisitorQuery}
    where project_event.project_id = {{projectId::String}}
      and project_event.event_type = 5
      and project_event.created_at between {{startDate}} and {{endDate}}
      ${filterQuery}
    group by ${column}
    order by p75 desc
    ${limit ? `limit ${limit}` : ''}
    `,
    { ...queryParams, startDate, endDate },
  );
}

async function clickhouseGetPerformanceMetrics(
  projectId: string,
  parameters: PerformanceParameters,
  filters: QueryFilters,
  column: string,
  limit?: number,
): Promise<PerformanceMetricsData[]> {
  const { startDate, endDate, metric = 'lcp' } = parameters;
  const { rawQuery, parseFilters } = tinybird.enabled ? tinybird : clickhouse;
  const { filterQuery, cohortQuery, queryParams } = parseFilters({ ...filters, projectId });

  return rawQuery<PerformanceMetricsData[]>(
    `
    select
      ${column} as "name",
      quantile(0.5)(${metric}) as p50,
      quantile(0.75)(${metric}) as p75,
      quantile(0.95)(${metric}) as p95,
      count() as count
    from project_event
    ${cohortQuery}
    where project_event.project_id = {projectId:String}
      and project_event.event_type = 5
      and project_event.created_at between {startDate:DateTime64} and {endDate:DateTime64}
      ${filterQuery}
    group by ${column}
    order by p75 desc
    ${limit ? `limit ${limit}` : ''}
    `,
    { ...queryParams, startDate, endDate },
  );
}
