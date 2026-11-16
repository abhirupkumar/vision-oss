import { Hono } from 'hono';
import { getUnitEconomics } from '@vision/db';
import { canViewProject } from '../../../../../lib/permissions/project.js';
import { unauthorized } from '../../../../../lib/response.js';

const app = new Hono<{ Variables: { auth: any } }>();

app.get('/', async (c) => {
  const projectId = c.req.param('projectId');
  const auth = c.get('auth');

  if (!(await canViewProject(auth, projectId))) {
    return unauthorized();
  }

  try {
    const data = await getUnitEconomics(projectId);
    return c.json(data);
  } catch (err) {
    console.error('[revenue/unit-economics] error:', err);
    return c.json({
      totalRevenue: 0,
      totalLlmCost: 0,
      grossMargin: 0,
      grossMarginPct: 0,
      avgCostToServePerActiveUser: 0,
      aiRoiRatio: 0,
      unprofitableUserCount: 0,
      marginDistribution: [],
    });
  }
});

export default app;
