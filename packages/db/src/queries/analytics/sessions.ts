import clickhouse from '../../lib/analytics/clickhouse';
import { uuid } from '../../lib/crypto';
import { flattenJSON, getStringValue } from '../../lib/analytics/data';
import { CLICKHOUSE, DRIZZLE, runQuery } from '../../lib/routing';
import drizzle from '../../lib/relational/drizzle';
import tinybird from '../../lib/analytics/tinybird';
import kafka from '../../lib/kafka';
import { DATA_TYPE } from '../../lib/analytics/constants';
import type { QueryFilters } from '@vision/shared-types';

export interface SaveVisitorDataArgs {
  projectId: string;
  visitorId: string;
  visitorData: Record<string, any>;
  distinctId?: string;
  createdAt?: Date;
}

export interface UpdateVisitorData {
  visitorId: string;
  projectId: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  avatar?: string | null;
  properties?: Record<string, unknown> | null;
}

export interface VisitorsFilters extends QueryFilters {
  identified?: boolean;
}

export async function createSessionVisitor(_data: any) {
  // No-op: visitor records are no longer stored in PostgreSQL.
  // All visitor metadata is stored in ClickHouse / Tinybird event & visitor_data streams.
}

export async function updateSessionVisitor(data: UpdateVisitorData) {
  const profileData: Record<string, any> = {
    ...(data.firstName ? { first_name: data.firstName } : {}),
    ...(data.lastName ? { last_name: data.lastName } : {}),
    ...(data.email ? { email: data.email } : {}),
    ...(data.avatar ? { avatar: data.avatar } : {}),
    ...(data.properties || {}),
  };

  if (Object.keys(profileData).length > 0) {
    await saveVisitorData({
      projectId: data.projectId,
      visitorId: data.visitorId,
      visitorData: profileData,
    });
  }
}

export interface TransferVisitorEventsArgs {
  projectId: string;
  fromVisitorId: string;
  toVisitorId: string;
  distinctId?: string;
}

export async function transferVisitorEvents(args: TransferVisitorEventsArgs) {
  return runQuery({
    [DRIZZLE]: () => relationalTransferVisitorEvents(args),
    [CLICKHOUSE]: () => clickhouseTransferVisitorEvents(args),
  });
}

async function relationalTransferVisitorEvents({
  projectId,
  fromVisitorId,
  toVisitorId,
  distinctId,
}: TransferVisitorEventsArgs) {
  const { rawQuery } = drizzle;

  // 1. Transfer events from the anonymous visitor to the identified visitor
  await rawQuery(
    `
    update project_event
    set visitor_id = {{toVisitorId::uuid}},
        distinct_id = coalesce({{distinctId}}, distinct_id)
    where project_id = {{projectId::String}}
      and visitor_id = {{fromVisitorId::uuid}}
    `,
    { projectId, fromVisitorId, toVisitorId, distinctId },
    'transferProjectEvents',
  );

  // 2. Transfer session_replay records
  await rawQuery(
    `
    update session_replay
    set visitor_id = {{toVisitorId::String}}
    where project_id = {{projectId::String}}
      and visitor_id = {{fromVisitorId::String}}
    `,
    { projectId, fromVisitorId, toVisitorId },
    'transferSessionReplay',
  );

  // 3. Transfer visitor_data
  await rawQuery(
    `
    update visitor_data
    set visitor_id = {{toVisitorId::uuid}},
        distinct_id = coalesce({{distinctId}}, distinct_id)
    where project_id = {{projectId::String}}
      and visitor_id = {{fromVisitorId::uuid}}
    `,
    { projectId, fromVisitorId, toVisitorId, distinctId },
    'transferVisitorData',
  );

  // 4. Delete the orphaned anonymous visitor record
  await rawQuery(
    `
    delete from visitor
    where project_id = {{projectId::String}}
      and visitor_id = {{fromVisitorId::uuid}}
      and distinct_id is null
    `,
    { projectId, fromVisitorId },
    'deleteAnonymousVisitor',
  );
}

async function clickhouseTransferVisitorEvents({
  projectId,
  fromVisitorId,
  toVisitorId,
  distinctId,
}: TransferVisitorEventsArgs) {
  // In Tinybird / Clickhouse: Save an alias mapping in visitor_data
  await clickhouseSaveVisitorData({
    projectId,
    visitorId: toVisitorId,
    visitorData: {
      $anon_visitor_id: fromVisitorId,
    },
    distinctId,
    createdAt: new Date(),
  });
}

export async function saveVisitorData(data: SaveVisitorDataArgs) {
  return clickhouseSaveVisitorData(data);
}

