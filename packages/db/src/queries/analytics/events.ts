import { uuid } from '../../lib/crypto';
import { DATA_TYPE } from '../../lib/analytics/constants';
import { flattenJSON, getStringValue } from '../../lib/analytics/data';
import clickhouse from '../../lib/analytics/clickhouse';
import tinybird from '../../lib/analytics/tinybird';
import kafka from '../../lib/kafka';
import redis from '../../lib/redis';
import { CLICKHOUSE, DRIZZLE, runQuery, notImplemented } from '../../lib/routing';
import drizzle from '../../lib/relational/drizzle';
import type { QueryFilters } from '@vision/shared-types';

export interface SaveEventArgs {
  projectId: string;
  sessionId: string;
  visitorId: string;
  eventType: number;
  createdAt?: Date;

  // Page
  pageTitle?: string;
  hostname?: string;
  urlPath: string;
  urlQuery?: string;
  referrerPath?: string;
  referrerQuery?: string;
  referrerDomain?: string;

  // Session
  distinctId?: string;
  browser?: string;
  os?: string;
  device?: string;
  screen?: string;
  language?: string;
  country?: string;
  region?: string;
  city?: string;
  latitude?: number | null;
  longitude?: number | null;

  // Events
  eventName?: string;
  eventData?: any;
  tag?: string;

  // UTM
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;

  // Click IDs
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
  ttclid?: string;
  lifatid?: string;
  twclid?: string;

  // Performance
  lcp?: number;
  inp?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
}

const URL_LENGTH = 500;
const PAGE_TITLE_LENGTH = 500;
const EVENT_NAME_LENGTH = 50;

export async function saveEvent(args: SaveEventArgs) {
  return clickhouseSaveEvent(args);
}

async function clickhouseSaveEvent(args: SaveEventArgs) {
  const {
    projectId,
    sessionId,
    visitorId,
    eventType,
    createdAt,
    pageTitle,
    hostname,
    urlPath,
    urlQuery,
    referrerPath,
    referrerQuery,
    referrerDomain,
    distinctId,
    browser,
    os,
    device,
    screen,
    language,
    country,
    region,
    city,
    latitude,
    longitude,
    eventName,
    eventData,
    tag,
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
    gclid,
    fbclid,
    msclkid,
    ttclid,
    lifatid,
    twclid,
    lcp,
    inp,
    cls,
    fcp,
    ttfb,
  } = args;

  const { insert, getUTCString } = tinybird.enabled ? tinybird : clickhouse;
  const { sendMessage } = kafka;
  const eventId = uuid();

  const message = {
    project_id: projectId,
    session_id: sessionId,
    visitor_id: visitorId,
    event_id: eventId,
    country: country,
    region: country && region ? (region.includes('-') ? region : `${country}-${region}`) : null,
    city: city,
    latitude: latitude,
    longitude: longitude,
    url_path: urlPath?.substring(0, URL_LENGTH),
    url_query: urlQuery?.substring(0, URL_LENGTH),
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    utm_content: utmContent,
    utm_term: utmTerm,
    referrer_path: referrerPath?.substring(0, URL_LENGTH),
    referrer_query: referrerQuery?.substring(0, URL_LENGTH),
    referrer_domain: referrerDomain?.substring(0, URL_LENGTH),
    page_title: pageTitle?.substring(0, PAGE_TITLE_LENGTH),
    gclid: gclid,
    fbclid: fbclid,
    msclkid: msclkid,
    ttclid: ttclid,
    li_fat_id: lifatid,
    twclid: twclid,
    event_type: eventType,
    event_name: eventName ? eventName?.substring(0, EVENT_NAME_LENGTH) : null,
    tag: tag,
    distinct_id: distinctId,
    created_at: getUTCString(createdAt),
    browser,
    os,
    device,
    screen,
    language,
    hostname,
    lcp,
    inp,
    cls,
    fcp,
    ttfb,
  };

  if (kafka.enabled) {
    await sendMessage('project_event', message);
  } else {
    await insert('project_event', [message]);
  }

  if (eventData) {
    await saveEventData({
      projectId,
      sessionId,
      eventId,
      urlPath: urlPath?.substring(0, URL_LENGTH),
      eventName: eventName?.substring(0, EVENT_NAME_LENGTH),
      eventData,
      createdAt,
    });

    const { revenue, currency } = eventData;

    if (revenue > 0 && currency) {
      await saveRevenue({
        projectId,
        visitorId,
        eventId,
        eventName: eventName?.substring(0, EVENT_NAME_LENGTH),
        currency,
        revenue,
        createdAt,
      });
    }
  }
}

