import { tool } from 'ai';
import { z } from 'zod';
import { clickhouse } from '@vision/db';

export const getPerformanceMetricsTool = tool({
  description: 'Get Core Web Vitals (LCP, INP, CLS) and page load performance metrics for a specific date range.',
  parameters: z.object({
    projectId: z.string(),
    startDate: z.string().describe('YYYY-MM-DD'),
    endDate: z.string().describe('YYYY-MM-DD'),
  }),
  execute: async ({ projectId, startDate, endDate }) => {
    try {
      const query = `
        SELECT 
          avg(lcp) as avg_lcp,
          avg(inp) as avg_inp,
          avg(cls) as avg_cls,
          avg(fcp) as avg_fcp,
          avg(ttfb) as avg_ttfb
        FROM project_event
        WHERE project_id = {projectId:String}
        AND created_at BETWEEN toDateTime64({startDate:String}, 3, 'UTC') AND toDateTime64({endDate:String}, 3, 'UTC')
        AND event_type = 1
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