async function clickhouseSaveVisitorData({
  projectId,
  visitorId,
  visitorData,
  distinctId,
  createdAt,
}: SaveVisitorDataArgs) {
  const { insert, getUTCString } = tinybird.enabled ? tinybird : clickhouse;
  const { sendMessage } = kafka;

  const jsonKeys = flattenJSON(visitorData);

  const messages = jsonKeys.map(({ key, value, dataType }) => {
    return {
      project_id: projectId,
      visitor_id: visitorId,
      data_key: key,
      data_type: dataType,
      string_value: getStringValue(value, dataType),
      number_value: dataType === DATA_TYPE.number ? value : null,
      date_value: dataType === DATA_TYPE.date ? getUTCString(value) : null,
      distinct_id: distinctId,
      created_at: getUTCString(createdAt),
    };
  });

  if (kafka.enabled) {
    await sendMessage('visitor_data', messages);
  } else {
    await insert('visitor_data', messages);
  }
}

export async function getProjectVisitor(projectId: string, visitorId: string) {
  return runQuery({
    [DRIZZLE]: () => relationalGetProjectVisitor(projectId, visitorId),
    [CLICKHOUSE]: () => clickhouseGetProjectVisitor(projectId, visitorId),
  });
}

async function relationalGetProjectVisitor(projectId: string, visitorId: string) {
  const { rawQuery, getTimestampDiffSQL } = drizzle;

  return rawQuery(
    `
    select id,
      distinct_id as "distinctId",
      project_id as "projectId",
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
      first_name as "firstName",
      last_name as "lastName",
      email,
      avatar,
      properties,
      min(min_time) as "firstAt",
      max(max_time) as "lastAt",
      count(distinct session_id) as sessions,
      sum(views) as views,
      sum(events) as events,
      sum(${getTimestampDiffSQL('min_time', 'max_time')}) as "totaltime"
    from (select
          visitor.visitor_id as id,
          visitor.distinct_id,
          project_event.session_id,
          visitor.project_id,
          visitor.browser,
          visitor.os,
          visitor.device,
          visitor.screen,
          visitor.language,
          visitor.country,
          visitor.region,
          visitor.city,
          visitor.latitude,
          visitor.longitude,
          visitor.first_name,
          visitor.last_name,
          visitor.email,
          visitor.avatar,
          visitor.properties,
          min(project_event.created_at) as min_time,
          max(project_event.created_at) as max_time,
          sum(case when project_event.event_type = 1 then 1 else 0 end) as views,
          sum(case when project_event.event_type = 2 then 1 else 0 end) as events
    from visitor
    join project_event on project_event.visitor_id = visitor.visitor_id
    where visitor.project_id = {{projectId::String}}
      and visitor.visitor_id = {{visitorId::uuid}}
    group by visitor.visitor_id, visitor.distinct_id, project_event.session_id, visitor.project_id, visitor.browser, visitor.os, visitor.device, visitor.screen, visitor.language, visitor.country, visitor.region, visitor.city, visitor.latitude, visitor.longitude, visitor.first_name, visitor.last_name, visitor.email, visitor.avatar, visitor.properties) t
    group by id, distinct_id, project_id, browser, os, device, screen, language, country, region, city, latitude, longitude, first_name, last_name, email, avatar, properties;
    `,
    { projectId, visitorId },
    'getProjectVisitor',
  ).then(result => result?.[0]);
}

