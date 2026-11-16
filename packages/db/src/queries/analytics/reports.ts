import clickhouse from '../../lib/analytics/clickhouse';
import {
  EMAIL_DOMAINS,
  PAID_AD_PARAMS,
  SEARCH_DOMAINS,
  SHOPPING_DOMAINS,
  SOCIAL_DOMAINS,
  VIDEO_DOMAINS,
  EVENT_TYPE,
  FILTER_COLUMNS,
  SESSION_COLUMNS
} from '../../lib/analytics/constants';
import { CLICKHOUSE, DRIZZLE, runQuery } from '../../lib/routing';
import drizzle from '../../lib/relational/drizzle';
import tinybird from '../../lib/analytics/tinybird';
import type { QueryFilters } from '@vision/shared-types';
import { PerformanceParameters, PerformanceResult } from './metrics';

// ==========================================
// helper functions
// ==========================================
function toClickHouseStringArray(arr: string[]): string {
  return arr.map(p => `'${p.replace(/'/g, "\\'")}'`).join(', ');
}

function toPostgresLikeClause(column: string, arr: string[]) {
  return arr.map(val => `${column} ilike '%${val.replace(/'/g, "''")}%'`).join(' OR\n  ');
}

// ==========================================
// 1. getAttribution
// ==========================================
export interface AttributionParameters {
  startDate: Date;
  endDate: Date;
  model: string;
  type: string;
  step: string;
  currency?: string;
}

export interface AttributionResult {
  referrer: { name: string; value: number }[];
  paidAds: { name: string; value: number }[];
  utm_source: { name: string; value: number }[];
  utm_medium: { name: string; value: number }[];
  utm_campaign: { name: string; value: number }[];
  utm_content: { name: string; value: number }[];
  utm_term: { name: string; value: number }[];
  total: { pageviews: number; visitors: number; visits: number };
}

export async function getAttribution(
  ...args: [projectId: string, parameters: AttributionParameters, filters: QueryFilters]
) {
  return runQuery({
    [DRIZZLE]: () => relationalGetAttribution(...args),
    [CLICKHOUSE]: () => clickhouseGetAttribution(...args),
  });
}

async function relationalGetAttribution(
  projectId: string,
  parameters: AttributionParameters,
  filters: QueryFilters,
): Promise<AttributionResult> {
  const { model, type, currency } = parameters;
  const { rawQuery, parseFilters } = drizzle;
  const eventType = type === 'path' ? EVENT_TYPE.pageView : EVENT_TYPE.customEvent;
  const column = type === 'path' ? 'url_path' : 'event_name';
  const { filterQuery, joinVisitorQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    ...parameters,
    projectId,
    eventType,
  });

  function getUTMQuery(utmColumn: string) {
    return `
    select 
        coalesce(we.${utmColumn}, '') name,
        ${currency ? 'sum(e.value)' : 'count(distinct we.session_id)'} value
    from model m
    join project_event we
    on we.created_at = m.created_at
        and we.session_id = m.session_id
    ${currency ? 'join events e on e.session_id = m.session_id' : ''}
    where we.project_id = {{projectId::String}}
          and we.created_at between {{startDate}} and {{endDate}}
    ${currency ? '' : `and we.${utmColumn} != ''`}  
    group by 1
    order by 2 desc
    limit 20`;
  }

  const eventQuery = `WITH events AS (
        select distinct
            project_event.session_id,
            max(project_event.created_at) max_dt
        from project_event
        ${cohortQuery}
        ${joinVisitorQuery}
        where project_event.project_id = {{projectId::String}}
          and project_event.created_at between {{startDate}} and {{endDate}}
          and project_event.${column} = {{step}}
          ${filterQuery}
        group by 1),`;

  const revenueEventQuery = `WITH events AS (
        select
          revenue.session_id,
          max(revenue.created_at) max_dt,
          sum(revenue.revenue) value
        from revenue
        join project_event
          on project_event.project_id = revenue.project_id
            and project_event.session_id = revenue.session_id
            and project_event.event_id = revenue.event_id
            and project_event.project_id = {{projectId::String}}
            and project_event.created_at between {{startDate}} and {{endDate}}
        ${cohortQuery}
        ${joinVisitorQuery}
        where revenue.project_id = {{projectId::String}}
          and revenue.created_at between {{startDate}} and {{endDate}}
          and revenue.${column} = {{step}}
          and revenue.currency = {{currency}}
          ${filterQuery}
        group by 1),`;

  function getModelQuery(model: string) {
    return model === 'first-click'
      ? `\n 
    model AS (select e.session_id,
        min(we.created_at) created_at
    from events e
    join project_event we
    on we.session_id = e.session_id
    where we.project_id = {{projectId::String}}
          and we.created_at between {{startDate}} and {{endDate}}
    group by e.session_id)`
      : `\n 
    model AS (select e.session_id,
        max(we.created_at) created_at
    from events e
    join project_event we
    on we.session_id = e.session_id
    where we.project_id = {{projectId::String}}
          and we.created_at between {{startDate}} and {{endDate}} 
          and we.created_at < e.max_dt
    group by e.session_id)`;
  }

  const referrerRes = await rawQuery(
    `
    ${currency ? revenueEventQuery : eventQuery}
    ${getModelQuery(model)}
    select coalesce(we.referrer_domain, '') name,
        ${currency ? 'sum(e.value)' : 'count(distinct we.session_id)'} value
    from model m
    join project_event we
    on we.created_at = m.created_at
        and we.session_id = m.session_id
    join session s
    on s.session_id = m.session_id
    ${currency ? 'join events e on e.session_id = m.session_id' : ''}
    where we.project_id = {{projectId::String}}
          and we.created_at between {{startDate}} and {{endDate}}
    ${currency
      ? ''
      : `and we.referrer_domain != hostname
      and we.referrer_domain != ''`
    }  
    group by 1
    order by 2 desc
    limit 20
    `,
    queryParams,
  );

  const paidAdsres = await rawQuery(
    `
    ${currency ? revenueEventQuery : eventQuery}
    ${getModelQuery(model)},

    results AS (
    select case
            when coalesce(gclid, '') != '' then 'Google Ads' 
            when coalesce(fbclid, '') != '' then 'Facebook / Meta' 
            when coalesce(msclkid, '') != '' then 'Microsoft Ads' 
            when coalesce(ttclid, '') != '' then 'TikTok Ads' 
            when coalesce(li_fat_id, '') != '' then 'LinkedIn Ads' 
            when coalesce(twclid, '') != '' then 'Twitter Ads (X)'
            else ''
          end name,
        ${currency ? 'sum(e.value)' : 'count(distinct we.session_id)'} value
    from model m
    join project_event we
    on we.created_at = m.created_at
        and we.session_id = m.session_id
    ${currency ? 'join events e on e.session_id = m.session_id' : ''}
    where we.project_id = {{projectId::String}}
          and we.created_at between {{startDate}} and {{endDate}}
    group by 1
    order by 2 desc
    limit 20)
    SELECT * 
    FROM results
    ${currency ? '' : `WHERE name != ''`}
    `,
    queryParams,
  );

  const sourceRes = await rawQuery(
    `
    ${currency ? revenueEventQuery : eventQuery}
    ${getModelQuery(model)}
    ${getUTMQuery('utm_source')}
    `,
    queryParams,
  );

  const mediumRes = await rawQuery(
    `
    ${currency ? revenueEventQuery : eventQuery}
    ${getModelQuery(model)}
    ${getUTMQuery('utm_medium')}
    `,
    queryParams,
  );

  const campaignRes = await rawQuery(
    `
    ${currency ? revenueEventQuery : eventQuery}
    ${getModelQuery(model)}
    ${getUTMQuery('utm_campaign')}
    `,
    queryParams,
  );

  const contentRes = await rawQuery(
    `
    ${currency ? revenueEventQuery : eventQuery}
    ${getModelQuery(model)}
    ${getUTMQuery('utm_content')}
    `,
    queryParams,
  );

  const termRes = await rawQuery(
    `
    ${currency ? revenueEventQuery : eventQuery}
    ${getModelQuery(model)}
    ${getUTMQuery('utm_term')}
    `,
    queryParams,
  );

  const totalRes = await rawQuery(
    `
    select 
        count(*) as "pageviews",
        count(distinct project_event.visitor_id) as "visitors",
        count(distinct project_event.session_id) as "visits"
    from project_event
    ${joinVisitorQuery}
    ${cohortQuery}
    where project_event.project_id = {{projectId::String}}
        and project_event.created_at between {{startDate}} and {{endDate}}
        and project_event.${column} = {{step}}
        ${filterQuery}
    `,
    queryParams,
  ).then(result => result?.[0]);

  return {
    referrer: referrerRes,
    paidAds: paidAdsres,
    utm_source: sourceRes,
    utm_medium: mediumRes,
    utm_campaign: campaignRes,
    utm_content: contentRes,
    utm_term: termRes,
    total: totalRes,
  };
}

