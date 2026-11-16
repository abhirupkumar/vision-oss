import { DetectedSignal } from './detection.js';

export interface EnrichmentContext {
  customEvents: string[];
  funnels: string[];
  goals: string[];
  errorCount: number;
  vitals: string[];
}

export async function enrichSignals(params: {
  projectId: string;
  signals: DetectedSignal[];
  env: any;
}): Promise<EnrichmentContext> {
  const { projectId } = params;
  const { db, Report, ErrorGroup } = await import('@vision/db');
  const { eq, and, sql } = await import('drizzle-orm');

  const funnelsRows = await db.query.Report.findMany({
    where: and(eq(Report.projectId, projectId), eq(Report.type, 'funnel')),
    columns: { name: true },
  });
  const funnels = funnelsRows.map((r: any) => r.name);

  const goalsRows = await db.query.Report.findMany({
    where: and(eq(Report.projectId, projectId), eq(Report.type, 'goal')),
    columns: { name: true },
  });
  const goals = goalsRows.map((r: any) => r.name);

  const errorResult = await db
    .select({ count: sql<number>`coalesce(sum(${ErrorGroup.occurrences}), 0)` })
    .from(ErrorGroup)
    .where(eq(ErrorGroup.projectId, projectId));
  const errorCount = Number(errorResult[0]?.count || 0);

  return {
    customEvents: ['signup', 'purchase', 'login', 'checkout', 'upgrade'],
    funnels,
    goals,
    errorCount,
    vitals: ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'],
  };
}