async function clickhouseGetProjectVisitor(projectId: string, visitorId: string) {
  const { rawQuery, getDateStringSQL } = tinybird.enabled ? tinybird : clickhouse;

  const eventPromise = rawQuery(
    `
    select id,
      projectId,
      any(distinctId) as distinctId,
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
      ${getDateStringSQL('min(min_time)')} as firstAt,
      ${getDateStringSQL('max(max_time)')} as lastAt,
      uniq(session_id) sessions,
      sum(views) as views,
      sum(events) as events,
      sum(max_time-min_time) as totaltime
    from (select
              visitor_id as id,
              session_id,
              any(distinct_id) as distinctId,
              project_id as projectId,
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
              min(created_at) as min_time,
              max(created_at) as max_time,
              sumIf(1, event_type = 1) as views,
              sumIf(1, event_type = 2) as events
        from project_event
        where project_id = {projectId:String}
          and visitor_id = {visitorId:String}
        group by visitor_id, session_id, project_id, browser, os, device, screen, language, country, region, city, latitude, longitude) t
    group by id, projectId, browser, os, device, screen, language, country, region, city, latitude, longitude;
    `,
    { projectId, visitorId },
    'getProjectVisitorEvents',
  ).then((result: any) => result?.[0]);

  const traitsPromise = rawQuery<any[]>(
    `
    select
      data_key,
      argMax(string_value, created_at) as string_value,
      argMax(number_value, created_at) as number_value,
      argMax(date_value, created_at) as date_value,
      argMax(data_type, created_at) as data_type,
      argMax(distinct_id, created_at) as distinct_id
    from visitor_data
    where project_id = {projectId:String}
      and visitor_id = {visitorId:String}
    group by data_key
    `,
    { projectId, visitorId },
    'getProjectVisitorTraits',
  ).catch(() => [] as any[]);

  const [visitor, traits] = await Promise.all([eventPromise, traitsPromise]);
  if (!visitor && (!Array.isArray(traits) || traits.length === 0)) return null;

  const base = visitor || {
    id: visitorId,
    projectId,
    distinctId: '',
    browser: '',
    os: '',
    device: '',
    screen: '',
    language: '',
    country: '',
    region: '',
    city: '',
    firstAt: null,
    lastAt: null,
    sessions: 0,
    views: 0,
    events: 0,
    totaltime: 0,
  };

  const properties: Record<string, any> = {};
  let firstName: string | null = null;
  let lastName: string | null = null;
  let email: string | null = null;
  let avatar: string | null = null;
  let traitDistinctId: string | null = null;

  for (const t of (traits as any[]) || []) {
    const val = t.string_value || t.number_value || t.date_value;
    if (t.distinct_id) traitDistinctId = t.distinct_id;

    if (t.data_key === 'first_name' || t.data_key === 'firstName') {
      firstName = t.string_value;
    } else if (t.data_key === 'last_name' || t.data_key === 'lastName') {
      lastName = t.string_value;
    } else if (t.data_key === 'email') {
      email = t.string_value;
    } else if (t.data_key === 'avatar') {
      avatar = t.string_value;
    } else {
      properties[t.data_key] = val;
    }
  }

  return {
    ...base,
    distinctId: base.distinctId || traitDistinctId || '',
    firstName,
    lastName,
    email,
    avatar,
    properties,
  };
}

export async function getProjectVisitors(projectId: string, filters: VisitorsFilters) {
  return runQuery({
    [DRIZZLE]: () => relationalGetProjectVisitors(projectId, filters),
    [CLICKHOUSE]: () => clickhouseGetProjectVisitors(projectId, filters),
  });
}

async function relationalGetProjectVisitors(projectId: string, filters: VisitorsFilters) {
  const { pagedRawQuery, parseFilters } = drizzle;
  const { search, identified } = filters;
  const { filterQuery, dateQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
    search: search ? `%${search}%` : undefined,
  });

  const searchQuery = search
    ? `and (visitor.distinct_id ilike {{search}}
           or visitor.email ilike {{search}}
           or visitor.first_name ilike {{search}}
           or visitor.last_name ilike {{search}}
           or visitor.city ilike {{search}}
           or visitor.browser ilike {{search}}
           or visitor.os ilike {{search}}
           or visitor.device ilike {{search}})`
    : '';

  const identifiedQuery =
    identified === true
      ? `and (visitor.distinct_id is not null or visitor.email is not null or visitor.first_name is not null or visitor.last_name is not null)`
      : identified === false
        ? `and visitor.distinct_id is null and visitor.email is null and visitor.first_name is null and visitor.last_name is null`
        : '';

  return pagedRawQuery(
    `
    select
      visitor.visitor_id as "id",
      visitor.distinct_id as "distinctId",
      visitor.project_id as "projectId",
      visitor.browser,
      visitor.os,
      visitor.device,
      visitor.screen,
      visitor.language,
      visitor.country,
      visitor.region,
      visitor.city,
      visitor.first_name as "firstName",
      visitor.last_name as "lastName",
      visitor.email,
      visitor.avatar,
      min(project_event.created_at) as "firstAt",
      max(project_event.created_at) as "lastAt",
      count(distinct project_event.session_id) as "sessions",
      sum(case when project_event.event_type = 1 then 1 else 0 end) as "views",
      sum(case when project_event.event_type = 2 then 1 else 0 end) as "events",
      max(project_event.created_at) as "createdAt"
    from project_event
    join visitor on visitor.visitor_id = project_event.visitor_id
      and visitor.project_id = project_event.project_id
    where project_event.project_id = {{projectId::String}}
    ${dateQuery}
    ${filterQuery}
    ${searchQuery}
    ${identifiedQuery}
    group by visitor.visitor_id,
      visitor.distinct_id,
      visitor.project_id,
      visitor.browser,
      visitor.os,
      visitor.device,
      visitor.screen,
      visitor.language,
      visitor.country,
      visitor.region,
      visitor.city,
      visitor.first_name,
      visitor.last_name,
      visitor.email,
      visitor.avatar
    order by max(project_event.created_at) desc
    `,
    queryParams,
    filters,
    'getProjectVisitors',
  );
}