async function clickhouseGetAttribution(
  projectId: string,
  parameters: AttributionParameters,
  filters: QueryFilters,
): Promise<AttributionResult> {
  const { model, type, currency } = parameters;
  const { rawQuery, parseFilters } = tinybird.enabled ? tinybird : clickhouse;
  const eventType = type === 'path' ? EVENT_TYPE.pageView : EVENT_TYPE.customEvent;
  const column = type === 'path' ? 'url_path' : 'event_name';
  const { filterQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    ...parameters,
    projectId,
    eventType,
  });

  function getUTMQuery(utmColumn: string) {
    return `
    select 
        coalesce(${utmColumn}, '') name,
        ${currency ? 'sum(e.value)' : 'uniq(session_id)'} value
    from model m
    join project_event we
    on we.created_at = m.created_at
        and we.session_id = m.session_id
    ${currency ? 'join events e on e.session_id = m.session_id' : ''}
    where we.project_id = {projectId:String}
          and we.created_at between {startDate:DateTime64} and {endDate:DateTime64}
    ${currency ? '' : `and we.${utmColumn} != ''`}  
    group by 1
    order by 2 desc
    limit 20`;
  }

  const eventQuery = `WITH events AS (
        select distinct
            session_id,
            max(created_at) max_dt
        from project_event
        ${cohortQuery}
        where project_id = {projectId:String}
          and created_at between {startDate:DateTime64} and {endDate:DateTime64}
          and ${column} = {step:String}
          ${filterQuery}
        group by 1),`;

  const revenueEventQuery = `WITH events AS (
        select
          session_id,
          max(created_at) max_dt,
          sum(revenue) value
        from project_revenue
        join project_event
          on project_event.project_id = project_revenue.project_id
            and project_event.session_id = project_revenue.session_id
            and project_event.event_id = project_revenue.event_id
            and project_event.project_id = {projectId:String}
            and project_event.created_at between {startDate:DateTime64} and {endDate:DateTime64}
        ${cohortQuery}
        where project_revenue.project_id = {projectId:String}
          and project_revenue.created_at between {startDate:DateTime64} and {endDate:DateTime64}
          and project_revenue.${column} = {step:String}
          and project_revenue.currency = {currency:String}
          ${filterQuery}
        group by 1),`;

  function getModelQuery(model: string) {
    return model === 'first-click'
      ? `\n 
    model AS (select e.session_id,
        min(we.created_at) created_at
    from events e
    join project_event we
    on we.session_id = e.session_id
    where we.project_id = {projectId:String}
          and we.created_at between {startDate:DateTime64} and {endDate:DateTime64}
    group by e.session_id)`
      : `\n 
    model AS (select e.session_id,
        max(we.created_at) created_at
    from events e
    join project_event we
    on we.session_id = e.session_id
    where we.project_id = {projectId:String}
          and we.created_at between {startDate:DateTime64} and {endDate:DateTime64} 
          and we.created_at < e.max_dt
    group by e.session_id)`;
  }

  const referrerRes = await rawQuery<any>(
    `
    ${currency ? revenueEventQuery : eventQuery}
    ${getModelQuery(model)}
    select coalesce(we.referrer_domain, '') name,
        ${currency ? 'sum(e.value)' : 'uniq(we.session_id)'} value
    from model m
    join project_event we
    on we.created_at = m.created_at
        and we.session_id = m.session_id
    ${currency ? 'join events e on e.session_id = m.session_id' : ''}
    where we.project_id = {projectId:String}
          and we.created_at between {startDate:DateTime64} and {endDate:DateTime64}
    ${currency
      ? ''
      : `and we.referrer_domain != hostname
      and we.referrer_domain != ''`
    }  
    group by 1
    order by 2 desc
    limit 20
    `,
    queryParams,
  );

  const paidAdsres = await rawQuery<any>(
    `
    ${currency ? revenueEventQuery : eventQuery}
    ${getModelQuery(model)},

    results AS (
    select case
            when coalesce(gclid, '') != '' then 'Google Ads' 
            when coalesce(fbclid, '') != '' then 'Facebook / Meta' 
            when coalesce(msclkid, '') != '' then 'Microsoft Ads' 
            when coalesce(ttclid, '') != '' then 'TikTok Ads' 
            when coalesce(li_fat_id, '') != '' then 'LinkedIn Ads' 
            when coalesce(twclid, '') != '' then 'Twitter Ads (X)'
            else ''
          end name,
        ${currency ? 'sum(e.value)' : 'uniq(we.session_id)'} value
    from model m
    join project_event we
    on we.created_at = m.created_at
        and we.session_id = m.session_id
    ${currency ? 'join events e on e.session_id = m.session_id' : ''}
    where we.project_id = {projectId:String}
          and we.created_at between {startDate:DateTime64} and {endDate:DateTime64}
    group by 1
    order by 2 desc
    limit 20)
    SELECT * 
    FROM results
    ${currency ? '' : `WHERE name != ''`}
    `,
    queryParams,
  );

  const sourceRes = await rawQuery<any>(
    `
    ${currency ? revenueEventQuery : eventQuery}
    ${getModelQuery(model)}
    ${getUTMQuery('utm_source')}
    `,
    queryParams,
  );

  const mediumRes = await rawQuery<any>(
    `
    ${currency ? revenueEventQuery : eventQuery}
    ${getModelQuery(model)}
    ${getUTMQuery('utm_medium')}
    `,
    queryParams,
  );

  const campaignRes = await rawQuery<any>(
    `
    ${currency ? revenueEventQuery : eventQuery}
    ${getModelQuery(model)}
    ${getUTMQuery('utm_campaign')}
    `,
    queryParams,
  );

  const contentRes = await rawQuery<any>(
    `
    ${currency ? revenueEventQuery : eventQuery}
    ${getModelQuery(model)}
    ${getUTMQuery('utm_content')}
    `,
    queryParams,
  );

  const termRes = await rawQuery<any>(
    `
    ${currency ? revenueEventQuery : eventQuery}
    ${getModelQuery(model)}
    ${getUTMQuery('utm_term')}
    `,
    queryParams,
  );

  const totalRes = await rawQuery<any>(
    `
    select 
        count() as "pageviews",
        uniq(visitor_id) as "visitors",
        uniq(session_id) as "visits"
    from project_event
    where project_id = {projectId:String}
        and created_at between {startDate:DateTime64} and {endDate:DateTime64}
        and ${column} = {step:String}
        ${filterQuery}
    `,
    queryParams,
  ).then(result => result?.[0]);

  return {
    referrer: referrerRes,
    paidAds: paidAdsres,
    utm_source: sourceRes,
    utm_medium: mediumRes,
    utm_campaign: campaignRes,
    utm_content: contentRes,
    utm_term: termRes,
    total: totalRes,
  };
}

// ==========================================
// 2. getBreakdown
// ==========================================
export interface BreakdownParameters {
  startDate: Date;
  endDate: Date;
  fields: string[];
}

export interface BreakdownData {
  x: string;
  y: number;
}

export async function getBreakdown(
  ...args: [projectId: string, parameters: BreakdownParameters, filters: QueryFilters]
) {
  return runQuery({
    [DRIZZLE]: () => relationalGetBreakdown(...args),
    [CLICKHOUSE]: () => clickhouseGetBreakdown(...args),
  });
}

async function relationalGetBreakdown(
  projectId: string,
  parameters: BreakdownParameters,
  filters: QueryFilters,
): Promise<BreakdownData[]> {
  const { getTimestampDiffSQL, parseFilters, rawQuery } = drizzle;
  const { startDate, endDate, fields } = parameters;
  const { filterQuery, joinVisitorQuery, cohortQuery, queryParams } = parseFilters(
    {
      ...filters,
      projectId,
      startDate,
      endDate,
      eventType: EVENT_TYPE.pageView,
    },
    {
      joinSession: !!fields.find((name: string) => SESSION_COLUMNS.includes(name)),
    },
  );

  return rawQuery(
    `
    select
      sum(t.c) as "views",
      count(distinct t.visitor_id) as "visitors",
      count(distinct t.session_id) as "visits",
      sum(case when t.c = 1 then 1 else 0 end) as "bounces",
      sum(${getTimestampDiffSQL('t.min_time', 't.max_time')}) as "totaltime",
      ${parseFieldsByName(fields)}
    from (
      select
        ${parseFields(fields)},
        project_event.visitor_id,
        project_event.session_id,
        count(*) as "c",
        min(project_event.created_at) as "min_time",
        max(project_event.created_at) as "max_time"
      from project_event
      ${cohortQuery}  
      ${joinVisitorQuery}
      where project_event.project_id = {{projectId}}
        and project_event.created_at between {{startDate}} and {{endDate}}
        ${filterQuery}
      group by ${parseFieldsByName(fields)}, 
        project_event.visitor_id, project_event.session_id
    ) as t
    group by ${parseFieldsByName(fields)}
    order by 1 desc, 2 desc
    limit 500
    `,
    queryParams,
  );
}

async function clickhouseGetBreakdown(
  projectId: string,
  parameters: BreakdownParameters,
  filters: QueryFilters,
): Promise<BreakdownData[]> {
  const { parseFilters, rawQuery } = tinybird.enabled ? tinybird : clickhouse;
  const { startDate, endDate, fields } = parameters;
  const { filterQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
    startDate,
    endDate,
    eventType: EVENT_TYPE.pageView,
  });

  return rawQuery(
    `
    select
      sum(t.c) as "views",
      count(distinct t.visitor_id) as "visitors",
      count(distinct t.session_id) as "visits",
      sum(if(t.c = 1, 1, 0)) as "bounces",
      sum(max_time-min_time) as "totaltime",
      ${parseFieldsByName(fields)}
    from (
      select
        ${parseFields(fields)},
        visitor_id,
        session_id,
        count(*) c,
        min(created_at) min_time,
        max(created_at) max_time
      from project_event
      ${cohortQuery}
      where project_id = {projectId:String}
        and created_at between {startDate:DateTime64} and {endDate:DateTime64}
        ${filterQuery}
      group by ${parseFieldsByName(fields)}, 
        visitor_id, session_id
    ) as t
    group by ${parseFieldsByName(fields)}
    order by 1 desc, 2 desc
    limit 500
    `,
    queryParams,
  );
}

function parseFields(fields: string[]) {
  return fields.map(name => `${FILTER_COLUMNS[name as keyof typeof FILTER_COLUMNS] || name} as "${name}"`).join(',');
}

function parseFieldsByName(fields: string[]) {
  return `${fields.map(name => name).join(',')}`;
}

// ==========================================
// 3. getFunnel
// ==========================================
export interface FunnelParameters {
  startDate: Date;
  endDate: Date;
  window: number;
  steps: { type: string; value: string }[];
}

export interface FunnelResult {
  value: string;
  visitors: number;
  dropoff: number;
}

export async function getFunnel(
  ...args: [projectId: string, parameters: FunnelParameters, filters: QueryFilters]
) {
  return runQuery({
    [DRIZZLE]: () => relationalGetFunnel(...args),
    [CLICKHOUSE]: () => clickhouseGetFunnel(...args),
  });
}

