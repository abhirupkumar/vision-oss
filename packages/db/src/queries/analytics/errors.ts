import { createHash } from 'node:crypto';
import { db } from '../../client';
import { ErrorGroup } from '../../schema';
import { uuid } from '../../lib/crypto';
import clickhouse from '../../lib/analytics/clickhouse';
import tinybird from '../../lib/analytics/tinybird';
import kafka from '../../lib/kafka';
import redis from '../../lib/redis';
import { CLICKHOUSE, DRIZZLE, runQuery } from '../../lib/routing';
import drizzle from '../../lib/relational/drizzle';
import type { QueryFilters } from '@vision/shared-types';
import { and, eq, sql } from 'drizzle-orm';

export interface SaveErrorSpanArgs {
  projectId: string;
  sessionId: string;
  visitorId: string;
  errorType: string;
  message: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  stack?: string;
  urlPath?: string;
  hostname?: string;
  browser?: string;
  os?: string;
  device?: string;
  country?: string;
  region?: string;
  city?: string;
  level?: string;
  createdAt?: Date;
}

const URL_LENGTH = 500;
const ERROR_TYPE_LENGTH = 100;
const MESSAGE_LENGTH = 2000;
const STACK_LENGTH = 10000;

export function computeFingerprint(
  errorType: string,
  message: string,
  path: string,
): string {
  const normalizedMsg = message
    .replace(/0x[0-9a-f]+/gi, '0x?')
    .replace(/:\d+:\d+/g, ':?:?')
    .slice(0, 200);
  const input = `${errorType}:${normalizedMsg}:${path}`;
  return createHash('sha256').update(input).digest('hex').slice(0, 16);
}

export async function saveErrorSpans(argsArray: SaveErrorSpanArgs[]) {
  for (const args of argsArray) {
    const fingerprint = computeFingerprint(args.errorType, args.message, args.urlPath || '');

    try {
      await db.insert(ErrorGroup).values({
        projectId: args.projectId,
        fingerprint,
        errorType: args.errorType.substring(0, ERROR_TYPE_LENGTH),
        message: args.message.substring(0, MESSAGE_LENGTH),
        occurrences: 1,
        affectedUsers: 1,
        firstSeen: args.createdAt || new Date(),
        lastSeen: args.createdAt || new Date(),
        resolved: false,
      }).onConflictDoUpdate({
        target: [ErrorGroup.projectId, ErrorGroup.fingerprint],
        set: {
          occurrences: sql`error_group.occurrences + 1`,
          lastSeen: args.createdAt || new Date(),
          resolved: false,
        }
      });
    } catch (e) {
      console.error('ErrorGroup upsert failed', e);
    }
  }

  return clickhouseSaveErrorSpans(argsArray);
}

async function clickhouseSaveErrorSpans(argsArray: SaveErrorSpanArgs[]) {
  const { insert, getUTCString } = tinybird.enabled ? tinybird : clickhouse;
  const { sendMessage } = kafka;

  const messages = argsArray.map(args => {
    const eventId = uuid();
    const fingerprint = computeFingerprint(args.errorType, args.message, args.urlPath || '');

    return {
      project_id: args.projectId,
      session_id: args.sessionId,
      visitor_id: args.visitorId,
      error_id: eventId,
      error_type: args.errorType.substring(0, ERROR_TYPE_LENGTH),
      message: args.message.substring(0, MESSAGE_LENGTH),
      filename: args.filename?.substring(0, URL_LENGTH),
      lineno: args.lineno,
      colno: args.colno,
      stack: args.stack?.substring(0, STACK_LENGTH),
      fingerprint,
      url_path: args.urlPath?.substring(0, URL_LENGTH),
      hostname: args.hostname,
      browser: args.browser,
      os: args.os,
      device: args.device,
      country: args.country,
      region: args.country && args.region ? (args.region.includes('-') ? args.region : `${args.country}-${args.region}`) : null,
      city: args.city,
      level: args.level || 'error',
      created_at: getUTCString(args.createdAt || new Date()),
    };
  });

  if (kafka.enabled) {
    await sendMessage('project_error', messages);
  } else {
    await insert('project_error', messages);
  }
}

