import { tool } from 'ai';
import { z } from 'zod';
import { clickhouse } from '@vision/db';

export const listSessionReplaysTool = tool({
  description: 'Get a list of recent session replays available for analysis.',
  parameters: z.object({
    projectId: z.string(),
    startDate: z.string().describe('YYYY-MM-DD'),
    endDate: z.string().describe('YYYY-MM-DD'),
    limit: z.number().optional().default(10),
  }),
  execute: async ({ projectId, startDate, endDate, limit }) => {
    try {
      const query = `
        SELECT session_id, max(started_at) as started_at, max(ended_at) as ended_at, sum(event_count) as total_events
        FROM session_replay
        WHERE project_id = {projectId:String}
        AND created_at BETWEEN toDateTime64({startDate:String}, 3, 'UTC') AND toDateTime64({endDate:String}, 3, 'UTC')
        GROUP BY session_id
        ORDER BY started_at DESC
        LIMIT {limit:UInt32}
      `;
      const data = await clickhouse.rawQuery(query, {
        projectId,
        startDate: startDate + ' 00:00:00',
        endDate: endDate + ' 23:59:59',
        limit
      });
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});

export const getSessionReplayEventsTool = tool({
  description: 'Get the DOM mutation events and mouse tracking data for a specific session replay. This is heavily chunked/summarized to prevent token overflow.',
  parameters: z.object({
    projectId: z.string(),
    sessionId: z.string(),
  }),
  execute: async ({ projectId, sessionId }) => {
    try {
      const query = `
        SELECT chunk_index, event_count, length(events) as byte_size
        FROM session_replay
        WHERE project_id = {projectId:String}
        AND session_id = {sessionId:String}
        ORDER BY chunk_index ASC
        LIMIT 5
      `;
      const data = await clickhouse.rawQuery(query, {
        projectId,
        sessionId
      });
      return { 
        success: true, 
        message: 'Raw DOM events are too large to return fully. Here is the metadata for the first 5 chunks of the replay.',
        chunks: data 
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
});
