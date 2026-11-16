import { tool } from 'ai';
import { z } from 'zod';
import { clickhouse } from '@vision/db';

export const getCohortAnalyticsTool = tool({
  description: 'Get cohort retention analytics to see how well users are returning after their first visit.',
  parameters: z.object({
    projectId: z.string(),
    dateRange: z.object({
      startDate: z.string().describe('YYYY-MM-DD'),
      endDate: z.string().describe('YYYY-MM-DD'),
    }),
  }),
  execute: async ({ projectId, dateRange }) => {
    try {
      const query = `
        WITH first_visits AS (
          SELECT visitor_id, min(date(created_at)) as first_visit_date
          FROM project_event
          WHERE project_id = {projectId:String}
          GROUP BY visitor_id
        ),
        all_visits AS (
          SELECT visitor_id, date(created_at) as visit_date
          FROM project_event
          WHERE project_id = {projectId:String}
        )
        SELECT 
          f.first_visit_date,
          dateDiff('day', f.first_visit_date, a.visit_date) as day_offset,
          count(distinct a.visitor_id) as returning_visitors
        FROM first_visits f
        JOIN all_visits a ON f.visitor_id = a.visitor_id
        WHERE f.first_visit_date BETWEEN toDate({startDate:String}) AND toDate({endDate:String})
        GROUP BY f.first_visit_date, day_offset
        ORDER BY f.first_visit_date, day_offset
      `;
      const data = await clickhouse.rawQuery(query, {
        projectId,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});