async function clickhouseGetProjectVisitors(projectId: string, filters: VisitorsFilters) {
  const { pagedRawQuery, parseFilters, rawQuery, getDateStringSQL } = tinybird.enabled ? tinybird : clickhouse;
  const { search, identified } = filters as any;
  const { filterQuery, dateQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
  });

  const searchQuery = search
    ? `and ((positionCaseInsensitive(city, {search:String}) > 0)
           or (positionCaseInsensitive(browser, {search:String}) > 0)
           or (positionCaseInsensitive(os, {search:String}) > 0)
           or (positionCaseInsensitive(device, {search:String}) > 0))`
    : '';

  const isIdentified = identified === true || identified === 'true';
  const isAnonymous = identified === false || identified === 'false';

  const identifiedQuery = isIdentified
    ? `and (distinct_id != '' or visitor_id in (
          select distinct visitor_id from visitor_data where project_id = {projectId:String} and data_key in ('email', 'first_name', 'firstName', 'last_name', 'lastName')
        ))`
    : isAnonymous
      ? `and (distinct_id = '' and visitor_id not in (
          select distinct visitor_id from visitor_data where project_id = {projectId:String} and data_key in ('email', 'first_name', 'firstName', 'last_name', 'lastName')
        ))`
      : '';

  const sql = `
    select
      visitor_id as id,
      any(distinct_id) as distinctId,
      project_id as projectId,
      browser,
      os,
      device,
      screen,
      language,
      country,
      region,
      city,
      ${getDateStringSQL('min(created_at)')} as firstAt,
      ${getDateStringSQL('max(created_at)')} as lastAt,
      uniq(session_id) as sessions,
      sumIf(1, event_type = 1) as views,
      sumIf(1, event_type = 2) as events,
      lastAt as createdAt
    from project_event
    where project_id = {projectId:String}
    ${dateQuery}
    ${filterQuery}
    ${searchQuery}
    ${identifiedQuery}
    group by visitor_id, project_id, browser, os, device, screen, language, country, region, city
    order by lastAt desc
  `;

  const result = await pagedRawQuery(sql, queryParams, filters, 'getProjectVisitors');

  if (result.data && result.data.length > 0) {
    const visitorIds = result.data.map((r: any) => r.id);
    try {
      const traits = await rawQuery<any[]>(
        `
        select
          visitor_id,
          data_key,
          argMax(string_value, created_at) as val
        from visitor_data
        where project_id = {projectId:String}
          and visitor_id in {visitorIds:Array(String)}
          and data_key in ('first_name', 'firstName', 'last_name', 'lastName', 'email', 'avatar')
        group by visitor_id, data_key
        `,
        { projectId, visitorIds },
        'getProjectVisitorsTraits',
      );

      const traitsByVisitor: Record<string, Record<string, string>> = {};
      for (const t of traits || []) {
        if (!traitsByVisitor[t.visitor_id]) traitsByVisitor[t.visitor_id] = {};
        traitsByVisitor[t.visitor_id][t.data_key] = t.val;
      }

      for (const row of (result.data as any[])) {
        const vTraits = traitsByVisitor[row.id] || {};
        row.firstName = vTraits.first_name || vTraits.firstName || null;
        row.lastName = vTraits.last_name || vTraits.lastName || null;
        row.email = vTraits.email || null;
        row.avatar = vTraits.avatar || null;
      }
    } catch {
      // Graceful fallback if trait enrichment query has no records or fails
    }
  }

  return result;
}

export async function getVisitorActivity(projectId: string, visitorId: string) {
  return runQuery({
    [DRIZZLE]: () => relationalGetVisitorActivity(projectId, visitorId),
    [CLICKHOUSE]: () => clickhouseGetVisitorActivity(projectId, visitorId),
  });
}

async function relationalGetVisitorActivity(projectId: string, visitorId: string) {
  const { rawQuery } = drizzle;

  return rawQuery(
    `
    select
      created_at as "createdAt",
      url_path as "urlPath",
      url_query as "urlQuery",
      referrer_domain as "referrerDomain",
      event_id as "eventId",
      event_type as "eventType",
      event_name as "eventName",
      session_id as "sessionId",
      event_id IN (select project_event_id
                   from event_data
                   where project_id = {{projectId::String}}) AS "hasData"
    from project_event
    where project_id = {{projectId::String}}
      and visitor_id = {{visitorId::uuid}}
    order by created_at desc
    limit 500
    `,
    { projectId, visitorId },
    'getVisitorActivity',
  );
}

