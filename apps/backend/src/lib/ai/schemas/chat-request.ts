import { z } from 'zod';

export const chatMessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(['system', 'user', 'assistant', 'data']),
  content: z.string(),
});

export const chatRequestSchema = z.object({
  projectId: z.string(),
  messages: z.array(chatMessageSchema),
  insightContext: z.object({
    insightId: z.string(),
    title: z.string(),
    description: z.string(),
    changePercent: z.number().optional(),
    currentPeriodFrom: z.string(),
    currentPeriodTo: z.string(),
    previousPeriodFrom: z.string(),
    previousPeriodTo: z.string(),
  }).optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