async function relationalGetFunnel(
  projectId: string,
  parameters: FunnelParameters,
  filters: QueryFilters,
): Promise<FunnelResult[]> {
  const { startDate, endDate, window, steps } = parameters;
  const { rawQuery, getAddIntervalQuery, parseFilters } = drizzle;
  const { filterQuery, joinVisitorQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
    startDate,
    endDate,
  });
  const { levelOneQuery, levelQuery, sumQuery, params } = getFunnelQuery(steps, window);

  function getFunnelQuery(
    steps: { type: string; value: string }[],
    window: number,
  ) {
    return steps.reduce(
      (pv, cv, i) => {
        const levelNumber = i + 1;
        const startSum = i > 0 ? 'union ' : '';
        const isURL = cv.type === 'path';
        const column = isURL ? 'url_path' : 'event_name';

        let operator = '=';
        let paramValue = cv.value;

        if (cv.value.startsWith('*') || cv.value.endsWith('*')) {
          operator = 'like';
          paramValue = cv.value.replace(/^\*|\*$/g, '%');
        }

        if (levelNumber === 1) {
          pv.levelOneQuery = `
          WITH level1 AS (
            select distinct project_event.session_id, project_event.created_at
            from project_event
            ${cohortQuery}
            ${joinVisitorQuery}
            where project_event.project_id = {{projectId::String}}
              and project_event.created_at between {{startDate}} and {{endDate}}
              and ${column} ${operator} {{${i}}}
              ${filterQuery}
          )`;
        } else {
          pv.levelQuery += `
          , level${levelNumber} AS (
            select distinct we.session_id, we.created_at
            from level${i} l
            join project_event we
                on l.session_id = we.session_id
            where we.project_id = {{projectId::String}}
                and we.created_at between l.created_at and ${getAddIntervalQuery(
            `l.created_at `,
            `${window} minute`,
          )}
                and we.${column} ${operator} {{${i}}}
                and we.created_at <= {{endDate}}
          )`;
        }

        pv.sumQuery += `\n${startSum}select ${levelNumber} as level, count(distinct(session_id)) as count from level${levelNumber}`;
        pv.params.push(paramValue);

        return pv;
      },
      {
        levelOneQuery: '',
        levelQuery: '',
        sumQuery: '',
        params: [] as string[],
      },
    );
  }

  const queryParamsWithIndex: Record<string, any> = { ...queryParams };
  params.forEach((val, i) => {
    queryParamsWithIndex[`${i}`] = val;
  });

  return rawQuery(
    `
    ${levelOneQuery}
    ${levelQuery}
    ${sumQuery}
    ORDER BY level;
    `,
    queryParamsWithIndex,
  ).then(formatFunnelResults(steps));
}

async function clickhouseGetFunnel(
  projectId: string,
  parameters: FunnelParameters,
  filters: QueryFilters,
): Promise<any[]> {
  const { startDate, endDate, window, steps } = parameters;
  const { rawQuery, parseFilters } = tinybird.enabled ? tinybird : clickhouse;
  const { levelOneQuery, levelQuery, sumQuery, stepFilterQuery, params } = getFunnelQuery(
    steps,
    window,
  );
  const { filterQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
    startDate,
    endDate,
  });

  function getFunnelQuery(
    steps: { type: string; value: string }[],
    window: number,
  ) {
    return steps.reduce(
      (pv, cv, i) => {
        const levelNumber = i + 1;
        const startSum = i > 0 ? 'union all ' : '';
        const startFilter = i > 0 ? 'or' : '';
        const isURL = cv.type === 'path';
        const column = isURL ? 'url_path' : 'event_name';

        let operator = '=';
        let paramValue = cv.value;

        if (cv.value.startsWith('*') || cv.value.endsWith('*')) {
          operator = 'like';
          paramValue = cv.value.replace(/^\*|\*$/g, '%');
        }

        if (levelNumber === 1) {
          pv.levelOneQuery = `\n
          level1 AS (
            select *
            from level0
            where ${column} ${operator} {param${i}:String}
          )`;
        } else {
          pv.levelQuery += `\n
          , level${levelNumber} AS (
            select distinct y.session_id as session_id,
                y.url_path as url_path,
                y.referrer_path as referrer_path,
                y.event_name,
                y.created_at as created_at
            from level${i} x
            join level0 y
            on x.session_id = y.session_id
            where y.created_at between x.created_at and x.created_at + interval ${window} minute
                and y.${column} ${operator} {param${i}:String}
          )`;
        }

        pv.sumQuery += `\n${startSum}select ${levelNumber} as level, uniq(session_id) as count from level${levelNumber}`;
        pv.stepFilterQuery += `${startFilter} ${column} ${operator} {param${i}:String} `;
        pv.params[`param${i}`] = paramValue;

        return pv;
      },
      {
        levelOneQuery: '',
        levelQuery: '',
        sumQuery: '',
        stepFilterQuery: '',
        params: {} as Record<string, string>,
      },
    );
  }

  return rawQuery(
    `
    WITH level0 AS (
      select distinct session_id, url_path, referrer_path, event_name, created_at
      from project_event
      ${cohortQuery}
      where (${stepFilterQuery})
        and project_id = {projectId:String}
        and created_at between {startDate:DateTime64} and {endDate:DateTime64}
       ${filterQuery}
    ),
    ${levelOneQuery}
    ${levelQuery}
    select *
    from (
      ${sumQuery} 
    ) as result ORDER BY level;
    `,
    {
      ...params,
      ...queryParams,
    },
  ).then(formatFunnelResults(steps));
}

const formatFunnelResults = (steps: { type: string; value: string }[]) => (results: any) => {
  return steps.map((step, i) => {
    const visitors = Number(results[i]?.count) || 0;
    const previous = Number(results[i - 1]?.count) || 0;
    const dropped = previous > 0 ? previous - visitors : 0;
    const dropoff = 1 - visitors / previous;
    const remaining = visitors / Number(results[0]?.count || 1);

    return {
      ...step,
      visitors,
      previous,
      dropped,
      dropoff,
      remaining,
    };
  });
};

// ==========================================
// 4. getGoal
// ==========================================
export interface GoalParameters {
  startDate: Date;
  endDate: Date;
  type: string;
  value: string;
  operator?: string;
  property?: string;
}

export async function getGoal(
  ...args: [projectId: string, params: GoalParameters, filters: QueryFilters]
) {
  return runQuery({
    [DRIZZLE]: () => relationalGetGoal(...args),
    [CLICKHOUSE]: () => clickhouseGetGoal(...args),
  });
}

async function relationalGetGoal(
  projectId: string,
  parameters: GoalParameters,
  filters: QueryFilters,
) {
  const { startDate, endDate, type, value } = parameters;
  const { rawQuery, parseFilters } = drizzle;
  const eventType = type === 'path' ? EVENT_TYPE.pageView : EVENT_TYPE.customEvent;
  const column = type === 'path' ? 'url_path' : 'event_name';
  const { filterQuery, dateQuery, joinVisitorQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
    value,
    startDate,
    endDate,
    eventType,
  });

  return rawQuery(
    `
    select count(distinct project_event.session_id) as num,
    (
      select count(distinct project_event.session_id)
      from project_event
      ${cohortQuery}
      ${joinVisitorQuery}
      where project_event.project_id = {{projectId::String}}
      ${dateQuery}
      ${filterQuery}
    ) as total
    from project_event
    ${cohortQuery}
    ${joinVisitorQuery}
    where project_event.project_id = {{projectId::String}}
      and ${column} = {{value}}
      ${dateQuery}
      ${filterQuery}
    `,
    queryParams,
  ).then(results => results?.[0]);
}

async function clickhouseGetGoal(
  projectId: string,
  parameters: GoalParameters,
  filters: QueryFilters,
) {
  const { startDate, endDate, type, value } = parameters;
  const { rawQuery, parseFilters } = tinybird.enabled ? tinybird : clickhouse;
  const eventType = type === 'path' ? EVENT_TYPE.pageView : EVENT_TYPE.customEvent;
  const column = type === 'path' ? 'url_path' : 'event_name';
  const { filterQuery, dateQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
    value,
    startDate,
    endDate,
    eventType,
  });

  return rawQuery(
    `
    select count(distinct session_id) as num,
    (
      select count(distinct session_id)
      from project_event
      ${cohortQuery}
      where project_id = {projectId:String}
        ${dateQuery}
        ${filterQuery}
    ) as total
    from project_event
    ${cohortQuery}
    where project_id = {projectId:String}
      and ${column} = {value:String}
      ${dateQuery}
      ${filterQuery}
    `,
    queryParams,
  ).then(results => results?.[0]);
}

// ==========================================
// 5. getJourney
// ==========================================
export interface JourneyParameters {
  startDate: Date;
  endDate: Date;
  steps: number;
  startStep?: string;
  endStep?: string;
}

export interface JourneyResult {
  e1: string;
  e2: string;
  e3: string;
  e4: string;
  e5: string;
  e6: string;
  e7: string;
  count: number;
}

export async function getJourney(
  ...args: [projectId: string, parameters: JourneyParameters, filters: QueryFilters]
) {
  return runQuery({
    [DRIZZLE]: () => relationalGetJourney(...args),
    [CLICKHOUSE]: () => clickhouseGetJourney(...args),
  });
}

async function relationalGetJourney(
  projectId: string,
  parameters: JourneyParameters,
  filters: QueryFilters,
): Promise<JourneyResult[]> {
  const { startDate, endDate, steps, startStep, endStep } = parameters;
  const { rawQuery, parseFilters } = drizzle;
  const { sequenceQuery, startStepQuery, endStepQuery, params } = getJourneyQuery(
    steps,
    startStep,
    endStep,
  );
  const { filterQuery, joinVisitorQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
    startDate,
    endDate,
  });

  function getJourneyQuery(
    steps: number,
    startStep?: string,
    endStep?: string,
  ) {
    const params: Record<string, string> = {};
    let sequenceQuery = '';
    let startStepQuery = '';
    let endStepQuery = '';

    let selectQuery = '';
    let maxQuery = '';
    let groupByQuery = '';

    for (let i = 1; i <= steps; i++) {
      const endQuery = i < steps ? ',' : '';
      selectQuery += `s.e${i},`;
      maxQuery += `\nmax(CASE WHEN event_number = ${i} THEN event ELSE NULL END) AS e${i}${endQuery}`;
      groupByQuery += `s.e${i}${endQuery} `;
    }

    sequenceQuery = `\nsequences as (
          select ${selectQuery}
          count(*) count
      FROM (
        select session_id,
            ${maxQuery}
        FROM events
        group by session_id) s
      group by ${groupByQuery})
    `;

    if (startStep) {
      startStepQuery = `and e1 = {{startStep}}`;
      params.startStep = startStep;
    }

    if (endStep) {
      for (let i = 1; i < steps; i++) {
        const startQuery = i === 1 ? 'and (' : '\nor ';
        endStepQuery += `${startQuery}(e${i} = {{endStep}} and e${i + 1} is null) `;
      }
      endStepQuery += `\nor (e${steps} = {{endStep}}))`;
      params.endStep = endStep;
    }

    return {
      sequenceQuery,
      startStepQuery,
      endStepQuery,
      params,
    };
  }

  return rawQuery(
    `
    WITH events AS (
      select distinct
          project_event.session_id,
          project_event.referrer_path,
          coalesce(nullIf(project_event.event_name, ''), project_event.url_path) AS event,
          row_number() OVER (PARTITION BY session_id ORDER BY project_event.created_at) AS event_number
      from project_event
      ${cohortQuery}
      ${joinVisitorQuery}
      where project_event.project_id = {{projectId::String}}
        and project_event.created_at between {{startDate}} and {{endDate}}
        ${filterQuery}),
    ${sequenceQuery}
    select *
    from sequences
    where 1 = 1
    ${startStepQuery}
    ${endStepQuery}
    order by count desc
    limit 100
    `,
    {
      ...params,
      ...queryParams,
    },
  ).then(parseJourneyResult);
}