export interface SaveEventDataArgs {
  projectId: string;
  eventId: string;
  sessionId?: string;
  urlPath?: string;
  eventName?: string;
  eventData: any;
  createdAt?: Date;
}

export async function saveEventData(data: SaveEventDataArgs) {
  return clickhouseSaveEventData(data);
}

async function clickhouseSaveEventData(data: SaveEventDataArgs) {
  const { projectId, sessionId, eventId, urlPath, eventName, eventData, createdAt } = data;
  const { insert, getUTCString } = tinybird.enabled ? tinybird : clickhouse;

  const jsonKeys = flattenJSON(eventData);

  const messages = jsonKeys.map(({ key, value, dataType }) => {
    return {
      project_id: projectId,
      session_id: sessionId,
      event_id: eventId,
      url_path: urlPath,
      event_name: eventName,
      data_key: key,
      data_type: dataType,
      string_value: getStringValue(value, dataType),
      number_value: dataType === DATA_TYPE.number ? value : null,
      date_value: dataType === DATA_TYPE.date ? getUTCString(value) : null,
      created_at: getUTCString(createdAt),
    };
  });

  if (messages.length === 0) {
    return;
  }

  if (kafka.enabled) {
    await kafka.sendMessage('event_data', messages);
  } else {
    await insert('event_data', messages);
  }
}

export interface SaveRevenueArgs {
  projectId: string;
  visitorId: string;
  eventId: string;
  eventName: string;
  currency: string;
  revenue: number;
  createdAt: Date;
}

export async function saveRevenue(data: SaveRevenueArgs) {
  return clickhouseSaveRevenue(data);
}

async function clickhouseSaveRevenue(data: SaveRevenueArgs) {
  if (!tinybird.enabled) return;

  const { projectId, visitorId, eventId, eventName, currency, revenue, createdAt } = data;
  const { insert, getUTCString } = tinybird;

  const message = {
    project_id: projectId,
    session_id: visitorId,
    event_id: eventId,
    event_name: eventName,
    currency: currency.toUpperCase(),
    revenue,
    created_at: getUTCString(createdAt),
  };

  if (kafka.enabled) {
    await kafka.sendMessage('project_revenue', message);
  } else {
    await insert('project_revenue', [message]);
  }
}

// ==========================================
// getProjectEvents
// ==========================================
export function getProjectEvents(...args: [projectId: string, filters: QueryFilters]) {
  return runQuery({
    [DRIZZLE]: () => relationalGetProjectEvents(...args),
    [CLICKHOUSE]: () => clickhouseGetProjectEvents(...args),
  });
}

