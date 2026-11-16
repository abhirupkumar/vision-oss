import { tool } from 'ai';
import { z } from 'zod';

export const getEventsDeltaTool = tool({
  description: 'Get custom events and their week-over-week changes.',
  parameters: z.object({
    projectId: z.string(),
    lookbackDays: z.number().default(7),
  }),
  execute: async ({ projectId, lookbackDays }) => {
    // Call Tinybird vision_events_delta pipe
    return [
      { event_name: 'signup', current_counts: 120, previous_counts: 100, delta_pct: 20 },
      { event_name: 'purchase', current_counts: 45, previous_counts: 50, delta_pct: -10 },
    ];
  },
});