async function clickhouseGetVisitorActivity(projectId: string, visitorId: string) {
  const { rawQuery } = tinybird.enabled ? tinybird : clickhouse;

  return rawQuery(
    `
    select
      created_at as createdAt,
      url_path as urlPath,
      url_query as urlQuery,
      referrer_domain as referrerDomain,
      event_id as eventId,
      event_type as eventType,
      event_name as eventName,
      session_id as sessionId,
      event_id IN (select event_id
                   from event_data
                   where project_id = {projectId:String}) AS hasData
    from project_event
    where project_id = {projectId:String}
      and visitor_id = {visitorId:String}
    order by created_at desc
    limit 500
    `,
    { projectId, visitorId },
    'getVisitorActivity',
  );
}

export async function getProjectSessions(projectId: string, filters: QueryFilters) {
  return runQuery({
    [DRIZZLE]: () => relationalGetProjectSessions(projectId, filters),
    [CLICKHOUSE]: () => clickhouseGetProjectSessions(projectId, filters),
  });
}

async function relationalGetProjectSessions(projectId: string, filters: QueryFilters) {
  const { pagedRawQuery, parseFilters } = drizzle;
  const { search } = filters;
  const { filterQuery, dateQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
    search: search ? `%${search}%` : undefined,
  });

  const searchQuery = search
    ? `and (distinct_id ilike {{search}}
           or city ilike {{search}}
           or browser ilike {{search}}
           or os ilike {{search}}
           or device ilike {{search}})`
    : '';

  return pagedRawQuery(
    `
    select
      project_event.session_id as "id",
      project_event.visitor_id as "visitorId",
      visitor.distinct_id as "distinctId",
      visitor.project_id as "projectId",
      project_event.hostname,
      visitor.browser,
      visitor.os,
      visitor.device,
      visitor.screen,
      visitor.language,
      visitor.country,
      visitor.region,
      visitor.city,
      min(project_event.created_at) as "firstAt",
      max(project_event.created_at) as "lastAt",
      (select url_path from project_event pe2
        where pe2.session_id = project_event.session_id and pe2.project_id = visitor.project_id
          and pe2.event_type = 1
        order by pe2.created_at asc limit 1) as "entryPage",
      (select url_path from project_event pe3
        where pe3.session_id = project_event.session_id and pe3.project_id = visitor.project_id
          and pe3.event_type = 1
        order by pe3.created_at desc limit 1) as "exitPage",
      extract(epoch from (max(project_event.created_at) - min(project_event.created_at))) as "duration",
      sum(case when project_event.event_type = 1 then 1 else 0 end) as "views",
      sum(case when project_event.event_type = 2 then 1 else 0 end) as "events",
      0 as "revenue",
      max(project_event.created_at) as "createdAt"
    from project_event 
    join visitor on visitor.visitor_id = project_event.visitor_id
      and visitor.project_id = project_event.project_id
    where project_event.project_id = {{projectId::String}}
    ${dateQuery}
    ${filterQuery}
    ${searchQuery}
    group by project_event.session_id,
      project_event.visitor_id, 
      visitor.distinct_id,
      visitor.project_id, 
      project_event.hostname, 
      visitor.browser, 
      visitor.os, 
      visitor.device, 
      visitor.screen, 
      visitor.language, 
      visitor.country, 
      visitor.region, 
      visitor.city
    order by max(project_event.created_at) desc
    `,
    queryParams,
    filters,
    'getProjectSessions',
  );
}

