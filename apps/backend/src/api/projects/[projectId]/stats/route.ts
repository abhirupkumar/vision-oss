import { Hono } from 'hono';
import { getProjectStats, getRevenueStats, getLlmMetrics } from '@vision/db';
import { canViewProject } from '../../../../lib/permissions/project.js';
import { getQueryFilters } from '../../../../lib/request.js';
import { getCompareDate } from '../../../../lib/date.js';
import { unauthorized } from '../../../../lib/response.js';

const app = new Hono<{ Variables: { auth: any } }>();

app.get('/', async (c) => {
  const projectId = c.req.param('projectId');
  const auth = c.get('auth');

  if (!(await canViewProject(auth, projectId))) {
    return unauthorized();
  }

  const query = c.req.query();
  const filters = await getQueryFilters(query, projectId);

  const [data, revenueStats, llmMetrics] = await Promise.all([
    getProjectStats(projectId, filters),
    getRevenueStats(
      projectId,
      {
        startDate: filters.startDate,
        endDate: filters.endDate,
        currency: 'USD',
      } as any,
      filters,
    ),
    getLlmMetrics(projectId).catch(() => ({ totalCost: 0, totalTokens: 0, avgLatency: 0, avgTtft: 0 })),
  ]);

  const { startDate, endDate } = getCompareDate('prev', filters.startDate, filters.endDate);

  const [comparison, comparisonRevenue] = await Promise.all([
    getProjectStats(projectId, {
      ...filters,
      startDate: startDate!,
      endDate: endDate!,
    }),
    getRevenueStats(
      projectId,
      {
        startDate: startDate!,
        endDate: endDate!,
        currency: 'USD',
      } as any,
      filters,
    ),
  ]);

  return c.json({
    ...data,
    revenue: revenueStats.sum,
    llmCost: llmMetrics.totalCost,
    llmTokens: llmMetrics.totalTokens,
    llmAvgLatency: llmMetrics.avgLatency,
    comparison: { ...comparison, revenue: comparisonRevenue.sum },
  });
});

export default app;
