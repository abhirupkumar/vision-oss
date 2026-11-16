import { tool } from 'ai';
import { z } from 'zod';

export const listSegmentsTool = tool({
  description: 'List all existing user segments for a project.',
  parameters: z.object({
    projectId: z.string(),
  }),
  execute: async ({ projectId }) => {
    return [
      { id: 's1', name: 'Active Users', type: 'filter' },
      { id: 's2', name: 'Churned Users', type: 'filter' },
    ];
  },
});