async function clickhouseGetJourney(
  projectId: string,
  parameters: JourneyParameters,
  filters: QueryFilters,
): Promise<any[]> {
  const { startDate, endDate, steps, startStep, endStep } = parameters;
  const { rawQuery, parseFilters } = tinybird.enabled ? tinybird : clickhouse;
  const { sequenceQuery, startStepQuery, endStepQuery, params } = getJourneyQuery(
    steps,
    startStep,
    endStep,
  );
  const { filterQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
    startDate,
    endDate,
  });

  function getJourneyQuery(
    steps: number,
    startStep?: string,
    endStep?: string,
  ) {
    const params: Record<string, string> = {};
    let sequenceQuery = '';
    let startStepQuery = '';
    let endStepQuery = '';

    let selectQuery = '';
    let maxQuery = '';
    let groupByQuery = '';

    for (let i = 1; i <= steps; i++) {
      const endQuery = i < steps ? ',' : '';
      selectQuery += `s.e${i},`;
      maxQuery += `\nmax(CASE WHEN event_number = ${i} THEN event ELSE NULL END) AS e${i}${endQuery}`;
      groupByQuery += `s.e${i}${endQuery} `;
    }

    sequenceQuery = `\nsequences as (
          select ${selectQuery}
          count(*) count
      FROM (
        select session_id,
            ${maxQuery}
        FROM events
        group by session_id) s
      group by ${groupByQuery})
    `;

    if (startStep) {
      startStepQuery = `and e1 = {startStep:String}`;
      params.startStep = startStep;
    }

    if (endStep) {
      for (let i = 1; i < steps; i++) {
        const startQuery = i === 1 ? 'and (' : '\nor ';
        endStepQuery += `${startQuery}(e${i} = {endStep:String} and e${i + 1} is null) `;
      }
      endStepQuery += `\nor (e${steps} = {endStep:String}))`;
      params.endStep = endStep;
    }

    return {
      sequenceQuery,
      startStepQuery,
      endStepQuery,
      params,
    };
  }

  return rawQuery(
    `
    WITH events AS (
      select distinct
          session_id,
          coalesce(nullIf(event_name, ''), url_path) AS event,
          row_number() OVER (PARTITION BY session_id ORDER BY created_at) AS event_number
      from project_event
      ${cohortQuery}
      where project_id = {projectId:String}
        ${filterQuery}
        and created_at between {startDate:DateTime64} and {endDate:DateTime64}),
    ${sequenceQuery}
    select *
    from sequences
    where 1 = 1
    ${startStepQuery}
    ${endStepQuery}
    order by count desc
    limit 100
    `,
    {
      ...params,
      ...queryParams,
    },
  ).then(parseJourneyResult);
}

function combineSequentialDuplicates(array: any) {
  if (array.length === 0) return array;
  const result = [array[0]];
  for (let i = 1; i < array.length; i++) {
    if (array[i] !== array[i - 1]) {
      result.push(array[i]);
    }
  }
  return result;
}

function parseJourneyResult(data: any) {
  return data.map(({ e1, e2, e3, e4, e5, e6, e7, count }: any) => ({
    items: combineSequentialDuplicates([e1, e2, e3, e4, e5, e6, e7]),
    count: +Number(count),
  }));
}

// ==========================================
// 6. getRetention
// ==========================================
export interface RetentionParameters {
  startDate: Date;
  endDate: Date;
  timezone?: string;
}

export interface RetentionResult {
  date: string;
  day: number;
  visitors: number;
  returnVisitors: number;
  percentage: number;
}

export async function getRetention(
  ...args: [projectId: string, parameters: RetentionParameters, filters: QueryFilters]
) {
  return runQuery({
    [DRIZZLE]: () => relationalGetRetention(...args),
    [CLICKHOUSE]: () => clickhouseGetRetention(...args),
  });
}

async function relationalGetRetention(
  projectId: string,
  parameters: RetentionParameters,
  filters: QueryFilters,
): Promise<RetentionResult[]> {
  const { startDate, endDate, timezone } = parameters;
  const { getDateSQL, getDayDiffQuery, getCastColumnQuery, rawQuery, parseFilters } = drizzle;
  const unit = 'day';

  const { filterQuery, joinVisitorQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
    startDate,
    endDate,
    timezone,
  });

  return rawQuery(
    `
    WITH cohort_items AS (
      select
        min(${getDateSQL('project_event.created_at', unit, timezone)}) as cohort_date,
        project_event.session_id
      from project_event
      ${cohortQuery}
      ${joinVisitorQuery}
      where project_event.project_id = {{projectId::String}}
        and project_event.created_at between {{startDate}} and {{endDate}}
        ${filterQuery}
      group by project_event.session_id
    ),
    user_activities AS (
      select distinct
        project_event.session_id,
        ${getDayDiffQuery(getDateSQL('created_at', unit, timezone), 'cohort_items.cohort_date')} as day_number
      from project_event
      join cohort_items
      on project_event.session_id = cohort_items.session_id
      where project_id = {{projectId::String}}
          and created_at between {{startDate}} and {{endDate}}
          
      ),
    cohort_size as (
      select cohort_date,
        count(*) as visitors
      from cohort_items
      group by 1
      order by 1
    ),
    cohort_date as (
      select
        c.cohort_date,
        a.day_number,
        count(*) as visitors
      from user_activities a
      join cohort_items c
      on a.session_id = c.session_id
      group by 1, 2
    )
    select
      c.cohort_date as date,
      c.day_number as day,
      s.visitors,
      c.visitors as "returnVisitors",
      ${getCastColumnQuery('c.visitors', 'float')} * 100 / s.visitors  as percentage
    from cohort_date c
    join cohort_size s
    on c.cohort_date = s.cohort_date
    where c.day_number <= 31
    order by 1, 2`,
    queryParams,
  );
}

async function clickhouseGetRetention(
  projectId: string,
  parameters: RetentionParameters,
  filters: QueryFilters,
): Promise<RetentionResult[]> {
  const { startDate, endDate, timezone } = parameters;
  const { getDateSQL, rawQuery, parseFilters } = tinybird.enabled ? tinybird : clickhouse;
  const unit = 'day';

  const { filterQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
    startDate,
    endDate,
    timezone,
  });

  return rawQuery(
    `
    WITH cohort_items AS (
      select
        min(${getDateSQL('created_at', unit, timezone)}) as cohort_date,
        session_id
      from project_event
      ${cohortQuery}
      where project_id = {projectId:String}
        and created_at between {startDate:DateTime64} and {endDate:DateTime64}
        ${filterQuery}
      group by session_id
    ),
    user_activities AS (
      select distinct
        project_event.session_id,
        toInt32((${getDateSQL('created_at', unit, timezone)} - cohort_items.cohort_date) / 86400) as day_number
      from project_event
      join cohort_items
      on project_event.session_id = cohort_items.session_id
      where project_id = {projectId:String}
        and created_at between {startDate:DateTime64} and {endDate:DateTime64}
    ),
    cohort_size as (
      select cohort_date,
        count(*) as visitors
      from cohort_items
      group by 1
      order by 1
    ),
    cohort_date as (
      select
        c.cohort_date,
        a.day_number,
        count(*) as visitors
      from user_activities a
      join cohort_items c
      on a.session_id = c.session_id
      group by 1, 2
    )
    select
      c.cohort_date as date,
      c.day_number as day,
      s.visitors as visitors,
      c.visitors returnVisitors,
      c.visitors * 100 / s.visitors as percentage
    from cohort_date c
    join cohort_size s
    on c.cohort_date = s.cohort_date
    where c.day_number <= 31
    order by 1, 2`,
    queryParams,
  );
}

// ==========================================
// 9. getRevenue
// ==========================================
export interface RevenuParameters {
  startDate: Date;
  endDate: Date;
  unit: string;
  timezone: string;
  currency: string;
  compare?: string;
}

export interface RevenueResult {
  chart: { x: string; t: string; y: number }[];
}

export async function getRevenue(
  ...args: [projectId: string, parameters: RevenuParameters, filters: QueryFilters]
) {
  return runQuery({
    [DRIZZLE]: () => relationalGetRevenue(...args),
    [CLICKHOUSE]: () => clickhouseGetRevenue(...args),
  });
}

async function relationalGetRevenue(
  projectId: string,
  parameters: RevenuParameters,
  filters: QueryFilters,
): Promise<RevenueResult> {
  const { startDate, endDate, unit = 'day', timezone = 'UTC', currency } = parameters;
  const { getDateSQL, rawQuery, parseFilters } = drizzle;
  const { queryParams, filterQuery, cohortQuery, joinVisitorQuery } = parseFilters({
    ...filters,
    projectId,
    startDate,
    endDate,
    currency,
  });

  const joinQuery = filterQuery
    ? `join project_event
      on project_event.project_id = revenue.project_id
        and project_event.visitor_id = revenue.visitor_id
        and project_event.event_id = revenue.event_id
        and project_event.project_id = {{projectId::String}}
        and project_event.created_at between {{startDate}} and {{endDate}}`
    : '';

  const chart = await rawQuery(
    `
    select
      revenue.event_name x,
      ${getDateSQL('revenue.created_at', unit, timezone)} t,
      sum(revenue.revenue) y,
      count(revenue.event_id) count
    from revenue
    ${joinQuery}
    ${cohortQuery}
    ${joinVisitorQuery}
    where revenue.project_id = {{projectId::String}}
      and revenue.created_at between {{startDate}} and {{endDate}}
      and upper(revenue.currency) = upper({{currency}})
      ${filterQuery}
    group by  x, t
    order by t
    `,
    queryParams,
  );

  return { chart };
}

