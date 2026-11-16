import clickhouse from '../lib/analytics/clickhouse';
import tinybird from '../lib/analytics/tinybird';

// Use whichever analytics driver is configured
function getDriver() {
  return tinybird.enabled ? tinybird : clickhouse;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PushSubscriptionRow {
  id: string;
  userId: string;
  projectId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: string;
}

// ─── Upsert ───────────────────────────────────────────────────────────────────

export async function upsertPushSubscription(data: {
  userId: string;
  projectId?: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<void> {
  const { insert, getUTCString } = getDriver();

  // ClickHouse ReplacingMergeTree deduplicates by the sorting key (endpoint).
  // Inserting a new row with the same endpoint will replace the old one during merges.
  // Final reads use FINAL to get the latest version.
  await insert('push_subscription', [
    {
      id: crypto.randomUUID(),
      user_id: data.userId,
      project_id: data.projectId ?? '',
      endpoint: data.endpoint,
      p256dh: data.p256dh,
      auth: data.auth,
      created_at: getUTCString(new Date()),
    },
  ]);
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const { rawQuery } = getDriver();

  // ClickHouse doesn't support standard DELETE in MergeTree, so we use ALTER TABLE DELETE
  // which is a mutation (eventually consistent).
  await rawQuery(
    `ALTER TABLE push_subscription DELETE WHERE endpoint = {endpoint:String}`,
    { endpoint },
    'deletePushSubscription',
  );
}

// ─── Get all subscriptions for a project's users ──────────────────────────────

export async function getPushSubscriptionsForProject(
  projectId: string,
): Promise<PushSubscriptionRow[]> {
  const { rawQuery } = getDriver();

  // Use FINAL to collapse ReplacingMergeTree duplicates and get latest row per endpoint
  const rows = await rawQuery<any[]>(
    `
    SELECT
      id,
      user_id      AS userId,
      project_id   AS projectId,
      endpoint,
      p256dh,
      auth,
      created_at   AS createdAt
    FROM push_subscription FINAL
    WHERE project_id = {projectId:String}
    ORDER BY created_at DESC
    `,
    { projectId },
    'getPushSubscriptionsForProject',
  );

  return rows;
}
