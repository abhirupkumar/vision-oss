import { uuid } from '../lib/crypto';
import clickhouse from '../lib/analytics/clickhouse';
import tinybird from '../lib/analytics/tinybird';
import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { db } from '../client';
import { Notification } from '../schema';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

export interface NotificationRow {
  id: string;
  projectId: string;
  ruleId?: string;
  title: string;
  message: string;
  type: string;
  severity: string;
  source: string;
  isRead: boolean;
  payload: string;
  createdAt: string;
}

export interface CreateNotificationArgs {
  projectId: string;
  ruleId?: string;
  title: string;
  message: string;
  type?: 'event' | 'anomaly';
  severity?: 'info' | 'warning' | 'critical';
  source?: string;
  payload?: any;
}

// ------------------------------------------------------------------
// createNotification
// ------------------------------------------------------------------

export async function createNotification(args: CreateNotificationArgs): Promise<NotificationRow> {
  if (process.env.TINYBIRD_URL || process.env.CLICKHOUSE_URL) {
    return clickhouseCreateNotification(args);
  }
  return relationalCreateNotification(args);
}

async function clickhouseCreateNotification(args: CreateNotificationArgs): Promise<NotificationRow> {
  const { insert, getUTCString } = tinybird.enabled ? tinybird : clickhouse;

  const row: NotificationRow = {
    id: uuid(),
    projectId: args.projectId,
    ruleId: args.ruleId ?? '',
    title: args.title,
    message: args.message,
    type: args.type ?? 'event',
    severity: args.severity ?? 'info',
    source: args.source ?? 'rule',
    isRead: false,
    payload: args.payload ? (typeof args.payload === 'string' ? args.payload : JSON.stringify(args.payload)) : '',
    createdAt: getUTCString(new Date()),
  };

  await insert('notification', [{
    id: row.id,
    project_id: row.projectId,
    rule_id: row.ruleId,
    title: row.title,
    message: row.message,
    type: row.type,
    severity: row.severity,
    source: row.source,
    is_read: 0,
    payload: row.payload,
    created_at: row.createdAt,
  }]);

  return row;
}

async function relationalCreateNotification(args: CreateNotificationArgs): Promise<NotificationRow> {
  const [created] = await db
    .insert(Notification)
    .values({
      id: crypto.randomUUID(),
      projectId: args.projectId,
      title: args.title,
      message: args.message,
      source: args.source ?? 'rule',
      notificationRuleId: args.ruleId,
      payload: args.payload,
      sendToApp: true,
      sendToEmail: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return {
    id: created.id,
    projectId: created.projectId,
    ruleId: created.notificationRuleId ?? undefined,
    title: created.title,
    message: created.message,
    type: args.type ?? 'event',
    severity: args.severity ?? 'info',
    source: created.source,
    isRead: false,
    payload: created.payload ? JSON.stringify(created.payload) : '',
    createdAt: created.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

// ------------------------------------------------------------------
// getNotifications
// ------------------------------------------------------------------

export interface GetNotificationsOpts {
  source?: string;
  type?: string;
  severity?: string;
  limit?: number;
  offset?: number;
}

export async function getNotifications(
  projectId: string,
  opts?: GetNotificationsOpts,
): Promise<NotificationRow[]> {
  if (process.env.TINYBIRD_URL || process.env.CLICKHOUSE_URL) {
    return clickhouseGetNotifications(projectId, opts);
  }
  return relationalGetNotifications(projectId, opts);
}

async function clickhouseGetNotifications(
  projectId: string,
  opts?: GetNotificationsOpts,
): Promise<NotificationRow[]> {
  const { rawQuery } = tinybird.enabled ? tinybird : clickhouse;

  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  const sourceFilter = opts?.source ? `and source = {source:String}` : '';
  const typeFilter = opts?.type ? `and type = {type:String}` : '';
  const severityFilter = opts?.severity ? `and severity = {severity:String}` : '';

  const rows = await rawQuery<any[]>(
    `
    select
      id,
      project_id as projectId,
      rule_id as ruleId,
      title,
      message,
      type,
      severity,
      source,
      is_read as isRead,
      payload,
      created_at as createdAt
    from notification
    where project_id = {projectId:String}
    ${sourceFilter}
    ${typeFilter}
    ${severityFilter}
    order by created_at desc
    limit ${limit} offset ${offset}
    `,
    {
      projectId,
      ...(opts?.source ? { source: opts.source } : {}),
      ...(opts?.type ? { type: opts.type } : {}),
      ...(opts?.severity ? { severity: opts.severity } : {}),
    },
    'getNotifications',
  );

  return rows.map(r => ({
    ...r,
    isRead: Boolean(r.isRead),
  }));
}

async function relationalGetNotifications(
  projectId: string,
  opts?: GetNotificationsOpts,
): Promise<NotificationRow[]> {
  const conditions = [eq(Notification.projectId, projectId)];
  if (opts?.source) conditions.push(eq(Notification.source, opts.source));

  const rows = await db.query.Notification.findMany({
    where: and(...conditions),
    orderBy: [desc(Notification.createdAt)],
    limit: opts?.limit ?? 50,
    offset: opts?.offset ?? 0,
  });

  return rows.map(r => ({
    id: r.id,
    projectId: r.projectId,
    ruleId: r.notificationRuleId ?? undefined,
    title: r.title,
    message: r.message,
    type: opts?.type ?? 'event',
    severity: opts?.severity ?? 'info',
    source: r.source,
    isRead: false,
    payload: r.payload ? JSON.stringify(r.payload) : '',
    createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
  }));
}

export async function getUnreadNotificationCount(projectId: string): Promise<number> {
  if (process.env.TINYBIRD_URL || process.env.CLICKHOUSE_URL) {
    const { rawQuery } = tinybird.enabled ? tinybird : clickhouse;
    const rows = await rawQuery<any[]>(
      `select count(*) as num from notification
       where project_id = {projectId:String}
       and is_read = 0`,
      { projectId },
    );
    return Number(rows?.[0]?.num ?? 0);
  }

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(Notification)
    .where(and(eq(Notification.projectId, projectId), isNull(Notification.isReadAt)));
  return Number(result.count);
}

export async function markNotificationsRead(ids: string[]): Promise<void> {
  if (!ids.length) return;

  if (process.env.TINYBIRD_URL || process.env.CLICKHOUSE_URL) {
    return;
  }

  await db
    .update(Notification)
    .set({ isReadAt: new Date(), updatedAt: new Date() })
    .where(inArray(Notification.id, ids));
}
