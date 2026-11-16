import { tool } from 'ai';
import { z } from 'zod';

export const getTrafficMetricsTool = tool({
  description: 'Get high-level traffic metrics (visitors, sessions, pageviews) for a specific date range.',
  parameters: z.object({
    projectId: z.string(),
    startDate: z.string().describe('YYYY-MM-DD'),
    endDate: z.string().describe('YYYY-MM-DD'),
  }),
  execute: async ({ projectId, startDate, endDate }) => {
    // In a real implementation, call Tinybird or Clickhouse directly.
    return { visitors: 1200, sessions: 1500, pageviews: 4500 };
  },
});

export const getTopPagesTool = tool({
  description: 'Get the top pages by pageviews for a specific date range.',
  parameters: z.object({
    projectId: z.string(),
    startDate: z.string().describe('YYYY-MM-DD'),
    endDate: z.string().describe('YYYY-MM-DD'),
  }),
  execute: async ({ projectId, startDate, endDate }) => {
    return [
      { path: '/', views: 2000 },
      { path: '/pricing', views: 500 },
      { path: '/blog', views: 300 },
    ];
  },
});
