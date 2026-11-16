import { Hono } from 'hono';
import { getPageviewStats, getSessionStats, getRevenue } from '@vision/db';
import { canViewProject } from '../../../../lib/permissions/project.js';
import { getQueryFilters } from '../../../../lib/request.js';
import { getCompareDate } from '../../../../lib/date.js';
import { unauthorized } from '../../../../lib/response.js';

function groupRevenue(chart: { t: string; y: number }[]) {
  const map: Record<string, number> = {};
  for (const row of chart) {
    if (!map[row.t]) map[row.t] = 0;
    map[row.t] += row.y;
  }
  return Object.keys(map).map(x => ({ x, y: map[x] }));
}

const app = new Hono<{ Variables: { auth: any } }>();

app.get('/', async (c) => {
  const projectId = c.req.param('projectId');
  const auth = c.get('auth');

  if (!(await canViewProject(auth, projectId))) {
    return unauthorized();
  }

  const query = c.req.query();
  const filters = await getQueryFilters(query, projectId);

  const [pageviews, sessions, revenueResult] = await Promise.all([
    getPageviewStats(projectId, filters),
    getSessionStats(projectId, filters),
    getRevenue(
      projectId,
      {
        startDate: filters.startDate,
        endDate: filters.endDate,
        unit: (query.unit as string) || 'day',
        timezone: (query.timezone as string) || 'UTC',
        currency: 'USD',
      },
      filters,
    ),
  ]);
  const revenue = groupRevenue(revenueResult.chart);

  if (filters.compare) {
    const { startDate: compareStartDate, endDate: compareEndDate } = getCompareDate(
      filters.compare,
      filters.startDate,
      filters.endDate,
    );

    const [comparePageviews, compareSessions, compareRevenueResult] = await Promise.all([
      getPageviewStats(projectId, {
        ...filters,
        startDate: compareStartDate!,
        endDate: compareEndDate!,
      }),
      getSessionStats(projectId, {
        ...filters,
        startDate: compareStartDate!,
        endDate: compareEndDate!,
      }),
      getRevenue(
        projectId,
        {
          startDate: compareStartDate!,
          endDate: compareEndDate!,
          unit: (query.unit as string) || 'day',
          timezone: (query.timezone as string) || 'UTC',
          currency: 'USD',
        },
        filters,
      ),
    ]);
    const compareRevenue = groupRevenue(compareRevenueResult.chart);

    return c.json({
      pageviews,
      sessions,
      revenue,
      startDate: filters.startDate,
      endDate: filters.endDate,
      compare: {
        pageviews: comparePageviews,
        sessions: compareSessions,
        revenue: compareRevenue,
        startDate: compareStartDate,
        endDate: compareEndDate,
      },
    });
  }

  return c.json({ pageviews, sessions, revenue });
});

export default app;