async function clickhouseGetRevenue(
  projectId: string,
  parameters: RevenuParameters,
  filters: QueryFilters,
): Promise<RevenueResult> {
  const { startDate, endDate, unit = 'day', timezone = 'UTC', currency } = parameters;
  const { getDateSQL, rawQuery, parseFilters } = tinybird.enabled ? tinybird : clickhouse;
  const { filterQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
    startDate,
    endDate,
    currency,
  });

  const joinQuery = filterQuery
    ? `join project_event
   on project_event.project_id = project_revenue.project_id
    and project_event.visitor_id = project_revenue.visitor_id
    and project_event.event_id = project_revenue.event_id
    and project_event.project_id = {projectId:String}
    and project_event.created_at between {startDate:DateTime64} and {endDate:DateTime64}`
    : '';

  const chart = await rawQuery<any>(
    `
    select
      project_revenue.event_name x,
      ${getDateSQL('project_revenue.created_at', unit, timezone)} t,
      sum(project_revenue.revenue) y,
      count(project_revenue.event_id) count
    from project_revenue
    ${joinQuery}
    ${cohortQuery}
    where project_revenue.project_id = {projectId:String}
      and project_revenue.created_at between {startDate:DateTime64} and {endDate:DateTime64}
      and upper(project_revenue.currency) = upper({currency:String})
      ${filterQuery}
    group by  x, t
    order by t
    `,
    queryParams,
  );

  return { chart };
}

// ==========================================
// 10. getRevenueMetrics
// ==========================================
export interface RevenueMetricsResult {
  country: { name: string; value: number }[];
  region: { name: string; value: number; country: string }[];
  referrer: { name: string; value: number }[];
  channel: { name: string; value: number }[];
}

export async function getRevenueMetrics(
  ...args: [projectId: string, parameters: RevenuParameters, filters: QueryFilters]
) {
  return runQuery({
    [DRIZZLE]: () => relationalGetRevenueMetrics(...args),
    [CLICKHOUSE]: () => clickhouseGetRevenueMetrics(...args),
  });
}

async function relationalGetRevenueMetrics(
  projectId: string,
  parameters: RevenuParameters,
  filters: QueryFilters,
): Promise<RevenueMetricsResult> {
  const { startDate, endDate, currency } = parameters;
  const { rawQuery, parseFilters } = drizzle;
  const { queryParams, filterQuery, cohortQuery } = parseFilters({
    ...filters,
    projectId,
    startDate,
    endDate,
    currency,
  });

  const joinQuery = filterQuery
    ? `join project_event
       on project_event.project_id = revenue.project_id
         and project_event.visitor_id = revenue.visitor_id
         and project_event.event_id = revenue.event_id
         and project_event.project_id = {{projectId::String}}
         and project_event.created_at between {{startDate}} and {{endDate}}`
    : '';

  const country = await rawQuery(
    `
    select
      visitor.country as "name",
      sum(revenue) as "value"
    from revenue
    ${joinQuery}
    join visitor
      on visitor.project_id = revenue.project_id
        and visitor.visitor_id = revenue.visitor_id
    ${cohortQuery}
    where revenue.project_id = {{projectId::String}}
      and revenue.created_at between {{startDate}} and {{endDate}}
      and upper(revenue.currency) = upper({{currency}})
      ${filterQuery}
    group by visitor.country
    order by value desc
    `,
    queryParams,
  );

  const region = await rawQuery(
    `
    select
      visitor.country,
      visitor.region as "name",
      sum(revenue.revenue) as "value"
    from revenue
    ${joinQuery}
    join visitor
      on visitor.project_id = revenue.project_id
        and visitor.visitor_id = revenue.visitor_id
    ${cohortQuery}
    where revenue.project_id = {{projectId::String}}
      and revenue.created_at between {{startDate}} and {{endDate}}
      and upper(revenue.currency) = upper({{currency}})
      ${filterQuery}
    group by visitor.country, visitor.region
    order by value desc
    `,
    queryParams,
  );

  const referrer = await rawQuery(
    `
    WITH events AS (
      select
        revenue.project_id,
        revenue.session_id,
        sum(revenue.revenue) as "value"
      from revenue
      ${joinQuery}
      ${cohortQuery}
      where revenue.project_id = {{projectId::String}}
        and revenue.created_at between {{startDate}} and {{endDate}}
        and upper(revenue.currency) = upper({{currency}})
        ${filterQuery}
      group by revenue.project_id, revenue.session_id),

    revenue_data AS (
      select
        e.project_id,
        e.session_id,
        e.value,
        we.min_date as created_at
      from events e
      join (
        select session_id, min(created_at) as min_date
        from project_event
        where project_id = {{projectId::String}}
          and created_at between {{startDate}} and {{endDate}}
        group by session_id
      ) we on we.session_id = e.session_id)

    select
      we.referrer_domain as "name",
      sum(revenue_data.value) as "value"
    from revenue_data
    join (
      select project_id, session_id, referrer_domain, created_at
      from project_event
      where project_id = {{projectId::String}}
        and created_at between {{startDate}} and {{endDate}}) we
    on we.project_id = revenue_data.project_id
      and we.session_id = revenue_data.session_id
      and we.created_at = revenue_data.created_at
    group by we.referrer_domain
    order by value desc
    `,
    queryParams,
  );

  const channel = await rawQuery(
    `
    WITH events AS (
      select
        revenue.project_id,
        revenue.session_id,
        sum(revenue.revenue) as "value"
      from revenue
      ${joinQuery}
      ${cohortQuery}
      where revenue.project_id = {{projectId::String}}
        and revenue.created_at between {{startDate}} and {{endDate}}
        and upper(revenue.currency) = upper({{currency}})
        ${filterQuery}
      group by revenue.project_id, revenue.session_id),

    revenue_data AS (
      select
        e.project_id,
        e.session_id,
        e.value,
        we.min_date as created_at
      from events e
      join (
        select session_id, min(created_at) as min_date
        from project_event
        where project_id = {{projectId::String}}
          and created_at between {{startDate}} and {{endDate}}
        group by session_id
      ) we on we.session_id = e.session_id),

    revenue_prefix AS (
      select
        case when we.utm_medium ilike '%cp%' OR
              we.utm_medium ilike '%ppc%' OR
              we.utm_medium ilike '%retargeting%' OR
              we.utm_medium ilike '%paid%' then 'paid' else 'organic' end AS prefix,
        we.referrer_domain,
        we.url_query,
        we.utm_medium,
        we.utm_source,
        we.hostname,
        r.value
      from revenue_data r
      join (
        select project_id, session_id, referrer_domain, url_query, utm_medium, utm_source, hostname, created_at
        from project_event
        where project_id = {{projectId::String}}
          and created_at between {{startDate}} and {{endDate}}) we
      on we.project_id = r.project_id
        and we.session_id = r.session_id
        and we.created_at = r.created_at),

    channels AS (
      select
        case
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
          when referrer_domain != regexp_replace(hostname, '^www.', '') and referrer_domain != '' then 'referral'
          else 'Unknown' end AS "name",
        value
      from revenue_prefix)

    select name, sum(value) as value
    from channels
    group by name
    order by value desc
    `,
    queryParams,
  );

  return { country, region, referrer, channel };
}

