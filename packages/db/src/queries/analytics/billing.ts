import clickhouse from '../../lib/analytics/clickhouse';
import tinybird from '../../lib/analytics/tinybird';
import { runQuery, CLICKHOUSE, TINYBIRD } from '../../lib/routing';
import { db } from '../../client';
import { ABTestSession, ABTest } from '../../schema';
import { inArray, and, gte, lte, count, eq } from 'drizzle-orm';

export interface UsageCounts {
  eventsCount: number;
  replaysCount: number;
  errorsCount: number;
  llmCallsCount: number;
  abTestsCount: number;
}

export interface ItemizedCost {
  eventsCost: number;
  replaysCost: number;
  errorsCost: number;
  llmCost: number;
  abTestsCost: number;
  mcpCost: number;
  totalUsageSpend: number;
  includedCredit: number;
  creditUsed: number;
  billableOverage: number;
  percentCreditUsed: number;
}

/**
 * Progressive tiered cost calculation based on Vision Pricing Model
 */
export function calculateItemizedUsageCost(counts: UsageCounts, baseCredit = 39.00): ItemizedCost {
  // 1. Events Ingestion
  let eventsCost = 0;
  const e = counts.eventsCount;
  if (e <= 250_000) {
    eventsCost = (e / 1000) * 0.40;
  } else if (e <= 2_000_000) {
    eventsCost = (250 * 0.40) + ((e - 250_000) / 1000) * 0.25;
  } else if (e <= 10_000_000) {
    eventsCost = (250 * 0.40) + (1750 * 0.25) + ((e - 2_000_000) / 1000) * 0.15;
  } else {
    eventsCost = (250 * 0.40) + (1750 * 0.25) + (8000 * 0.15) + ((e - 10_000_000) / 1000) * 0.08;
  }

  // 2. Session Replay
  let replaysCost = 0;
  const r = counts.replaysCount;
  if (r <= 5_000) {
    replaysCost = (r / 1000) * 3.50;
  } else if (r <= 25_000) {
    replaysCost = (5 * 3.50) + ((r - 5_000) / 1000) * 2.50;
  } else {
    replaysCost = (5 * 3.50) + (20 * 2.50) + ((r - 25_000) / 1000) * 1.50;
  }

  // 3. Error Tracking & Crashes
  let errorsCost = 0;
  const err = counts.errorsCount;
  if (err <= 50_000) {
    errorsCost = (err / 1000) * 0.35;
  } else if (err <= 250_000) {
    errorsCost = (50 * 0.35) + ((err - 50_000) / 1000) * 0.25;
  } else if (err <= 1_000_000) {
    errorsCost = (50 * 0.35) + (200 * 0.25) + ((err - 250_000) / 1000) * 0.18;
  } else {
    errorsCost = (50 * 0.35) + (200 * 0.25) + (750 * 0.18) + ((err - 1_000_000) / 1000) * 0.10;
  }

  // 4. LLM Observability
  let llmCost = 0;
  const l = counts.llmCallsCount;
  if (l <= 50_000) {
    llmCost = (l / 1000) * 1.20;
  } else if (l <= 500_000) {
    llmCost = (50 * 1.20) + ((l - 50_000) / 1000) * 0.80;
  } else {
    llmCost = (50 * 1.20) + (450 * 0.80) + ((l - 500_000) / 1000) * 0.40;
  }

  // 5. Experiments / A/B Testing ($1.00 per 10k requests = $0.00010 each)
  const abTestsCost = (counts.abTestsCount / 10_000) * 1.00;

  // 6. MCP Server is Free
  const mcpCost = 0.00;

  const totalUsageSpend = eventsCost + replaysCost + errorsCost + llmCost + abTestsCost + mcpCost;
  const creditUsed = Math.min(totalUsageSpend, baseCredit);
  const billableOverage = Math.max(0, totalUsageSpend - baseCredit);
  const percentCreditUsed = baseCredit > 0 ? (creditUsed / baseCredit) * 100 : 100;

  return {
    eventsCost: Number(eventsCost.toFixed(2)),
    replaysCost: Number(replaysCost.toFixed(2)),
    errorsCost: Number(errorsCost.toFixed(2)),
    llmCost: Number(llmCost.toFixed(2)),
    abTestsCost: Number(abTestsCost.toFixed(2)),
    mcpCost,
    totalUsageSpend: Number(totalUsageSpend.toFixed(2)),
    includedCredit: baseCredit,
    creditUsed: Number(creditUsed.toFixed(2)),
    billableOverage: Number(billableOverage.toFixed(2)),
    percentCreditUsed: Number(percentCreditUsed.toFixed(1)),
  };
}

/**
 * Aggregates consumption metrics across all projects belonging to an organization
 * for a specific billing period window.
 */
export async function getOrganizationPeriodUsage(
  projectIds: string[],
  startDate: Date,
  endDate: Date
): Promise<UsageCounts> {
  if (!projectIds || projectIds.length === 0) {
    return { eventsCount: 0, replaysCount: 0, errorsCount: 0, llmCallsCount: 0, abTestsCount: 0 };
  }

  const startStr = startDate.toISOString().replace('T', ' ').slice(0, 19);
  const endStr = endDate.toISOString().replace('T', ' ').slice(0, 19);

  let eventsCount = 0;
  let replaysCount = 0;
  let errorsCount = 0;
  let llmCallsCount = 0;

  if (process.env.TINYBIRD_URL || process.env.CLICKHOUSE_URL) {
    const formattedPids = projectIds.map(id => `'${id}'`).join(', ');

    const analyticsQuery = `
      SELECT
        (SELECT count() FROM project_event WHERE project_id IN (${formattedPids}) AND created_at >= '${startStr}' AND created_at <= '${endStr}') AS eventsCount,
        (SELECT count() FROM session_replay WHERE project_id IN (${formattedPids}) AND created_at >= '${startStr}' AND created_at <= '${endStr}') AS replaysCount,
        (SELECT count() FROM project_error WHERE project_id IN (${formattedPids}) AND created_at >= '${startStr}' AND created_at <= '${endStr}') AS errorsCount,
        (SELECT count() FROM llm_events WHERE project_id IN (${formattedPids}) AND created_at >= '${startStr}' AND created_at <= '${endStr}') AS llmCallsCount
    `;

    try {
      const result = await runQuery({
        [CLICKHOUSE]: () => clickhouse.rawQuery(analyticsQuery),
        [TINYBIRD]: () => tinybird.rawQuery(analyticsQuery),
      });

      const row = (result?.data || result || [])[0] || {};
      eventsCount = Number(row.eventsCount || 0);
      replaysCount = Number(row.replaysCount || 0);
      errorsCount = Number(row.errorsCount || 0);
      llmCallsCount = Number(row.llmCallsCount || 0);
    } catch (err) {
      console.error('[getOrganizationPeriodUsage] Analytics query error:', err);
    }
  }

  // PostgreSQL Query for A/B Test Sessions
  let abTestsCount = 0;
  try {
    const abRes = await db
      .select({ val: count() })
      .from(ABTestSession)
      .innerJoin(ABTest, eq(ABTestSession.testId, ABTest.id))
      .where(
        and(
          inArray(ABTest.projectId, projectIds),
          gte(ABTestSession.createdAt, startDate),
          lte(ABTestSession.createdAt, endDate)
        )
      );
    abTestsCount = Number(abRes[0]?.val || 0);
  } catch (err) {
    console.error('[getOrganizationPeriodUsage] AB Test query error:', err);
  }

  return {
    eventsCount,
    replaysCount,
    errorsCount,
    llmCallsCount,
    abTestsCount,
  };
}
