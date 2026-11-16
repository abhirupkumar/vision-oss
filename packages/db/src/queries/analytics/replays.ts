import { gzipSync, gunzipSync } from 'node:zlib';
import clickhouse from '../../lib/analytics/clickhouse';
import { uuid } from '../../lib/crypto';
import { CLICKHOUSE, DRIZZLE, runQuery } from '../../lib/routing';
import drizzle from '../../lib/relational/drizzle';
import tinybird from '../../lib/analytics/tinybird';
import kafka from '../../lib/kafka';
import type { QueryFilters } from '@vision/shared-types';


export interface SaveRecordingArgs {
  projectId: string;
  visitorId: string;
  sessionId: string;
  chunkIndex: number;
  events: any[];
  eventCount: number;
  startedAt: Date;
  endedAt: Date;
}

export interface ReplayChunk {
  visitorId: string;
  sessionId: string;
  events: any[];
  chunkIndex: number;
  eventCount: number;
  startedAt: Date;
  endedAt: Date;
}

export async function saveRecording(args: SaveRecordingArgs) {
  return clickhouseSaveRecording(args);
}

async function clickhouseSaveRecording({
  projectId,
  visitorId,
  sessionId,
  chunkIndex,
  events,
  eventCount,
  startedAt,
  endedAt,
}: SaveRecordingArgs) {
  const { insert, getUTCString } = tinybird.enabled ? tinybird : clickhouse;
  const { sendMessage } = kafka;

  const message = {
    replay_id: uuid(),
    project_id: projectId,
    visitor_id: visitorId,
    session_id: sessionId,
    chunk_index: chunkIndex,
    events: JSON.stringify(events),
    event_count: eventCount,
    started_at: getUTCString(startedAt),
    ended_at: getUTCString(endedAt),
    created_at: getUTCString(new Date()),
  };

  if (kafka.enabled) {
    return sendMessage('session_replay', message);
  }

  return insert('session_replay', [message]);
}

export async function getReplayChunks(
  projectId: string,
  sessionId: string,
): Promise<ReplayChunk[]> {
  return runQuery({
    [DRIZZLE]: () => relationalGetReplayChunks(projectId, sessionId),
    [CLICKHOUSE]: () => clickhouseGetReplayChunks(projectId, sessionId),
  });
}

async function relationalGetReplayChunks(projectId: string, sessionId: string): Promise<ReplayChunk[]> {
  const { rawQuery } = drizzle;

  const chunks: {
    visitorId: string;
    sessionId: string;
    events: any;
    chunkIndex: number;
    eventCount: number;
    startedAt: Date;
    endedAt: Date;
  }[] = await rawQuery(
    `
    select
      visitor_id as "visitorId",
      session_id as "sessionId",
      events,
      chunk_index as "chunkIndex",
      event_count as "eventCount",
      started_at as "startedAt",
      ended_at as "endedAt"
    from session_replay
    where project_id = {{projectId::String}}
      and session_id = {{sessionId::String}}
    order by chunk_index asc
    `,
    { projectId, sessionId },
    'getReplayChunks',
  );

  return chunks.map(chunk => {
    // Handle bytea/Buffer format
    const buf = Buffer.isBuffer(chunk.events)
      ? chunk.events
      : typeof chunk.events === 'string'
        ? Buffer.from(chunk.events.startsWith('\\x') ? chunk.events.slice(2) : chunk.events, 'hex')
        : Buffer.from(chunk.events || []);
    return {
      ...chunk,
      events: JSON.parse(gunzipSync(buf).toString('utf-8')),
    };
  });
}

async function clickhouseGetReplayChunks(projectId: string, sessionId: string): Promise<ReplayChunk[]> {
  const { rawQuery } = tinybird.enabled ? tinybird : clickhouse;

  const results = await rawQuery<
    {
      visitorId: string;
      sessionId: string;
      events: string;
      chunk_index: number;
      event_count: number;
      started_at: string;
      ended_at: string;
    }[]
  >(
    `
    select
      visitor_id as visitorId,
      session_id as sessionId,
      events,
      chunk_index,
      event_count,
      started_at,
      ended_at
    from session_replay
    where project_id = {projectId:String}
      and session_id = {sessionId:String}
    order by chunk_index asc
    `,
    { projectId, sessionId },
    'getReplayChunks',
  );

  return results.map(row => ({
    visitorId: row.visitorId,
    sessionId: row.sessionId,
    events: JSON.parse(row.events),
    chunkIndex: row.chunk_index,
    eventCount: row.event_count,
    startedAt: new Date(row.started_at),
    endedAt: new Date(row.ended_at),
  }));
}

export async function getSessionReplays(
  ...args: [projectId: string, filters: QueryFilters, visitorId?: string]
) {
  return runQuery({
    [DRIZZLE]: async () => ({ data: [], count: 0, page: 1, pageSize: 10 }),
    [CLICKHOUSE]: () => clickhouseGetSessionReplays(...args),
  });
}

async function clickhouseGetSessionReplays(projectId: string, filters: QueryFilters, visitorId?: string) {
  const { pagedRawQuery, parseFilters } = tinybird.enabled ? tinybird : clickhouse;
  const { search } = filters;
  const { queryParams, cohortQuery, filterQuery } = parseFilters({
    ...filters,
    projectId,
  });

  const sessionFilter = visitorId ? 'and session_replay.visitor_id = {visitorId:String}' : '';

  const searchQuery = search
    ? `and ((positionCaseInsensitive(city, {search:String}) > 0)
           or (positionCaseInsensitive(browser, {search:String}) > 0)
           or (positionCaseInsensitive(os, {search:String}) > 0)
           or (positionCaseInsensitive(device, {search:String}) > 0))`
    : '';

  return pagedRawQuery(
    `
    select
      session_replay.session_id as id,
      session_replay.visitor_id as visitorId,
      session_replay.project_id as projectId,
      project_event.browser,
      project_event.os,
      project_event.device,
      project_event.country,
      project_event.city,
      sum(session_replay.event_count) as eventCount,
      count(*) as chunkCount,
      min(session_replay.started_at) as startedAt,
      max(session_replay.ended_at) as endedAt,
      toInt64(sum(dateDiff('millisecond', session_replay.started_at, session_replay.ended_at))) as duration,
      max(session_replay.created_at) as createdAt
    from session_replay
    join (
      select distinct project_id, visitor_id, session_id, browser, os, device, country, city
      from project_event
      ${cohortQuery}
      where project_id = {projectId:String}
        and created_at between {startDate:DateTime64} and {endDate:DateTime64}
        ${filterQuery}
        ${searchQuery}
    ) project_event
    on project_event.visitor_id = session_replay.visitor_id
      and project_event.project_id = session_replay.project_id
      and project_event.session_id = session_replay.session_id
    where session_replay.project_id = {projectId:String}
        and session_replay.created_at between {startDate:DateTime64} and {endDate:DateTime64}
    ${sessionFilter}
    group by session_replay.session_id, session_replay.visitor_id, session_replay.project_id, project_event.browser, project_event.os, project_event.device, project_event.country, project_event.city
    order by max(created_at) desc
    `,
    { ...queryParams, visitorId },
    filters,
    'getSessionReplays',
  );
}