async function clickhouseGetRevenueMetrics(
  projectId: string,
  parameters: RevenuParameters,
  filters: QueryFilters,
): Promise<RevenueMetricsResult> {
  const { startDate, endDate, currency } = parameters;
  const { rawQuery, parseFilters } = tinybird.enabled ? tinybird : clickhouse;
  const { filterQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
    startDate,
    endDate,
    currency,
  });

  const hasFilters =
    Object.keys(filters).filter(k => k !== 'startDate' && k !== 'endDate' && k !== 'currency')
      .length > 0;

  const joinQuery = filterQuery
    ? `join project_event
       on project_event.project_id = project_revenue.project_id
         and project_event.session_id = project_revenue.session_id
         and project_event.event_id = project_revenue.event_id
         and project_event.project_id = {projectId:String}
         and project_event.created_at between {startDate:DateTime64} and {endDate:DateTime64}`
    : '';

  let sqlCountry = '';
  let sqlRegion = '';
  let sqlReferrer = '';
  let sqlChannel = '';

  if (hasFilters) {
    sqlCountry = `
      select
        project_event.country as "name",
        sum(project_revenue.revenue) as "value"
      from project_revenue
      join project_event
      on project_event.project_id = project_revenue.project_id
        and project_event.session_id = project_revenue.session_id
        and project_event.event_id = project_revenue.event_id
        and project_event.project_id = {projectId:String}
        and project_event.created_at between {startDate:DateTime64} and {endDate:DateTime64}
      ${cohortQuery}
      where project_revenue.project_id = {projectId:String}
        and project_revenue.created_at between {startDate:DateTime64} and {endDate:DateTime64}
        and upper(project_revenue.currency) = upper({currency:String})
        ${filterQuery}
      group by project_event.country
      order by value desc
    `;

    sqlRegion = `
      select
        project_event.country,
        project_event.region as "name",
        sum(project_revenue.revenue) as "value"
      from project_revenue
      join project_event
      on project_event.project_id = project_revenue.project_id
        and project_event.session_id = project_revenue.session_id
        and project_event.event_id = project_revenue.event_id
        and project_event.project_id = {projectId:String}
        and project_event.created_at between {startDate:DateTime64} and {endDate:DateTime64}
      ${cohortQuery}
      where project_revenue.project_id = {projectId:String}
        and project_revenue.created_at between {startDate:DateTime64} and {endDate:DateTime64}
        and upper(project_revenue.currency) = upper({currency:String})
        ${filterQuery}
      group by 1,2
      order by value desc
    `;

    sqlReferrer = `
      WITH events AS (
      select distinct
          project_id,
          session_id,
          sum(revenue) as "value"
      from project_revenue
      ${joinQuery}
      ${cohortQuery}
      where project_id = {projectId:String}
        and created_at between {startDate:DateTime64} and {endDate:DateTime64}
        and upper(currency) = upper({currency:String})
        ${filterQuery}
      group by 1,2),

      revenue AS (
      select
          e.project_id,
          e.session_id,
          e.value,
          we.min_date as created_at
      from events e
      join (select session_id, min(created_at) min_date
            from project_event
            where project_id = {projectId:String}
              and created_at between {startDate:DateTime64} and {endDate:DateTime64}
            group by 1
          ) we
      on we.session_id = e.session_id)

      select
          project_event.referrer_domain as "name",
          sum(revenue.value) as "value"
      from revenue
      join (
        select project_id, session_id, referrer_domain, created_at
        from project_event
        where project_id = {projectId:String}
        and created_at between {startDate:DateTime64} and {endDate:DateTime64}) project_event
      on project_event.project_id = revenue.project_id
      and project_event.session_id = revenue.session_id
      and project_event.created_at = revenue.created_at
      group by 1
      order by value desc
    `;

    sqlChannel = `
      WITH events AS (
      select distinct
          project_id,
          session_id,
          sum(revenue) as "value"
      from project_revenue
      ${joinQuery}
      ${cohortQuery}
      where project_id = {projectId:String}
        and created_at between {startDate:DateTime64} and {endDate:DateTime64}
        and upper(currency) = upper({currency:String})
        ${filterQuery}
      group by 1,2),

      revenue AS (
      select
          e.project_id,
          e.session_id,
          e.value,
          we.min_date as created_at
      from events e
      join (select session_id, min(created_at) min_date
            from project_event
            where project_id = {projectId:String}
              and created_at between {startDate:DateTime64} and {endDate:DateTime64}
            group by 1
          ) we
      on we.session_id = e.session_id),

      channels AS (
      select
          case when multiSearchAny(lower(utm_medium), ['cp', 'ppc', 'retargeting', 'paid']) != 0 then 'paid' else 'organic' end prefix,
          case
            when referrer_domain = '' and url_query = '' then 'direct'
            when multiSearchAny(lower(url_query), [${toClickHouseStringArray(
      PAID_AD_PARAMS,
    )}]) != 0 then 'paidAds'
            when multiSearchAny(lower(utm_medium), ['referral', 'app','link']) != 0 then 'referral'
            when position(lower(utm_medium), 'affiliate') > 0 then 'affiliate'
            when position(lower(utm_medium), 'sms') > 0 or position(lower(utm_source), 'sms') > 0 then 'sms'
            when multiSearchAny(lower(referrer_domain), [${toClickHouseStringArray(
      SEARCH_DOMAINS,
    )}]) != 0 or position(lower(utm_medium), 'organic') > 0 then concat(prefix, 'Search')
            when multiSearchAny(lower(referrer_domain), [${toClickHouseStringArray(
      SOCIAL_DOMAINS,
    )}]) != 0 then concat(prefix, 'Social')
            when multiSearchAny(lower(referrer_domain), [${toClickHouseStringArray(
      EMAIL_DOMAINS,
    )}]) != 0 or position(lower(utm_medium), 'mail') > 0 then 'email'
            when multiSearchAny(lower(referrer_domain), [${toClickHouseStringArray(
      SHOPPING_DOMAINS,
    )}]) != 0 or position(lower(utm_medium), 'shop') > 0 then concat(prefix, 'Shopping')
            when multiSearchAny(lower(referrer_domain), [${toClickHouseStringArray(
      VIDEO_DOMAINS,
    )}]) != 0 or position(lower(utm_medium), 'video') > 0 then concat(prefix, 'Video')
            when referrer_domain != hostname and referrer_domain != '' then 'referral'
          else 'Unknown' end AS "name",
          sum(revenue.value) as "value"
      from revenue
      join (
        select *
        from project_event
        where project_id = {projectId:String}
        and created_at between {startDate:DateTime64} and {endDate:DateTime64}) project_event
      on project_event.project_id = revenue.project_id
      and project_event.session_id = revenue.session_id
      and project_event.created_at = revenue.created_at
      group by 1, 2)

      select name, sum(value) value
      from channels
      group by 1
      order by value desc
    `;
  } else {
    sqlCountry = `
      select
        ps.country as "name",
        sum(pr.revenue) as "value"
      from project_revenue pr
      join (
          select session_id, argMaxMerge(country) as country
          from project_session_stats
          where project_id = {projectId:String}
          group by session_id
      ) ps on ps.session_id = pr.session_id
      where pr.project_id = {projectId:String}
        and pr.created_at between {startDate:DateTime64} and {endDate:DateTime64}
        and upper(pr.currency) = upper({currency:String})
        ${filterQuery}
      group by name
      order by value desc
    `;

    sqlRegion = `
      select
        ps.region as "name",
        ps.country as "country",
        sum(pr.revenue) as "value"
      from project_revenue pr
      join (
          select session_id, argMaxMerge(region) as region, argMaxMerge(country) as country
          from project_session_stats
          where project_id = {projectId:String}
          group by session_id
      ) ps on ps.session_id = pr.session_id
      where pr.project_id = {projectId:String}
        and pr.created_at between {startDate:DateTime64} and {endDate:DateTime64}
        and upper(pr.currency) = upper({currency:String})
        ${filterQuery}
      group by name, country
      order by value desc
    `;

    sqlReferrer = `
      select
        ps.referrer_domain as "name",
        sum(pr.revenue) as "value"
      from project_revenue pr
      join (
          select session_id, argMinMerge(referrer_domain) as referrer_domain
          from project_session_stats
          where project_id = {projectId:String}
          group by session_id
      ) ps on ps.session_id = pr.session_id
      where pr.project_id = {projectId:String}
        and pr.created_at between {startDate:DateTime64} and {endDate:DateTime64}
        and upper(pr.currency) = upper({currency:String})
        ${filterQuery}
      group by name
      order by value desc
    `;

    sqlChannel = `
      select
        ps.channel as "name",
        sum(pr.revenue) as "value"
      from project_revenue pr
      join (
          select session_id, argMinMerge(channel) as channel
          from project_session_stats
          where project_id = {projectId:String}
          group by session_id
      ) ps on ps.session_id = pr.session_id
      where pr.project_id = {projectId:String}
        and pr.created_at between {startDate:DateTime64} and {endDate:DateTime64}
        and upper(pr.currency) = upper({currency:String})
        ${filterQuery}
      group by name
      order by value desc
    `;
  }

  const country = await rawQuery<any>(sqlCountry, queryParams);
  const region = await rawQuery<any>(sqlRegion, queryParams);
  const referrer = await rawQuery<any>(sqlReferrer, queryParams);
  const channel = await rawQuery<any>(sqlChannel, queryParams);

  return { country, region, referrer, channel };
}

// ==========================================
// 11. getRevenueSessions
// ==========================================
export async function getRevenueSessions(
  ...args: [projectId: string, currency: string, filters: QueryFilters]
) {
  return runQuery({
    [DRIZZLE]: () => relationalGetRevenueSessions(...args),
    [CLICKHOUSE]: () => clickhouseGetRevenueSessions(...args),
  });
}

async function relationalGetRevenueSessions(projectId: string, currency: string, filters: QueryFilters) {
  const { pagedRawQuery, parseFilters } = drizzle;
  const { filterQuery, dateQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
    currency,
  });

  return pagedRawQuery(
    `
    select
      session.session_id as "id",
      session.visitor_id as "visitorId",
      visitor.distinct_id as "distinctId",
      session.project_id as "projectId",
      session.hostname,
      visitor.browser,
      visitor.os,
      visitor.device,
      visitor.screen,
      visitor.language,
      visitor.country,
      visitor.region,
      visitor.city,
      session.created_at as "firstAt",
      session.created_at as "lastAt",
      (select url_path from project_event pe2
        where pe2.session_id = session.session_id and pe2.project_id = session.project_id
          and pe2.event_type = 1
        order by pe2.created_at asc limit 1) as "entryPage",
      (select url_path from project_event pe3
        where pe3.session_id = session.session_id and pe3.project_id = session.project_id
          and pe3.event_type = 1
        order by pe3.created_at desc limit 1) as "exitPage",
      0 as "duration",
      (select count(*) from project_event where session_id = session.session_id and event_type = 1) as "views",
      (select count(*) from project_event where session_id = session.session_id and event_type = 2) as "events",
      revenue_sum.revenue,
      session.created_at as "createdAt"
    from (
      select session_id, sum(revenue) as revenue
      from revenue
      where project_id = {{projectId::String}}
        and upper(currency) = upper({{currency}})
        ${dateQuery.replace(/project_event\.created_at/g, 'revenue.created_at')}
      group by session_id
    ) revenue_sum
    join project_event as session on session.session_id = revenue_sum.session_id and session.project_id = {{projectId::String}}
    join visitor on visitor.visitor_id = session.visitor_id and visitor.project_id = {{projectId::String}}
    where 1 = 1
      ${filterQuery.replace(/project_event\./g, 'session.')}
    group by session.session_id, session.visitor_id, visitor.distinct_id, session.project_id, session.hostname, visitor.browser, visitor.os, visitor.device, visitor.screen, visitor.language, visitor.country, visitor.region, visitor.city, session.created_at, revenue_sum.revenue
    order by revenue_sum.revenue desc
    `,
    queryParams,
    filters,
    'getRevenueSessions',
  );
}

async function clickhouseGetRevenueSessions(projectId: string, currency: string, filters: QueryFilters) {
  const { pagedRawQuery, parseFilters, getDateStringSQL } = tinybird.enabled
    ? tinybird
    : clickhouse;
  const { filterQuery, dateQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
    currency,
  });

  return pagedRawQuery(
    `
    select
      pr.session_id as id,
      pe.visitorId,
      '' as distinctId,
      pr.project_id as projectId,
      pe.hostname,
      pe.browser,
      pe.os,
      pe.device,
      pe.screen,
      pe.language,
      pe.country,
      pe.region,
      pe.city,
      ${getDateStringSQL('pe.firstAt')} as firstAt,
      ${getDateStringSQL('pe.lastAt')} as lastAt,
      pe.entryPage,
      pe.exitPage,
      toUInt32(dateDiff('second', pe.firstAt, pe.lastAt)) as duration,
      pe.views,
      pe.events,
      pr.revenue,
      pe.lastAt as createdAt
    from (
      select session_id, project_id, sum(revenue) as revenue
      from project_revenue
      where project_id = {projectId:String}
        and upper(currency) = upper({currency:String})
        ${dateQuery}
      group by session_id, project_id
    ) pr
    join (
      select session_id, project_id,
        argMax(visitor_id, created_at) as visitorId,
        argMax(hostname, created_at) as hostname,
        argMax(browser, created_at) as browser,
        argMax(os, created_at) as os,
        argMax(device, created_at) as device,
        argMax(screen, created_at) as screen,
        argMax(language, created_at) as language,
        argMax(country, created_at) as country,
        argMax(region, created_at) as region,
        argMax(city, created_at) as city,
        min(created_at) as firstAt,
        max(created_at) as lastAt,
        argMinIf(url_path, created_at, event_type = 1) as entryPage,
        argMaxIf(url_path, created_at, event_type = 1) as exitPage,
        sumIf(1, event_type = 1) as views,
        sumIf(1, event_type = 2) as events
      from project_event
      where project_id = {projectId:String}
        and session_id IN (
          select session_id
          from project_revenue
          where project_id = {projectId:String}
            and upper(currency) = upper({currency:String})
            ${dateQuery}
        )
        ${filterQuery}
      group by session_id, project_id
    ) pe on pe.session_id = pr.session_id and pe.project_id = pr.project_id
    order by pr.revenue desc
    `,
    queryParams,
    filters,
    'getRevenueSessions',
  );
}

