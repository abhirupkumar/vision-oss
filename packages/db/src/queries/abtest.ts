import { asc, desc, eq } from 'drizzle-orm';
import { db } from '../client';
import { ABTest, ABTestVariant } from '../schema';
import kafka from '../lib/kafka';
import clickhouse from '../lib/analytics/clickhouse';
import tinybird from '../lib/analytics/tinybird';
import { runQuery, CLICKHOUSE, TINYBIRD } from '../lib/routing';

export async function getABTests(projectId: string) {
  const tests = await db.query.ABTest.findMany({
    where: eq(ABTest.projectId, projectId),
    with: {
      variants: true,
    },
    orderBy: [desc(ABTest.createdAt)],
  });

  // Query session counts from telemetry in Tinybird/ClickHouse
  const testCountMap = new Map<string, number>();

  if (process.env.TINYBIRD_URL || process.env.CLICKHOUSE_URL) {
    const testIds = tests.map(t => `'${t.id}'`).join(',');
    if (testIds) {
      const query = `
        SELECT
          test_id AS testId,
          countDistinct(session_id) AS sessionCount
        FROM telemetry
        WHERE test_id IN (${testIds})
          AND stream_type IN ('ab_test_session', 'ab_test_conversion')
        GROUP BY test_id
      `;
      try {
        const rows: any = await runQuery({
          [CLICKHOUSE]: () => clickhouse.rawQuery(query),
          [TINYBIRD]: () => tinybird.rawQuery(query),
        });
        for (const row of rows?.data || rows || []) {
          testCountMap.set(row.testId, Number(row.sessionCount || 0));
        }
      } catch (e) {
        console.error('[getABTests] error querying telemetry counts:', e);
      }
    }
  }

  return tests.map(test => ({
    ...test,
    _count: { sessions: testCountMap.get(test.id) || 0 },
  }));
}

export async function getABTest(testId: string) {
  const test = await db.query.ABTest.findFirst({
    where: eq(ABTest.id, testId),
    with: {
      variants: true,
    },
  });

  if (!test) return null;

  const variantCountMap = new Map<string, number>();

  if (process.env.TINYBIRD_URL || process.env.CLICKHOUSE_URL) {
    const query = `
      SELECT
        variant_id AS variantId,
        countDistinct(session_id) AS sessionCount
      FROM telemetry
      WHERE test_id = '${testId}'
        AND stream_type IN ('ab_test_session', 'ab_test_conversion')
      GROUP BY variant_id
    `;
    try {
      const rows: any = await runQuery({
        [CLICKHOUSE]: () => clickhouse.rawQuery(query),
        [TINYBIRD]: () => tinybird.rawQuery(query),
      });
      for (const row of rows?.data || rows || []) {
        variantCountMap.set(row.variantId, Number(row.sessionCount || 0));
      }
    } catch (e) {
      console.error('[getABTest] error querying telemetry counts:', e);
    }
  }

  const variantsWithCount = test.variants.map(variant => ({
    ...variant,
    _count: { sessions: variantCountMap.get(variant.id) || 0 },
  }));

  return {
    ...test,
    variants: variantsWithCount,
  };
}

export async function getABTestStats(testId: string) {
  const test = await db.query.ABTest.findFirst({
    where: eq(ABTest.id, testId),
    with: { variants: true },
  });

  if (!test) return null;

  const variantMap = new Map<string, { totalSessions: number; conversions: number }>();

  if (process.env.TINYBIRD_URL || process.env.CLICKHOUSE_URL) {
    const query = `
      SELECT
        variant_id AS variantId,
        countDistinct(session_id) AS totalSessions,
        countDistinctIf(session_id, converted = 1) AS conversions
      FROM telemetry
      WHERE test_id = '${testId}'
        AND stream_type IN ('ab_test_session', 'ab_test_conversion')
      GROUP BY variant_id
    `;

    try {
      const rows: any = await runQuery({
        [CLICKHOUSE]: () => clickhouse.rawQuery(query),
        [TINYBIRD]: () => tinybird.rawQuery(query),
      });

      for (const row of rows?.data || rows || []) {
        variantMap.set(row.variantId, {
          totalSessions: Number(row.totalSessions || 0),
          conversions: Number(row.conversions || 0),
        });
      }
    } catch (e) {
      console.error('[getABTestStats] error querying telemetry:', e);
    }
  }

  const variantStats = test.variants.map(variant => {
    const stats = variantMap.get(variant.id) || { totalSessions: 0, conversions: 0 };
    const total = stats.totalSessions;
    const converted = stats.conversions;
    return {
      ...variant,
      totalSessions: total,
      conversions: converted,
      conversionRate: total > 0 ? Math.round((converted / total) * 10000) / 100 : 0,
    };
  });

  return { ...test, variantStats };
}