async function relationalGetProjectEvents(projectId: string, filters: QueryFilters) {
  const { pagedRawQuery, parseFilters } = drizzle;
  const { search } = filters;
  const { filterQuery, dateQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
  });

  const searchQuery = search
    ? `and ((event_name ilike {{search}} and event_type = 2)
           or (url_path ilike {{search}} and event_type = 1))`
    : '';

  return pagedRawQuery(
    `
    select
      project_event.event_id as "id",
      project_event.project_id as "projectId", 
      project_event.visitor_id as "visitorId",
      project_event.session_id as "sessionId",
      project_event.created_at as "createdAt",
      project_event.hostname,
      project_event.url_path as "urlPath",
      project_event.url_query as "urlQuery",
      project_event.referrer_path as "referrerPath",
      project_event.referrer_query as "referrerQuery",
      project_event.referrer_domain as "referrerDomain",
      visitor.country as country,
      city as city,
      device as  device,
      os as os,
      browser as browser,
      page_title as "pageTitle",
      project_event.event_type as "eventType",
      project_event.event_name as "eventName",
      event_id IN (select project_event_id 
                   from event_data
                   where project_id = {{projectId::String}}
                      and created_at between {{startDate}} and {{endDate}}) AS "hasData"
    from project_event
    join visitor on visitor.visitor_id = project_event.visitor_id 
      and visitor.project_id = project_event.project_id
    where project_event.project_id = {{projectId::String}}
    ${dateQuery}
    ${filterQuery}
    ${searchQuery}
    order by project_event.created_at desc
    `,
    queryParams,
    filters,
    'getProjectEvents',
  );
}

async function clickhouseGetProjectEvents(projectId: string, filters: QueryFilters) {
  const { pagedRawQuery, parseFilters } = tinybird.enabled ? tinybird : clickhouse;
  const { search } = filters;
  const { queryParams, dateQuery, filterQuery } = parseFilters({
    ...filters,
    projectId,
  });

  const searchQuery = search
    ? `and ((positionCaseInsensitive(event_name, {search:String}) > 0 and event_type = 2)
           or (positionCaseInsensitive(url_path, {search:String}) > 0 and event_type = 1))`
    : '';

  return pagedRawQuery(
    `
    select
      event_id as id,
      project_id as projectId, 
      visitor_id as visitorId,
      session_id as sessionId,
      created_at as createdAt,
      hostname,
      url_path as urlPath,
      url_query as urlQuery,
      referrer_path as referrerPath,
      referrer_query as referrerQuery,
      referrer_domain as referrerDomain,
      country as country,
      city as city,
      device as device,
      os as os,
      browser as browser,
      page_title as pageTitle,
      event_type as eventType,
      event_name as eventName,
      event_id IN (select event_id 
                   from event_data 
                   where project_id = {projectId:String}
                   ${dateQuery}) as hasData
    from project_event
    where project_id = {projectId:String}
    ${dateQuery}
    ${filterQuery}
    ${searchQuery}
    order by created_at desc
    `,
    queryParams,
    filters,
    'getProjectEvents',
  );
}

// ==========================================
// getEventData
// ==========================================
export async function getEventData(
  ...args: [projectId: string, eventId: string]
): Promise<any[]> {
  return runQuery({
    [DRIZZLE]: () => relationalGetEventData(...args),
    [CLICKHOUSE]: () => clickhouseGetEventData(...args),
  });
}

async function relationalGetEventData(projectId: string, eventId: string) {
  const { rawQuery } = drizzle;

  return rawQuery(
    `
    select event_data.project_id as "projectId",
       event_data.project_event_id as "eventId",
       project_event.event_name as "eventName",
       event_data.data_key as "dataKey",
       event_data.string_value as "stringValue",
       event_data.number_value as "numberValue",
       event_data.date_value as "dateValue",
       event_data.data_type as "dataType",
       event_data.created_at as "createdAt"
    from event_data
    join project_event on project_event.event_id = event_data.project_event_id
      and project_event.project_id = {{projectId::String}}
    where event_data.project_id = {{projectId::String}}
      and event_data.project_event_id = {{eventId::uuid}}
    `,
    { projectId, eventId },
    'getEventData',
  );
}

async function clickhouseGetEventData(projectId: string, eventId: string): Promise<any[]> {
  const { rawQuery } = tinybird.enabled ? tinybird : clickhouse;

  return rawQuery(
    `
      select project_id as projectId,
        event_id as eventId,
        event_name as eventName,
        data_key as dataKey,
        string_value as stringValue,
        number_value as numberValue,
        date_value as dateValue,
        data_type as dataType,
        created_at as createdAt
      from event_data
      where project_id = {projectId:String} 
        and event_id = {eventId:String}
    `,
    { projectId, eventId },
    'getEventData',
  );
}