async function clickhouseGetProjectSessions(projectId: string, filters: QueryFilters) {
  const { pagedRawQuery, parseFilters, getDateStringSQL } = tinybird.enabled ? tinybird : clickhouse;
  const { search } = filters;
  const { filterQuery, dateQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
  });

  const searchQuery = search
    ? `and ((positionCaseInsensitive(distinct_id, {search:String}) > 0)
           or (positionCaseInsensitive(city, {search:String}) > 0)
           or (positionCaseInsensitive(browser, {search:String}) > 0)
           or (positionCaseInsensitive(os, {search:String}) > 0)
           or (positionCaseInsensitive(device, {search:String}) > 0))`
    : '';

  let sql = '';

  const EVENT_COLUMNS_KEYS = ['urlPath', 'referrerDomain', 'eventName', 'tag', 'utmSource', 'utmMedium', 'utmCampaign', 'utmContent', 'utmTerm', 'browser', 'os', 'device', 'country', 'region', 'city', 'visitorId'];
  if (EVENT_COLUMNS_KEYS.some(item => Object.keys(filters).includes(item))) {
    sql = `
    select
      session_id as id,
      visitor_id as visitorId,
      any(distinct_id) as distinctId,
      project_id as projectId,
      hostname,
      browser,
      os,
      device,
      screen,
      language,
      country,
      region,
      city,
      ${getDateStringSQL('min(created_at)')} as firstAt,
      ${getDateStringSQL('max(created_at)')} as lastAt,
      argMin(url_path, created_at) as entryPage,
      argMax(url_path, created_at) as exitPage,
      toUInt32(dateDiff('second', min(created_at), max(created_at))) as duration,
      sumIf(1, event_type = 1) as views,
      sumIf(1, event_type = 2) as events,
      0 as revenue,
      lastAt as createdAt
    from project_event
    where project_id = {projectId:String}
    ${dateQuery}
    ${filterQuery}
    ${searchQuery}
    group by session_id, visitor_id, project_id, hostname, browser, os, device, screen, language, country, region, city
    order by lastAt desc
    `;
  } else {
    sql = `
    select
      session_id as id,
      argMaxMerge(visitor_id) as visitorId,
      '' as distinctId,
      project_id as projectId,
      argMaxMerge(hostname) as hostname,
      argMaxMerge(browser) as browser,
      argMaxMerge(os) as os,
      argMaxMerge(device) as device,
      argMaxMerge(screen) as screen,
      argMaxMerge(language) as language,
      argMaxMerge(country) as country,
      argMaxMerge(region) as region,
      argMaxMerge(city) as city,
      ${getDateStringSQL('minMerge(start_time)')} as firstAt,
      ${getDateStringSQL('maxMerge(end_time)')} as lastAt,
      '' as entryPage,
      '' as exitPage,
      toUInt32(dateDiff('second', minMerge(start_time), maxMerge(end_time))) as duration,
      sumMerge(views) as views,
      sumMerge(events) as events,
      sumMerge(revenue) as revenue,
      lastAt as createdAt
    from project_session_stats
    where project_id = {projectId:String}
    and session_date between toDate({startDate:DateTime64}) and toDate({endDate:DateTime64})
    ${filterQuery}
    ${searchQuery}
    group by session_id, project_id
    order by lastAt desc
    `;
  }

  return pagedRawQuery(sql, queryParams, filters, 'getProjectSessions');
}

export async function getProjectSession(projectId: string, sessionId: string) {
  return runQuery({
    [DRIZZLE]: () => relationalGetProjectSession(projectId, sessionId),
    [CLICKHOUSE]: () => clickhouseGetProjectSession(projectId, sessionId),
  });
}

async function relationalGetProjectSession(projectId: string, sessionId: string) {
  const { rawQuery, getTimestampDiffSQL } = drizzle;

  return rawQuery(
    `
    select id,
      visitorId,
      distinct_id as "distinctId",
      project_id as "projectId",
      browser,
      os,
      device,
      screen,
      language,
      country,
      region,
      city,
      min(min_time) as "firstAt",
      max(max_time) as "lastAt",
      1 as visits,
      sum(views) as views,
      sum(events) as events,
      sum(${getTimestampDiffSQL('min_time', 'max_time')}) as "totaltime" 
    from (select
          project_event.session_id as id,
          visitor.visitor_id as visitorId,
          visitor.distinct_id,
          visitor.project_id,
          visitor.browser,
          visitor.os,
          visitor.device,
          visitor.screen,
          visitor.language,
          visitor.country,
          visitor.region,
          visitor.city,
          min(project_event.created_at) as min_time,
          max(project_event.created_at) as max_time,
          sum(case when project_event.event_type = 1 then 1 else 0 end) as views,
          sum(case when project_event.event_type = 2 then 1 else 0 end) as events
    from project_event
    join visitor on project_event.visitor_id = visitor.visitor_id
    where project_event.project_id = {{projectId::String}}
      and project_event.session_id = {{sessionId::uuid}}
    group by project_event.session_id, visitor.visitor_id, visitor.distinct_id, visitor.project_id, visitor.browser, visitor.os, visitor.device, visitor.screen, visitor.language, visitor.country, visitor.region, visitor.city) t
    group by id, visitorId, distinct_id, project_id, browser, os, device, screen, language, country, region, city;
    `,
    { projectId, sessionId },
    'getProjectSession',
  ).then(result => result?.[0]);
}

