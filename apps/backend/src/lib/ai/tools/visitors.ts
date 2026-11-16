import { tool } from 'ai';
import { z } from 'zod';
import { clickhouse } from '@vision/db';

export const getVisitorsTool = tool({
  description: 'Get a list of recent visitors with their total sessions and revenue.',
  parameters: z.object({
    projectId: z.string(),
    startDate: z.string().describe('YYYY-MM-DD'),
    endDate: z.string().describe('YYYY-MM-DD'),
    limit: z.number().optional().default(50),
  }),
  execute: async ({ projectId, startDate, endDate, limit }) => {
    try {
      const query = `
        SELECT visitor_id, max(last_seen) as last_seen, count(total_sessions) as total_sessions, sum(total_revenue) as total_revenue
        FROM project_visitor_stats
        WHERE project_id = {projectId:String}
        AND visitor_date BETWEEN toDate({startDate:String}) AND toDate({endDate:String})
        GROUP BY visitor_id
        ORDER BY last_seen DESC
        LIMIT {limit:UInt32}
      `;
      const data = await clickhouse.rawQuery(query, {
        projectId,
        startDate,
        endDate,
        limit
      });
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});

export const getVisitorMetricsTool = tool({
  description: 'Get unique visitor metrics and trends over a date range.',
  parameters: z.object({
    projectId: z.string(),
    startDate: z.string().describe('YYYY-MM-DD'),
    endDate: z.string().describe('YYYY-MM-DD'),
  }),
  execute: async ({ projectId, startDate, endDate }) => {
    try {
      const query = `
        SELECT 
          count(distinct visitor_id) as total_visitors,
          sum(total_revenue) as total_revenue
        FROM project_visitor_stats
        WHERE project_id = {projectId:String}
        AND visitor_date BETWEEN toDate({startDate:String}) AND toDate({endDate:String})
      `;
      const data = await clickhouse.rawQuery(query, {
        projectId,
        startDate,
        endDate
      });
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});