export async function createABTest(data: {
  projectId: string;
  name: string;
  description?: string;
  goalEventName: string;
  variants: Array<{ name: string; weight: number }>;
}) {
  return await db.transaction(async tx => {
    const { variants, ...testData } = data;
    const [test] = await tx
      .insert(ABTest)
      .values({ ...testData, createdAt: new Date(), updatedAt: new Date() })
      .returning();

    const variantsData = variants.map(v => ({
      ...v,
      testId: test.id,
    }));
    const createdVariants = await tx.insert(ABTestVariant).values(variantsData).returning();

    return {
      ...test,
      variants: createdVariants,
    };
  });
}

export async function updateABTestStatus(testId: string, status: 'draft' | 'running' | 'stopped') {
  const [updated] = await db
    .update(ABTest)
    .set({
      status,
      startedAt: status === 'running' ? new Date() : undefined,
      stoppedAt: status === 'stopped' ? new Date() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(ABTest.id, testId))
    .returning();
  return updated;
}

export async function deleteABTest(testId: string) {
  const [deleted] = await db.delete(ABTest).where(eq(ABTest.id, testId)).returning();
  return deleted;
}

/**
 * Zero-PostgreSQL session tracking: routes to Kafka 'telemetry' topic
 * and demultiplexes into Tinybird with stream_type: 'ab_test_session'
 */
export async function trackABTestSession(data: {
  testId: string;
  variantId: string;
  sessionId: string;
}) {
  const payload = {
    test_id: data.testId,
    variant_id: data.variantId,
    session_id: data.sessionId,
    converted: 0,
    created_at: new Date().toISOString(),
  };

  if (kafka.enabled) {
    await kafka.sendMessage('ab_test_session', payload);
  } else if (tinybird.enabled) {
    await tinybird.insert('telemetry', [{ stream_type: 'ab_test_session', ...payload }]);
  }

  return { success: true, ...data };
}

/**
 * Zero-PostgreSQL conversion tracking: routes to Kafka 'telemetry' topic
 * with stream_type: 'ab_test_conversion'
 */
export async function convertABTestSession(testId: string, sessionId: string) {
  const payload = {
    test_id: testId,
    session_id: sessionId,
    converted: 1,
    converted_at: new Date().toISOString(),
  };

  if (kafka.enabled) {
    await kafka.sendMessage('ab_test_conversion', payload);
  } else if (tinybird.enabled) {
    await tinybird.insert('telemetry', [{ stream_type: 'ab_test_conversion', ...payload }]);
  }

  return { success: true, testId, sessionId };
}

/**
 * Zero-PostgreSQL Feature Flag evaluation tracking:
 * routes to Kafka 'telemetry' topic with stream_type: 'feature_flag_evaluation'
 */
export async function trackFeatureFlagEvaluation(data: {
  projectId: string;
  flagKey: string;
  userId?: string;
  sessionId?: string;
  value: string;
}) {
  const payload = {
    project_id: data.projectId,
    flag_key: data.flagKey,
    user_id: data.userId || '',
    session_id: data.sessionId || '',
    value: data.value,
    evaluated_at: new Date().toISOString(),
  };

  if (kafka.enabled) {
    await kafka.sendMessage('feature_flag_evaluation', payload);
  } else if (tinybird.enabled) {
    await tinybird.insert('telemetry', [{ stream_type: 'feature_flag_evaluation', ...payload }]);
  }

  return { success: true, ...data };
}
