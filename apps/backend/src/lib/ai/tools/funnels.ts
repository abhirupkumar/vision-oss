import { tool } from 'ai';
import { z } from 'zod';

export const listFunnelsTool = tool({
  description: 'List all existing funnels for a project.',
  parameters: z.object({
    projectId: z.string(),
  }),
  execute: async ({ projectId }) => {
    // Query DB for funnels
    return [
      { id: 'f1', name: 'Signup Flow', steps: 3 },
    ];
  },
});

export const getFunnelAnalyticsTool = tool({
  description: 'Get step-by-step analytics for a specific funnel.',
  parameters: z.object({
    projectId: z.string(),
    funnelId: z.string(),
    startDate: z.string(),
    endDate: z.string(),
  }),
  execute: async ({ projectId, funnelId, startDate, endDate }) => {
    return [
      { step: 1, name: 'Landing', count: 1000, dropoff: 0 },
      { step: 2, name: 'Pricing', count: 500, dropoff: 50 },
      { step: 3, name: 'Signup', count: 100, dropoff: 80 },
    ];
  },
});