async function clickhouseGetProjectSession(projectId: string, sessionId: string) {
  const { rawQuery, getDateStringSQL } = tinybird.enabled ? tinybird : clickhouse;

  return rawQuery(
    `
    select id,
      visitorId,
      projectId,
      id as distinctId,
      browser,
      os,
      device,
      screen,
      language,
      country,
      region,
      city,
      ${getDateStringSQL('min(min_time)')} as firstAt,
      ${getDateStringSQL('max(max_time)')} as lastAt,
      1 as visits,
      sum(views) as views,
      sum(events) as events,
      sum(max_time-min_time) as totaltime
    from (select
              session_id as id,
              visitor_id as visitorId,
              project_id as projectId,
              browser,
              os,
              device,
              screen,
              language,
              country,
              region,
              city,
              min(created_at) as min_time,
              max(created_at) as max_time,
              sumIf(1, event_type = 1) as views,
              sumIf(1, event_type = 2) as events
        from project_event
        where project_id = {projectId:String}
          and session_id = {sessionId:String}
        group by session_id, visitor_id, project_id, browser, os, device, screen, language, country, region, city) t
    group by id, visitorId, projectId, browser, os, device, screen, language, country, region, city
    `,
    { projectId, sessionId },
    'getProjectSession',
  ).then(result => result?.[0]);
}

export async function getSessionActivity(projectId: string, sessionId: string, filters: QueryFilters) {
  return runQuery({
    [DRIZZLE]: () => relationalGetSessionActivity(projectId, sessionId, filters),
    [CLICKHOUSE]: () => clickhouseGetSessionActivity(projectId, sessionId, filters),
  });
}

async function relationalGetSessionActivity(projectId: string, sessionId: string, filters: QueryFilters) {
  const { rawQuery } = drizzle;
  const { startDate, endDate } = filters;

  return rawQuery(
    `
    select
      created_at as "createdAt",
      url_path as "urlPath",
      url_query as "urlQuery",
      referrer_domain as "referrerDomain",
      event_id as "eventId",
      event_type as "eventType",
      event_name as "eventName",
      session_id as "sessionId",
      event_id IN (select project_event_id 
                   from event_data
                   where project_id = {{projectId::String}}
                      and created_at between {{startDate}} and {{endDate}}) AS "hasData"
    from project_event
    where project_id = {{projectId::String}}
      and session_id = {{sessionId::uuid}}
      and created_at between {{startDate}} and {{endDate}}
    order by created_at desc
    limit 500
    `,
    { projectId, sessionId, startDate, endDate },
    'getSessionActivity',
  );
}

async function clickhouseGetSessionActivity(projectId: string, sessionId: string, filters: QueryFilters) {
  const { rawQuery } = tinybird.enabled ? tinybird : clickhouse;
  const { startDate, endDate } = filters;

  return rawQuery(
    `
    select
      created_at as createdAt,
      url_path as urlPath,
      url_query as urlQuery,
      referrer_domain as referrerDomain,
      event_id as eventId,
      event_type as eventType,
      event_name as eventName,
      session_id as sessionId,
      event_id IN (select event_id 
                   from event_data 
                   where project_id = {projectId:String} 
                    and session_id = {sessionId:String}
                    and created_at between {startDate:DateTime64} and {endDate:DateTime64}) AS hasData
    from project_event
    where project_id = {projectId:String}
      and session_id = {sessionId:String} 
      and created_at between {startDate:DateTime64} and {endDate:DateTime64}
    order by created_at desc
    limit 500
    `,
    { projectId, sessionId, startDate, endDate },
    'getSessionActivity',
  );
}

export async function getSessionData(projectId: string, sessionId: string) {
  return runQuery({
    [DRIZZLE]: () => relationalGetSessionData(projectId, sessionId),
    [CLICKHOUSE]: () => clickhouseGetSessionData(projectId, sessionId),
  });
}

async function relationalGetSessionData(projectId: string, sessionId: string) {
  const { rawQuery } = drizzle;

  return rawQuery(
    `
    select
        project_id as "projectId",
        visitor_id as "sessionId",
        data_key as "dataKey",
        data_type as "dataType",
        replace(string_value, '.0000', '') as "stringValue",
        number_value as "numberValue",
        date_value as "dateValue",
        created_at as "createdAt"
    from visitor_data
    where project_id = {{projectId::String}}
      and visitor_id = {{sessionId::uuid}}
    order by data_key asc
    `,
    { projectId, sessionId },
    'getSessionData',
  );
}

