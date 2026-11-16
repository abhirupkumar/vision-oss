import { tool } from 'ai';
import { z } from 'zod';
import { clickhouse } from '@vision/db';

export const getSessionsTool = tool({
  description: 'Get a list of recent sessions and their details (browser, os, device, country).',
  parameters: z.object({
    projectId: z.string(),
    startDate: z.string().describe('YYYY-MM-DD'),
    endDate: z.string().describe('YYYY-MM-DD'),
    limit: z.number().optional().default(50),
  }),
  execute: async ({ projectId, startDate, endDate, limit }) => {
    try {
      const query = `
        SELECT session_id, browser, os, device, country, start_time, end_time, views, events
        FROM project_session_stats
        WHERE project_id = {projectId:String}
        AND session_date BETWEEN toDate({startDate:String}) AND toDate({endDate:String})
        ORDER BY start_time DESC
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

export const getSessionMetricsTool = tool({
  description: 'Get aggregate session metrics such as total sessions, total views, and average session duration.',
  parameters: z.object({
    projectId: z.string(),
    startDate: z.string().describe('YYYY-MM-DD'),
    endDate: z.string().describe('YYYY-MM-DD'),
  }),
  execute: async ({ projectId, startDate, endDate }) => {
    try {
      const query = `
        SELECT 
          count(distinct session_id) as total_sessions,
          sum(views) as total_views,
          sum(events) as total_events,
          avg(dateDiff('second', start_time, end_time)) as avg_duration_seconds
        FROM project_session_stats
        WHERE project_id = {projectId:String}
        AND session_date BETWEEN toDate({startDate:String}) AND toDate({endDate:String})
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