// ==========================================
// getEventDataEvents
// ==========================================
export async function getEventDataEvents(
  ...args: [projectId: string, filters: QueryFilters]
): Promise<any[]> {
  return runQuery({
    [DRIZZLE]: () => relationalGetEventDataEvents(...args),
    [CLICKHOUSE]: () => clickhouseGetEventDataEvents(...args),
  });
}

async function relationalGetEventDataEvents(projectId: string, filters: QueryFilters) {
  const { rawQuery, parseFilters } = drizzle;
  const { event } = filters;
  const { queryParams } = parseFilters({
    ...filters,
    projectId,
  });

  if (event) {
    return rawQuery(
      `
      select
        project_event.event_name as "eventName",
        event_data.data_key as "propertyName",
        event_data.data_type as "dataType",
        event_data.string_value as "propertyValue",
        count(*) as "total"
      from event_data
      inner join project_event
        on project_event.event_id = event_data.project_event_id
      where event_data.project_id = {{projectId::String}}
        and event_data.created_at between {{startDate}} and {{endDate}}
        and project_event.event_name = {{event}}
      group by project_event.event_name, event_data.data_key, event_data.data_type, event_data.string_value
      order by 1 asc, 2 asc, 3 asc, 5 desc
      `,
      queryParams,
      'getEventDataEvents',
    );
  }

  return rawQuery(
    `
    select
      project_event.event_name as "eventName",
      event_data.data_key as "propertyName",
      event_data.data_type as "dataType",
      count(*) as "total"
    from event_data
    inner join project_event
      on project_event.event_id = event_data.project_event_id
    where event_data.project_id = {{projectId::String}}
      and event_data.created_at between {{startDate}} and {{endDate}}
    limit 500
    `,
    queryParams,
    'getEventDataEvents',
  );
}

async function clickhouseGetEventDataEvents(projectId: string, filters: QueryFilters) {
  const { rawQuery, parseFilters } = tinybird.enabled ? tinybird : clickhouse;
  const { event } = filters;
  const { filterQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
  });

  if (event) {
    return rawQuery(
      `
      select
        event_name as eventName,
        data_key as propertyName,
        data_type as dataType,
        string_value as propertyValue,
        count(*) as total
      from event_data
      join project_event
      on project_event.event_id = event_data.event_id
        and project_event.project_id = event_data.project_id
        and project_event.project_id = {projectId:String}
        and project_event.created_at between {startDate:DateTime64} and {endDate:DateTime64}
      ${cohortQuery}
      where event_data.project_id = {projectId:String}
        and event_data.created_at between {startDate:DateTime64} and {endDate:DateTime64}
        and event_data.event_name = {event:String}
      ${filterQuery}
      group by data_key, data_type, string_value, event_name
      order by 1 asc, 2 asc, 3 asc, 5 desc
      limit 500
      `,
      queryParams,
      'getEventDataEvents',
    );
  }

  return rawQuery(
    `
    select
      event_name as eventName,
      data_key as propertyName,
      data_type as dataType,
      count(*) as total
    from event_data
    join project_event
    on project_event.event_id = event_data.event_id
      and project_event.project_id = event_data.project_id
      and project_event.project_id = {projectId:String}
      and project_event.created_at between {startDate:DateTime64} and {endDate:DateTime64}
    ${cohortQuery}
    where event_data.project_id = {projectId:String}
      and event_data.created_at between {startDate:DateTime64} and {endDate:DateTime64}
    ${filterQuery}
    group by data_key, data_type, event_name
    order by 1 asc, 2 asc
    limit 500
    `,
    queryParams,
    'getEventDataEvents',
  );
}

// ==========================================
// getEventDataFields
// ==========================================
export async function getEventDataFields(...args: [projectId: string, filters: QueryFilters]) {
  return runQuery({
    [DRIZZLE]: () => relationalGetEventDataFields(...args),
    [CLICKHOUSE]: () => clickhouseGetEventDataFields(...args),
  });
}

