import { tool } from 'ai';
import { z } from 'zod';
import { clickhouse } from '@vision/db';

export const getRevenueMetricsTool = tool({
  description: 'Get revenue metrics including total revenue, ARPU, and recent purchases for a specific date range.',
  parameters: z.object({
    projectId: z.string(),
    startDate: z.string().describe('YYYY-MM-DD'),
    endDate: z.string().describe('YYYY-MM-DD'),
  }),
  execute: async ({ projectId, startDate, endDate }) => {
    try {
      const query = `
        SELECT 
          sum(revenue) as total_revenue,
          count(distinct session_id) as paying_customers,
          sum(revenue) / nullIf(count(distinct session_id), 0) as arpu
        FROM project_revenue
        WHERE project_id = {projectId:String}
        AND created_at BETWEEN toDateTime64({startDate:String}, 3, 'UTC') AND toDateTime64({endDate:String}, 3, 'UTC')
      `;
      const data = await clickhouse.rawQuery(query, {
        projectId,
        startDate: startDate + ' 00:00:00',
        endDate: endDate + ' 23:59:59'
      });
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});