// ==========================================
// 12. getRevenueStats
// ==========================================
export interface RevenueStatsResult {
  sum: number;
  count: number;
  average: number;
  unique_count: number;
  arpu: number;
  total_sessions?: number;
}

export async function getRevenueStats(
  ...args: [projectId: string, parameters: RevenuParameters, filters: QueryFilters]
) {
  return runQuery({
    [DRIZZLE]: () => relationalGetRevenueStats(...args),
    [CLICKHOUSE]: () => clickhouseGetRevenueStats(...args),
  });
}

async function relationalGetRevenueStats(
  projectId: string,
  parameters: RevenuParameters,
  filters: QueryFilters,
): Promise<RevenueStatsResult> {
  const { startDate, endDate, currency } = parameters;
  const { rawQuery, parseFilters } = drizzle;
  const { queryParams, filterQuery, cohortQuery, joinVisitorQuery } = parseFilters({
    ...filters,
    projectId,
    startDate,
    endDate,
    currency,
  });

  const joinQuery = filterQuery
    ? `join project_event
       on project_event.project_id = revenue.project_id
         and project_event.visitor_id = revenue.visitor_id
         and project_event.event_id = revenue.event_id
         and project_event.project_id = {{projectId::String}}
         and project_event.created_at between {{startDate}} and {{endDate}}`
    : '';

  const total = await rawQuery(
    `
    select
      sum(revenue.revenue) as sum,
      count(distinct revenue.event_id) as count,
      count(distinct revenue.session_id) as unique_count,
      (select count(distinct session_id)
       from project_event
       where project_id = {{projectId::String}}
         and created_at between {{startDate}} and {{endDate}}) as total_sessions
    from revenue
    ${joinQuery}
    ${cohortQuery}
    ${joinVisitorQuery}
    where revenue.project_id = {{projectId::String}}
      and revenue.created_at between {{startDate}} and {{endDate}}
      and upper(revenue.currency) = upper({{currency}})
      ${filterQuery}
  `,
    queryParams,
  ).then(result => result?.[0] || { sum: 0, count: 0, unique_count: 0, total_sessions: 0 });

  const finalRes = {
    sum: Number(total.sum || 0),
    count: Number(total.count || 0),
    unique_count: Number(total.unique_count || 0),
    total_sessions: Number(total.total_sessions || 0),
    average: 0,
    arpu: 0
  };

  finalRes.average = finalRes.count > 0 ? finalRes.sum / finalRes.count : 0;
  finalRes.arpu = finalRes.total_sessions > 0 ? finalRes.sum / finalRes.total_sessions : 0;

  return finalRes;
}

async function clickhouseGetRevenueStats(
  projectId: string,
  parameters: RevenuParameters,
  filters: QueryFilters,
): Promise<RevenueStatsResult> {
  const { startDate, endDate, currency } = parameters;
  const { rawQuery, parseFilters } = tinybird.enabled ? tinybird : clickhouse;
  const { filterQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
    startDate,
    endDate,
    currency,
  });

  const joinQuery = filterQuery
    ? `join project_event
       on project_event.project_id = project_revenue.project_id
        and project_event.visitor_id = project_revenue.visitor_id
        and project_event.event_id = project_revenue.event_id
        and project_event.project_id = {projectId:String}
        and project_event.created_at between {startDate:DateTime64} and {endDate:DateTime64}`
    : '';

  const total = await rawQuery<any>(
    `
    select
      sum(project_revenue.revenue) as sum,
      uniqExact(project_revenue.event_id) as count,
      uniqExact(project_revenue.session_id) as unique_count,
      (select uniqExact(session_id)
       from project_event
       where project_id = {projectId:String}
         and created_at between {startDate:DateTime64} and {endDate:DateTime64}) as total_sessions
    from project_revenue
    ${joinQuery}
    ${cohortQuery}
    where project_revenue.project_id = {projectId:String}
      and project_revenue.created_at between {startDate:DateTime64} and {endDate:DateTime64}
      and upper(project_revenue.currency) = upper({currency:String})
      ${filterQuery}
    `,
    queryParams,
  ).then(result => result?.[0] || { sum: 0, count: 0, unique_count: 0, total_sessions: 0 });

  const finalRes = {
    sum: Number(total.sum || 0),
    count: Number(total.count || 0),
    unique_count: Number(total.unique_count || 0),
    total_sessions: Number(total.total_sessions || 0),
    average: 0,
    arpu: 0
  };

  finalRes.average = finalRes.count > 0 ? finalRes.sum / finalRes.count : 0;
  finalRes.arpu = finalRes.total_sessions > 0 ? finalRes.sum / finalRes.total_sessions : 0;

  return finalRes;
}

// ==========================================
// 12.5. getRevenueGateways
// ==========================================
export interface RevenueGatewayItem {
  connectionId?: string;
  provider: string;
  name: string;
  revenue: number;
  count: number;
  currency: string;
  percent: number;
  status?: string;
}

const GATEWAY_NAMES: Record<string, string> = {
  stripe: 'Stripe',
  paddle: 'Paddle',
  polar: 'Polar',
  lemonsqueezy: 'Lemon Squeezy',
  custom: 'Direct / Custom',
};

export async function getRevenueGateways(
  ...args: [projectId: string, parameters: RevenuParameters, filters: QueryFilters]
): Promise<RevenueGatewayItem[]> {
  return runQuery({
    [DRIZZLE]: () => relationalGetRevenueGateways(...args),
    [CLICKHOUSE]: () => clickhouseGetRevenueGateways(...args),
  });
}

async function relationalGetRevenueGateways(
  projectId: string,
  parameters: RevenuParameters,
  filters: QueryFilters,
): Promise<RevenueGatewayItem[]> {
  const { startDate, endDate, currency = 'USD' } = parameters;
  const { rawQuery, parseFilters } = drizzle;
  const { queryParams, filterQuery, cohortQuery, joinVisitorQuery } = parseFilters({
    ...filters,
    projectId,
    startDate,
    endDate,
    currency,
  });

  const [connections, revenueRows, paymentEventRows] = await Promise.all([
    rawQuery<any[]>(
      `select id, provider, status from payment_connection where project_id = {{projectId::String}} and status != 'disconnected'`,
      queryParams,
    ).catch(() => []),
    rawQuery<any[]>(
      `
      select
        coalesce(nullif(revenue.provider, ''), 'custom') as "provider",
        revenue.payment_connection_id as "paymentConnectionId",
        sum(revenue.revenue) as "revenue",
        count(revenue.event_id) as "count"
      from revenue
      ${cohortQuery}
      ${joinVisitorQuery}
      where revenue.project_id = {{projectId::String}}
        and revenue.created_at between {{startDate}} and {{endDate}}
        and upper(revenue.currency) = upper({{currency}})
        ${filterQuery}
      group by revenue.provider, revenue.payment_connection_id
      `,
      queryParams,
    ).catch(() => []),
    rawQuery<any[]>(
      `
      select
        pe.payment_connection_id as "paymentConnectionId",
        pc.provider as "provider",
        sum(pe.amount) as "revenue",
        count(pe.id) as "count"
      from payment_event pe
      join payment_connection pc on pc.id = pe.payment_connection_id
      where pe.project_id = {{projectId::String}}
        and pe.created_at between {{startDate}} and {{endDate}}
        and upper(pe.currency) = upper({{currency}})
        and pe.status in ('succeeded', 'paid', 'completed', 'active')
      group by pe.payment_connection_id, pc.provider
      `,
      queryParams,
    ).catch(() => []),
  ]);

  const map = new Map<string, RevenueGatewayItem>();

  for (const conn of connections || []) {
    const key = conn.id || conn.provider;
    map.set(key, {
      connectionId: conn.id,
      provider: conn.provider,
      name: GATEWAY_NAMES[conn.provider] || conn.provider,
      revenue: 0,
      count: 0,
      currency,
      percent: 0,
      status: conn.status,
    });
  }

  for (const row of paymentEventRows || []) {
    const key = row.paymentConnectionId || row.provider;
    const existing = map.get(key) || {
      connectionId: row.paymentConnectionId,
      provider: row.provider,
      name: GATEWAY_NAMES[row.provider] || row.provider,
      revenue: 0,
      count: 0,
      currency,
      percent: 0,
    };
    existing.revenue = Number(row.revenue || 0);
    existing.count = Number(row.count || 0);
    map.set(key, existing);
  }

  for (const row of revenueRows || []) {
    const key = row.paymentConnectionId || row.provider;
    const existing = map.get(key) || {
      connectionId: row.paymentConnectionId,
      provider: row.provider,
      name: GATEWAY_NAMES[row.provider] || row.provider,
      revenue: 0,
      count: 0,
      currency,
      percent: 0,
    };
    const rev = Number(row.revenue || 0);
    const cnt = Number(row.count || 0);
    if (rev > existing.revenue) existing.revenue = rev;
    if (cnt > existing.count) existing.count = cnt;
    map.set(key, existing);
  }

  const items = Array.from(map.values());
  const totalSum = items.reduce((acc, item) => acc + item.revenue, 0);
  for (const item of items) {
    item.percent = totalSum > 0 ? (item.revenue / totalSum) * 100 : 0;
  }

  return items;
}