async function relationalGetEventDataFields(projectId: string, filters: QueryFilters) {
  const { rawQuery, parseFilters, getDateSQL } = drizzle;
  const { filterQuery, cohortQuery, joinVisitorQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
  });

  return rawQuery(
    `
    select
      data_key as "propertyName",
      data_type as "dataType",
      case 
        when data_type = 2 then replace(string_value, '.0000', '') 
        when data_type = 4 then ${getDateSQL('date_value', 'hour')} 
        else string_value
      end as "value",
      count(*) as "total"
    from event_data
    join project_event on project_event.event_id = event_data.project_event_id
      and project_event.project_id = {{projectId::String}}
      and project_event.created_at between {{startDate}} and {{endDate}}
    ${cohortQuery}
    ${joinVisitorQuery}
    where event_data.project_id = {{projectId::String}}
      and event_data.created_at between {{startDate}} and {{endDate}}
    ${filterQuery}
    group by data_key, data_type, value
    order by 2 desc
    limit 100
    `,
    queryParams,
    'getEventDataFields',
  );
}

async function clickhouseGetEventDataFields(projectId: string, filters: QueryFilters) {
  const { rawQuery, parseFilters } = tinybird.enabled ? tinybird : clickhouse;
  const { filterQuery, cohortQuery, queryParams } = parseFilters({ ...filters, projectId });

  return rawQuery(
    `
    select
      data_key as propertyName,
      data_type as dataType,
      multiIf(data_type = 2, replaceAll(string_value, '.0000', ''),
              data_type = 4, toString(date_trunc('hour', date_value)),
              string_value) as "value",
      count(*) as "total"
    from event_data
    join project_event
    on project_event.event_id = event_data.event_id
      and project_event.project_id = event_data.project_id
      and project_event.project_id = {projectId:String}
      and project_event.created_at between {startDate:DateTime64} and {endDate:DateTime64}
    ${cohortQuery}
    where event_data.project_id = {projectId:String}
      and event_data.created_at between {startDate:DateTime64} and {endDate:DateTime64}
    ${filterQuery}
    group by data_key, data_type, value
    order by 2 desc
    limit 100
    `,
    queryParams,
    'getEventDataFields',
  );
}

// ==========================================
// getEventDataProperties
// ==========================================
export async function getEventDataProperties(
  ...args: [projectId: string, filters: QueryFilters & { propertyName?: string }]
) {
  return runQuery({
    [DRIZZLE]: () => relationalGetEventDataProperties(...args),
    [CLICKHOUSE]: () => clickhouseGetEventDataProperties(...args),
  });
}

async function relationalGetEventDataProperties(
  projectId: string,
  filters: QueryFilters & { propertyName?: string },
) {
  const { rawQuery, parseFilters } = drizzle;
  const { filterQuery, cohortQuery, joinVisitorQuery, queryParams } = parseFilters(
    { ...filters, projectId },
    {
      columns: { propertyName: 'data_key' },
    },
  );

  return rawQuery(
    `
    select
      project_event.event_name as "eventName",
      event_data.data_key as "propertyName",
      count(*) as "total"
    from event_data 
    join project_event on project_event.event_id = event_data.project_event_id
      and project_event.project_id = {{projectId::String}}
      and project_event.created_at between {{startDate}} and {{endDate}}
    ${cohortQuery}
    ${joinVisitorQuery}
    where event_data.project_id = {{projectId::String}}
      and event_data.created_at between {{startDate}} and {{endDate}}
    ${filterQuery}
    group by project_event.event_name, event_data.data_key
    order by 3 desc
    limit 500
    `,
    queryParams,
    'getEventDataProperties',
  );
}

