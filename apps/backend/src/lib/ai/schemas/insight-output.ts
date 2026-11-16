import { z } from 'zod';

export const InsightTypeEnum = z.enum([
  'traffic_drop', 'traffic_spike', 'funnel_regression', 'conversion_leak',
  'bounce_rate_change', 'engagement_change', 'referrer_change', 'page_trend',
  'positive_trend', 'custom_event_spike', 'performance', 'revenue_change',
  'segment_regression', 'error_spike', 'vitals_degraded',
]);
export type InsightType = z.infer<typeof InsightTypeEnum>;

export const insightMetricSchema = z.object({
  label: z.string(),
  current: z.number(),
  previous: z.number().optional(),
  format: z.enum(['number', 'percent', 'duration_ms', 'currency']).default('number'),
});

export const insightActionSchema = z.object({
  type: z.enum([
    'investigate_further', // Ask Agent with pre-filled prompt
    'view_funnel',         // Deep-link to /funnels?id=xxx
    'view_events',         // Deep-link to /events?name=xxx
    'view_sessions',       // Deep-link to /sessions
    'view_utm',            // Deep-link to UTM report
    'view_revenue',        // Deep-link to revenue page
    'create_annotation',   // Creates annotation in Postgres
    'code_fix',            // Copies prompt to clipboard
  ]),
  label: z.string(),
  params: z.record(z.string(), z.string()),
});

export const visionInsightOutputSchema = z.object({
  title: z.string().max(100),
  description: z.string().max(400),       // "Why it matters"
  suggestion: z.string().max(300),        // "Do this next"
  rootCause: z.string().optional(),
  severity: z.enum(['critical', 'warning', 'info']),
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  type: InsightTypeEnum,
  priority: z.number().int().min(1).max(10),
  confidence: z.number().min(0).max(1),
  changePercent: z.number().optional(),
  subjectKey: z.string().min(1),         // stable ID like 'signup_funnel_step2'
  sources: z.array(z.enum(['traffic', 'funnels', 'events', 'revenue'])).min(1),
  metrics: z.array(insightMetricSchema).min(1).max(5),
  evidence: z.array(z.object({
    type: z.enum(['segment', 'funnel_step', 'page', 'temporal', 'metric']),
    description: z.string(),
  })).max(5).optional(),
  actions: z.array(insightActionSchema).max(3).optional(),
  investigationDepth: z.enum(['surface', 'investigated', 'deep']).optional(),
});

export type VisionInsightOutput = z.infer<typeof visionInsightOutputSchema>;