async function clickhouseGetSessionData(projectId: string, sessionId: string) {
  const { rawQuery } = tinybird.enabled ? tinybird : clickhouse;

  return rawQuery(
    `
    select
        project_id as projectId,
        visitor_id as sessionId,
        data_key as dataKey,
        data_type as dataType,
        replace(string_value, '.0000', '')  as stringValue,
        number_value as numberValue,
        date_value as dateValue,
        created_at as createdAt
    from visitor_data final
    where project_id = {projectId:String}
    and visitor_id = {sessionId:String}
    order by data_key asc
    `,
    { projectId, sessionId },
    'getSessionData',
  );
}

export async function getSessionDataProperties(projectId: string, filters: QueryFilters) {
  return runQuery({
    [DRIZZLE]: () => relationalGetSessionDataProperties(projectId, filters),
    [CLICKHOUSE]: () => clickhouseGetSessionDataProperties(projectId, filters),
  });
}

async function relationalGetSessionDataProperties(projectId: string, filters: QueryFilters) {
  const { rawQuery, parseFilters } = drizzle;
  const { filterQuery, joinVisitorQuery, queryParams } = parseFilters({
    ...filters,
    projectId,
  });

  return rawQuery(
    `
    select
        data_key as "propertyName",
        count(distinct visitor_data.visitor_id) as "total"
    from project_event 
    ${joinVisitorQuery}
    join visitor_data 
        on visitor_data.visitor_id = project_event.visitor_id
          and visitor_data.project_id = project_event.project_id
    where project_event.project_id = {{projectId::String}}
      and project_event.created_at between {{startDate}} and {{endDate}}
        ${filterQuery}
    group by 1
    order by 2 desc
    limit 500
    `,
    queryParams,
    'getSessionDataProperties',
  );
}

async function clickhouseGetSessionDataProperties(projectId: string, filters: QueryFilters) {
  const { rawQuery, parseFilters } = tinybird.enabled ? tinybird : clickhouse;
  const { filterQuery, queryParams } = parseFilters({ ...filters, projectId });

  return rawQuery(
    `
    select
      data_key as propertyName,
      count(distinct visitor_data.visitor_id) as total
    from project_event
    join visitor_data final
      on visitor_data.visitor_id = project_event.visitor_id
        and visitor_data.project_id = {projectId:String}
    where project_event.project_id = {projectId:String}
      and project_event.created_at between {startDate:DateTime64} and {endDate:DateTime64}
      and visitor_data.data_key != ''
    ${filterQuery}
    group by 1
    order by 2 desc
    limit 500
    `,
    queryParams,
    'getSessionDataProperties',
  );
}

export async function getSessionDataValues(projectId: string, filters: QueryFilters & { propertyName?: string }) {
  return runQuery({
    [DRIZZLE]: () => relationalGetSessionDataValues(projectId, filters),
    [CLICKHOUSE]: () => clickhouseGetSessionDataValues(projectId, filters),
  });
}

async function relationalGetSessionDataValues(projectId: string, filters: QueryFilters & { propertyName?: string }) {
  const { rawQuery, parseFilters, getDateSQL } = drizzle;
  const { filterQuery, joinVisitorQuery, queryParams } = parseFilters({
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
      count(distinct visitor_data.visitor_id) as "total"
    from project_event
    ${joinVisitorQuery}
    join visitor_data
        on visitor_data.visitor_id = project_event.visitor_id
          and visitor_data.project_id = project_event.project_id
    where project_event.project_id = {{projectId::String}}
      and project_event.created_at between {{startDate}} and {{endDate}}
      and visitor_data.data_key = {{propertyName}}
    ${filterQuery}
    group by value
    order by 2 desc
    limit 100
    `,
    queryParams,
    'getSessionDataValues',
  );
}

async function clickhouseGetSessionDataValues(projectId: string, filters: QueryFilters & { propertyName?: string }) {
  const { rawQuery, parseFilters } = tinybird.enabled ? tinybird : clickhouse;
  const { filterQuery, queryParams } = parseFilters({ ...filters, projectId });

  return rawQuery(
    `
    select
      multiIf(data_type = 2, replaceAll(string_value, '.0000', ''),
              data_type = 4, toString(date_trunc('hour', date_value)),
              string_value) as "value",
      uniq(visitor_data.visitor_id) as "total"
    from project_event
    join visitor_data final
      on visitor_data.visitor_id = project_event.visitor_id
        and visitor_data.project_id = {projectId:String}
    where project_event.project_id = {projectId:String}
      and project_event.created_at between {startDate:DateTime64} and {endDate:DateTime64}
      and visitor_data.data_key = {propertyName:String}
    ${filterQuery}
    group by value
    order by 2 desc
    limit 100
    `,
    queryParams,
    'getSessionDataValues',
  );
}