async function clickhouseGetEventDataProperties(
  projectId: string,
  filters: QueryFilters & { propertyName?: string },
) {
  const { rawQuery, parseFilters } = tinybird.enabled ? tinybird : clickhouse;
  const { filterQuery, cohortQuery, queryParams } = parseFilters(
    { ...filters, projectId },
    {
      columns: { propertyName: 'data_key' },
    },
  );

  return rawQuery(
    `
    select
      event_name as eventName,
      data_key as propertyName,
      count(*) as total
    from event_data
    join project_event
    on project_event.event_id = event_data.event_id
      and project_event.project_id = event_data.project_id
      and project_event.project_id = {projectId:String}
      and project_event.created_at between {startDate:DateTime64} and {endDate:DateTime64}
    ${cohortQuery}
    where event_data.project_id = {projectId:String}
      and event_data.created_at between {startDate:DateTime64} and {endDate:DateTime64}
    ${filterQuery}
    group by event_name, data_key
    order by 1, 3 desc
    limit 500
    `,
    queryParams,
    'getEventDataProperties',
  );
}

// ==========================================
// getEventDataStats
// ==========================================
export async function getEventDataStats(
  ...args: [projectId: string, filters: QueryFilters]
): Promise<{
  events: number;
  properties: number;
  records: number;
}> {
  return runQuery({
    [DRIZZLE]: () => relationalGetEventDataStats(...args),
    [CLICKHOUSE]: () => clickhouseGetEventDataStats(...args),
  }).then(results => results?.[0]);
}

async function relationalGetEventDataStats(projectId: string, filters: QueryFilters) {
  const { rawQuery, parseFilters } = drizzle;
  const { filterQuery, joinVisitorQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
  });

  return rawQuery(
    `
    select 
      count(distinct t.project_event_id) as "events",
      count(distinct t.data_key) as "properties",
      sum(t.total) as "records"
    from (
      select
        project_event_id,
        data_key,
        count(*) as "total"
      from event_data
      join project_event on project_event.event_id = event_data.project_event_id
        and project_event.project_id = {{projectId::String}}
        and project_event.created_at between {{startDate}} and {{endDate}}
      ${cohortQuery}
      ${joinVisitorQuery}
      where event_data.project_id = {{projectId::String}}
        and event_data.created_at between {{startDate}} and {{endDate}}
      ${filterQuery}
      group by project_event_id, data_key
      ) as t
    `,
    queryParams,
    'getEventDataStats',
  );
}

async function clickhouseGetEventDataStats(projectId: string, filters: QueryFilters) {
  const { rawQuery, parseFilters } = tinybird.enabled ? tinybird : clickhouse;
  const { filterQuery, cohortQuery, queryParams } = parseFilters({ ...filters, projectId });

  return rawQuery(
    `
    select 
      count(distinct t.event_id) as "events",
      count(distinct t.data_key) as "properties",
      sum(t.total) as "records"
    from (
      select
        event_id,
        data_key,
        count(*) as "total"
      from event_data
      join project_event
      on project_event.event_id = event_data.event_id
        and project_event.project_id = event_data.project_id
        and project_event.project_id = {projectId:String}
        and project_event.created_at between {startDate:DateTime64} and {endDate:DateTime64}
      ${cohortQuery}
      where event_data.project_id = {projectId:String}
        and event_data.created_at between {startDate:DateTime64} and {endDate:DateTime64}
      ${filterQuery}
      group by event_id, data_key
      ) as t
    `,
    queryParams,
    'getEventDataStats',
  );
}

// ==========================================
// getEventDataValues
// ==========================================
export async function getEventDataValues(
  ...args: [projectId: string, filters: QueryFilters & { propertyName?: string }]
): Promise<any[]> {
  return runQuery({
    [DRIZZLE]: () => relationalGetEventDataValues(...args),
    [CLICKHOUSE]: () => clickhouseGetEventDataValues(...args),
  });
}