async function clickhouseGetRevenueGateways(
  projectId: string,
  parameters: RevenuParameters,
  filters: QueryFilters,
): Promise<RevenueGatewayItem[]> {
  const { startDate, endDate, currency = 'USD' } = parameters;
  const { rawQuery, parseFilters } = tinybird.enabled ? tinybird : clickhouse;
  const { filterQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
    startDate,
    endDate,
    currency,
  });

  const rows = await rawQuery<any[]>(
    `
    select
      coalesce(nullif(project_revenue.provider, ''), 'custom') as provider,
      project_revenue.payment_connection_id as paymentConnectionId,
      sum(project_revenue.revenue) as revenue,
      count(project_revenue.event_id) as count
    from project_revenue
    ${cohortQuery}
    where project_revenue.project_id = {projectId:String}
      and project_revenue.created_at between {startDate:DateTime64} and {endDate:DateTime64}
      and upper(project_revenue.currency) = upper({currency:String})
      ${filterQuery}
    group by project_revenue.provider, project_revenue.payment_connection_id
    `,
    queryParams,
  ).catch(() => []);

  const totalSum = (rows || []).reduce((acc, r) => acc + Number(r.revenue || 0), 0);

  return (rows || []).map(r => ({
    connectionId: r.paymentConnectionId || undefined,
    provider: r.provider,
    name: GATEWAY_NAMES[r.provider] || r.provider,
    revenue: Number(r.revenue || 0),
    count: Number(r.count || 0),
    currency,
    percent: totalSum > 0 ? (Number(r.revenue || 0) / totalSum) * 100 : 0,
  }));
}

// ==========================================
// 13. getUTM
// ==========================================
export interface UTMParameters {
  column: string;
  startDate: Date;
  endDate: Date;
}

export async function getUTM(
  ...args: [projectId: string, parameters: UTMParameters, filters: QueryFilters]
) {
  return runQuery({
    [DRIZZLE]: () => relationalGetUTM(...args),
    [CLICKHOUSE]: () => clickhouseGetUTM(...args),
  });
}

async function relationalGetUTM(
  projectId: string,
  parameters: UTMParameters,
  filters: QueryFilters,
) {
  const { column, startDate, endDate } = parameters;
  const { parseFilters, rawQuery } = drizzle;

  const { filterQuery, joinVisitorQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
    startDate,
    endDate,
    eventType: EVENT_TYPE.pageView,
  });

  return rawQuery(
    `
    select project_event.${column} utm, count(*) as views
    from project_event
    ${cohortQuery}
    ${joinVisitorQuery}
    where project_event.project_id = {{projectId::String}}
      and project_event.created_at between {{startDate}} and {{endDate}}
      and coalesce(project_event.${column}, '') != ''
      ${filterQuery}
    group by 1
    order by 2 desc
    `,
    queryParams,
  );
}

async function clickhouseGetUTM(
  projectId: string,
  parameters: UTMParameters,
  filters: QueryFilters,
) {
  const { column, startDate, endDate } = parameters;
  const { parseFilters, rawQuery } = tinybird.enabled ? tinybird : clickhouse;
  const { filterQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
    startDate,
    endDate,
    eventType: EVENT_TYPE.pageView,
  });

  return rawQuery(
    `
    select ${column} utm, count(*) as views
    from project_event
    ${cohortQuery}
    where project_id = {projectId:String}
      and created_at between {startDate:DateTime64} and {endDate:DateTime64}
      and ${column} != ''
      ${filterQuery}
    group by 1
    order by 2 desc
    `,
    queryParams,
  );
}

// ==========================================
// 14. getRevenueUsers & getUnitEconomics (Unit Economics Engine)
// ==========================================
export interface RevenueUserItem {
  userId: string;
  plan?: string;
  revenue: number;
  llmTokens: number;
  llmCost: number;
  grossMargin: number;
  marginPct: number;
  costToServe: number;
  lastActive?: string;
}

export interface UnitEconomicsSummary {
  totalRevenue: number;
  totalLlmCost: number;
  grossMargin: number;
  grossMarginPct: number;
  avgCostToServePerActiveUser: number;
  aiRoiRatio: number;
  unprofitableUserCount: number;
  marginDistribution: Array<{ range: string; count: number }>;
}

export interface PaginatedRevenueUsers {
  data: RevenueUserItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getRevenueUsers(
  projectId: string,
  limit?: number,
  page?: undefined,
): Promise<RevenueUserItem[]>;
export async function getRevenueUsers(
  projectId: string,
  limit: number,
  page: number,
): Promise<PaginatedRevenueUsers>;
export async function getRevenueUsers(
  projectId: string,
  limit: number = 50,
  page?: number,
): Promise<RevenueUserItem[] | PaginatedRevenueUsers> {
  const { getLlmUserBreakdown } = await import('./llm');
  const llmUsersRes = await getLlmUserBreakdown(projectId, 1000);
  const llmUsers = Array.isArray(llmUsersRes) ? llmUsersRes : (llmUsersRes.data ?? []);

  // Query revenue by user from project_revenue / revenue
  const userRevenueMap = new Map<string, number>();

  if (process.env.TINYBIRD_URL || process.env.CLICKHOUSE_URL) {
    const driver = tinybird.enabled ? tinybird : clickhouse;
    try {
      const rows: any = await driver.rawQuery(`
        SELECT
          distinct_id as userId,
          sum(revenue) as totalRevenue
        FROM project_revenue
        WHERE project_id = '${projectId}'
          AND distinct_id != ''
        GROUP BY distinct_id
      `);
      for (const row of rows?.data || rows || []) {
        if (row.userId) {
          userRevenueMap.set(row.userId, Number(row.totalRevenue || 0));
        }
      }
    } catch {
      // Column distinct_id might not exist in older remote Tinybird schemas
    }

    if (userRevenueMap.size === 0) {
      try {
        const rows: any = await driver.rawQuery(`
          SELECT
            pe.distinct_id as userId,
            sum(pr.revenue) as totalRevenue
          FROM project_revenue pr
          JOIN (
            SELECT session_id, any(distinct_id) as distinct_id
            FROM project_event
            WHERE project_id = '${projectId}' AND distinct_id != ''
            GROUP BY session_id
          ) pe ON pe.session_id = pr.session_id
          WHERE pr.project_id = '${projectId}'
          GROUP BY pe.distinct_id
        `);
        for (const row of rows?.data || rows || []) {
          if (row.userId) {
            userRevenueMap.set(row.userId, Number(row.totalRevenue || 0));
          }
        }
      } catch {
        try {
          const rows: any = await driver.rawQuery(`
            SELECT
              pe.distinct_id as userId,
              sum(pr.revenue) as totalRevenue
            FROM project_revenue pr
            JOIN (
              SELECT event_id, any(distinct_id) as distinct_id
              FROM project_event
              WHERE project_id = '${projectId}' AND distinct_id != ''
              GROUP BY event_id
            ) pe ON pe.event_id = pr.event_id
            WHERE pr.project_id = '${projectId}'
            GROUP BY pe.distinct_id
          `);
          for (const row of rows?.data || rows || []) {
            if (row.userId) {
              userRevenueMap.set(row.userId, Number(row.totalRevenue || 0));
            }
          }
        } catch {
          // Ignore
        }
      }
    }
  }

  // Combine LLM user spend and revenue
  const combinedMap = new Map<string, RevenueUserItem>();

  for (const u of llmUsers) {
    const rev = userRevenueMap.get(u.userId) || 0;
    const cost = Number(u.totalCost || 0);
    const grossMargin = rev - cost;
    const marginPct = rev > 0 ? (grossMargin / rev) * 100 : (cost > 0 ? -100 : 0);
    const calls = Number(u.totalCalls || 1);

    combinedMap.set(u.userId, {
      userId: u.userId,
      plan: rev > 200 ? 'Enterprise' : rev > 50 ? 'Scale' : 'Standard',
      revenue: rev,
      llmTokens: Number(u.totalTokens || 0),
      llmCost: cost,
      grossMargin: Number(grossMargin.toFixed(4)),
      marginPct: Number(marginPct.toFixed(1)),
      costToServe: Number((cost / calls).toFixed(4)),
      lastActive: u.lastActive,
    });
  }

  // Also include any revenue users not in LLM list
  userRevenueMap.forEach((rev, userId) => {
    if (!combinedMap.has(userId)) {
      combinedMap.set(userId, {
        userId,
        plan: rev > 200 ? 'Enterprise' : rev > 50 ? 'Scale' : 'Standard',
        revenue: rev,
        llmTokens: 0,
        llmCost: 0,
        grossMargin: rev,
        marginPct: 100,
        costToServe: 0,
      });
    }
  });

  const allUsers = Array.from(combinedMap.values())
    .sort((a, b) => b.revenue - a.revenue || b.llmCost - a.llmCost);

  if (page !== undefined) {
    const total = allUsers.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.max(1, Math.min(page, totalPages));
    const offset = (safePage - 1) * limit;
    const data = allUsers.slice(offset, offset + limit);
    return {
      data,
      total,
      page: safePage,
      limit,
      totalPages,
    };
  }

  return allUsers.slice(0, limit);
}

export async function getUnitEconomics(
  projectId: string,
): Promise<UnitEconomicsSummary> {
  const users = await getRevenueUsers(projectId, 1000);

  const totalRevenue = users.reduce((acc, u) => acc + u.revenue, 0);
  const totalLlmCost = users.reduce((acc, u) => acc + u.llmCost, 0);
  const grossMargin = totalRevenue - totalLlmCost;
  const grossMarginPct =
    totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;
  const activeUserCount = users.filter((u) => u.llmTokens > 0 || u.revenue > 0).length || 1;
  const avgCostToServe = totalLlmCost / activeUserCount;
  const aiRoiRatio = totalLlmCost > 0 ? totalRevenue / totalLlmCost : 0;
  const unprofitableUserCount = users.filter((u) => u.grossMargin < 0).length;

  const distribution = [
    { range: '<0% (Unprofitable)', count: users.filter((u) => u.marginPct < 0).length },
    { range: '0-50%', count: users.filter((u) => u.marginPct >= 0 && u.marginPct < 50).length },
    { range: '50-80%', count: users.filter((u) => u.marginPct >= 50 && u.marginPct < 80).length },
    { range: '>80% (Healthy)', count: users.filter((u) => u.marginPct >= 80).length },
  ];

  return {
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalLlmCost: Number(totalLlmCost.toFixed(4)),
    grossMargin: Number(grossMargin.toFixed(2)),
    grossMarginPct: Number(grossMarginPct.toFixed(1)),
    avgCostToServePerActiveUser: Number(avgCostToServe.toFixed(4)),
    aiRoiRatio: Number(aiRoiRatio.toFixed(2)),
    unprofitableUserCount,
    marginDistribution: distribution,
  };
}

