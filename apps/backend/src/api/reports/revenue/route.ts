import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getRevenue, getRevenueMetrics, getRevenueStats, getRevenueGateways } from '@vision/db';
import { canViewProject } from '../../../lib/permissions/project.js';
import { getQueryFilters, setProjectDate } from '../../../lib/request.js';
import { unauthorized } from '../../../lib/response.js';
import { getCompareDate } from '../../../lib/date.js';

const reportResultSchema = z.object({
  projectId: z.string(),
  parameters: z.any().optional(),
  filters: z.any().optional(),
});

const app = new Hono<{ Variables: { auth: any } }>();

app.post('/', zValidator('json', reportResultSchema), async (c) => {
  const { projectId, parameters = {}, filters = {} } = c.req.valid('json');
  const auth = c.get('auth');

  if (!(await canViewProject(auth, projectId))) {
    return unauthorized();
  }

  const projectParams = await setProjectDate(projectId, { ...parameters });
  const queryFilters = await getQueryFilters(filters, projectId);

  const startDate = projectParams.startDate
    ? new Date(projectParams.startDate)
    : queryFilters.startDate;
  const endDate = projectParams.endDate ? new Date(projectParams.endDate) : queryFilters.endDate;
  const currency = projectParams.currency || 'USD';

  const revenueParams = {
    ...projectParams,
    startDate,
    endDate,
    currency,
  };

  const revenueFilters = {
    ...queryFilters,
    startDate,
    endDate,
    currency,
  };

  const [revenue, stats, metrics, gateways] = await Promise.all([
    getRevenue(projectId, revenueParams as any, revenueFilters),
    getRevenueStats(projectId, revenueParams as any, revenueFilters),
    getRevenueMetrics(projectId, revenueParams as any, revenueFilters),
    getRevenueGateways(projectId, revenueParams as any, revenueFilters).catch(() => []),
  ]);

  let comparison = null;
  if (projectParams.compare) {
    const { startDate: compareStartDate, endDate: compareEndDate } = getCompareDate(
      projectParams.compare,
      startDate,
      endDate,
    );

    if (compareStartDate && compareEndDate) {
      comparison = await getRevenueStats(
        projectId,
        {
          ...revenueParams,
          startDate: compareStartDate,
          endDate: compareEndDate,
        } as any,
        {
          ...revenueFilters,
          startDate: compareStartDate,
          endDate: compareEndDate,
        },
      ).catch(() => null);
    }
  }

  return c.json({
    ...revenue,
    total: {
      ...stats,
      comparison,
    },
    gateways: gateways || [],
    ...metrics,
  });
});

export default app;