async function relationalGetEventDataValues(
  projectId: string,
  filters: QueryFilters & { propertyName?: string },
) {
  const { rawQuery, parseFilters, getDateSQL } = drizzle;
  const { filterQuery, joinVisitorQuery, cohortQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
  });

  return rawQuery(
    `
    select
      case 
        when data_type = 2 then replace(string_value, '.0000', '') 
        when data_type = 4 then ${getDateSQL('date_value', 'hour')} 
        else string_value
      end as "value",
      count(*) as "total"
    from event_data
    join project_event on project_event.event_id = event_data.project_event_id
      and project_event.project_id = {{projectId::String}}
      and project_event.created_at between {{startDate}} and {{endDate}}
    ${cohortQuery}
    ${joinVisitorQuery}
    where event_data.project_id = {{projectId::String}}
      and event_data.created_at between {{startDate}} and {{endDate}}
      and event_data.data_key = {{propertyName}}
    ${filterQuery}
    group by value
    order by 2 desc
    limit 100
    `,
    queryParams,
    'getEventDataValues',
  );
}

async function clickhouseGetEventDataValues(
  projectId: string,
  filters: QueryFilters & { propertyName?: string },
) {
  const { rawQuery, parseFilters } = tinybird.enabled ? tinybird : clickhouse;
  const { filterQuery, cohortQuery, queryParams } = parseFilters({ ...filters, projectId });

  return rawQuery(
    `
    select
      multiIf(data_type = 2, replaceAll(string_value, '.0000', ''),
              data_type = 4, toString(date_trunc('hour', date_value)),
              string_value) as "value",
      count(*) as "total"
    from event_data 
    join project_event
    on project_event.event_id = event_data.event_id
      and project_event.project_id = event_data.project_id
      and project_event.project_id = {projectId:String}
      and project_event.created_at between {startDate:DateTime64} and {endDate:DateTime64}
    ${cohortQuery}
    where event_data.project_id = {projectId:String}
      and event_data.created_at between {startDate:DateTime64} and {endDate:DateTime64}
      and event_data.data_key = {propertyName:String}
      and event_name = {event:String}
    ${filterQuery}
    group by value
    order by 2 desc
    limit 100
    `,
    queryParams,
    'getEventDataValues',
  );
}

// ==========================================
// getEventUsage
// ==========================================
export function getEventUsage(...args: [projectIds: string[], filters: QueryFilters]) {
  return runQuery({
    [DRIZZLE]: notImplemented,
    [CLICKHOUSE]: () => clickhouseGetEventUsage(...args),
  });
}

function clickhouseGetEventUsage(
  projectIds: string[],
  filters: QueryFilters,
): Promise<{ projectId: string; count: number }[]> {
  const { rawQuery } = tinybird.enabled ? tinybird : clickhouse;
  const { startDate, endDate } = filters;

  return rawQuery(
    `
    select 
      project_id as projectId,
      count(*) as count
    from project_event 
    where project_id in {projectIds:Array(UUID)}
      and created_at between {startDate:DateTime64} and {endDate:DateTime64}
    group by project_id
    `,
    {
      projectIds,
      startDate,
      endDate,
    },
    'getEventUsage',
  );
}

// ==========================================
// getEventDataUsage
// ==========================================
export function getEventDataUsage(...args: [projectIds: string[], filters: QueryFilters]) {
  return runQuery({
    [DRIZZLE]: notImplemented,
    [CLICKHOUSE]: () => clickhouseGetEventDataUsage(...args),
  });
}

function clickhouseGetEventDataUsage(
  projectIds: string[],
  filters: QueryFilters,
): Promise<{ projectId: string; count: number }[]> {
  const { rawQuery } = tinybird.enabled ? tinybird : clickhouse;
  const { startDate, endDate } = filters;

  return rawQuery(
    `
    select 
      project_id as projectId,
      count(*) as count
    from event_data 
    where created_at between {startDate:DateTime64} and {endDate:DateTime64}
      and project_id in {projectIds:Array(UUID)}
    group by project_id
    `,
    {
      projectIds,
      startDate,
      endDate,
    },
    'getEventDataUsage',
  );
}