export async function getRecentErrors(projectId: string, filters: QueryFilters) {
  return runQuery({
    [CLICKHOUSE]: async () => {
      const { rawQuery, parseFilters } = clickhouse;
      const { queryParams } = parseFilters({ ...filters, projectId });
      return rawQuery(
        `SELECT
          error_id as id,
          project_id,
          visitor_id,
          session_id,
          error_type,
          message,
          filename,
          lineno,
          colno,
          stack,
          fingerprint,
          url_path,
          hostname,
          browser,
          os,
          device,
          country,
          level,
          created_at
        FROM project_error
        WHERE project_id = {projectId:String}
        ORDER BY created_at DESC
        LIMIT 100`,
        queryParams
      );
    },
    [DRIZZLE]: async () => {
      return [];
    },
  });
}

export async function getErrorTypes(projectId: string, filters: QueryFilters) {
  return runQuery({
    [CLICKHOUSE]: async () => {
      const { rawQuery, parseFilters } = clickhouse;
      const { filterQuery, queryParams } = parseFilters({ ...filters, projectId });
      return rawQuery(
        `SELECT
          error_type as name,
          count() as count,
          uniqExact(visitor_id) as users,
          max(created_at) as last_seen
        FROM project_error
        WHERE project_id = {projectId:String}
        ${filterQuery}
        GROUP BY error_type
        ORDER BY count DESC
        LIMIT 50`,
        queryParams
      );
    },
    [DRIZZLE]: async () => {
      return [];
    },
  });
}

export async function getErrorsByPage(projectId: string, filters: QueryFilters) {
  return runQuery({
    [CLICKHOUSE]: async () => {
      const { rawQuery, parseFilters } = clickhouse;
      const { filterQuery, queryParams } = parseFilters({ ...filters, projectId });
      return rawQuery(
        `SELECT
          url_path as name,
          count() as errors,
          uniqExact(visitor_id) as users
        FROM project_error
        WHERE project_id = {projectId:String}
        ${filterQuery}
        GROUP BY url_path
        ORDER BY errors DESC
        LIMIT 50`,
        queryParams
      );
    },
    [DRIZZLE]: async () => {
      return [];
    },
  });
}

export async function getErrorSummary(projectId: string, filters: QueryFilters) {
  return runQuery({
    [CLICKHOUSE]: async () => {
      const { rawQuery, parseFilters } = clickhouse;
      const { filterQuery, queryParams } = parseFilters({ ...filters, projectId });
      return rawQuery(
        `SELECT
          count() AS totalErrors,
          uniqExact(error_type) AS uniqueErrorTypes,
          uniqExact(visitor_id) AS affectedUsers,
          uniqExact(session_id) AS affectedSessions,
          0 AS errorRate
        FROM project_error
        WHERE project_id = {projectId:String}
        ${filterQuery}`,
        queryParams
      );
    },
    [DRIZZLE]: async () => {
      return [{ totalErrors: 0, uniqueErrorTypes: 0, affectedUsers: 0, affectedSessions: 0, errorRate: 0 }];
    },
  });
}

export async function getErrorChartData(projectId: string, filters: QueryFilters) {
  return runQuery({
    [CLICKHOUSE]: async () => {
      const { rawQuery, parseFilters } = clickhouse;
      const { filterQuery, queryParams } = parseFilters({ ...filters, projectId });
      return rawQuery(
        `SELECT
          toStartOfDay(created_at) AS date,
          count() AS totalErrors,
          uniqExact(visitor_id) AS affectedUsers
        FROM project_error
        WHERE project_id = {projectId:String}
        ${filterQuery}
        GROUP BY date
        ORDER BY date ASC`,
        queryParams
      );
    },
    [DRIZZLE]: async () => {
      return [];
    },
  });
}

export async function resolveErrorGroup(projectId: string, fingerprint: string) {
  return runQuery({
    [CLICKHOUSE]: async () => {
      return null;
    },
    [DRIZZLE]: async () => {
      await db.update(ErrorGroup)
        .set({ resolved: true, resolvedAt: new Date() })
        .where(and(eq(ErrorGroup.projectId, projectId), eq(ErrorGroup.fingerprint, fingerprint)));
      return null;
    }
  });
}
