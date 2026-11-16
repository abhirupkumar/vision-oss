import { tool } from 'ai';
import { z } from 'zod';
import { db, Report, Segment } from '@vision/db';
import { eq, and } from 'drizzle-orm';

export const createFunnelTool = (userId: string) => tool({
  description: 'Create a funnel to track a user journey. 2-10 steps where target is a page path (PAGE_VIEW) or event name. confirmed=false shows preview.',
  parameters: z.object({
    projectId: z.string(),
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    steps: z.array(z.object({
      type: z.enum(['PAGE_VIEW', 'EVENT', 'CUSTOM']),
      target: z.string().min(1),
      name: z.string().min(1),
      conditions: z.record(z.string(), z.unknown()).optional(),
    })).min(2).max(10),
    filters: z.array(z.object({
      field: z.string(),
      operator: z.enum(['equals', 'contains', 'not_equals', 'in', 'not_in']),
      value: z.union([z.string(), z.array(z.string())]),
    })).optional(),
    ignoreHistoricData: z.boolean().optional(),
    confirmed: z.boolean().describe('false=preview, true=apply'),
  }),
  execute: async ({ projectId, name, description, steps, filters, ignoreHistoricData, confirmed }) => {
    if (!confirmed) {
      return {
        preview: true,
        message: 'Please review the funnel details below and confirm if you want to create it:',
        funnel: { name, description, steps, filters },
        confirmationRequired: true,
        instruction: "To create this funnel, the user must explicitly confirm.",
      };
    }
    
    const reportId = crypto.randomUUID();
    const parameters = { steps, filters, ignoreHistoricData };
    
    await db.insert(Report).values({
      id: reportId,
      projectId,
      userId,
      name,
      description: description || '',
      type: 'funnel',
      parameters,
      updatedAt: new Date(),
    });
    
    return { success: true, message: `Funnel created successfully with ID: ${reportId}` };
  },
});

export const updateFunnelTool = tool({
  description: 'Update an existing funnel. confirmed=false shows preview.',
  parameters: z.object({
    funnelId: z.string(),
    projectId: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
    steps: z.any().optional(),
    confirmed: z.boolean(),
  }),
  execute: async ({ funnelId, projectId, name, description, steps, confirmed }) => {
    if (!confirmed) {
      return { preview: true, confirmationRequired: true, message: 'Review funnel update and confirm.' };
    }
    await db.update(Report).set({ 
      ...(name && { name }), 
      ...(description && { description }),
      ...(steps && { parameters: { steps } }),
      updatedAt: new Date()
    }).where(and(eq(Report.id, funnelId), eq(Report.projectId, projectId)));
    return { success: true, message: 'Funnel updated.' };
  }
});

export const deleteFunnelTool = tool({
  description: 'Delete a funnel. MUST set confirmed=false first.',
  parameters: z.object({
    funnelId: z.string(),
    projectId: z.string(),
    confirmed: z.boolean(),
  }),
  execute: async ({ funnelId, projectId, confirmed }) => {
    if (!confirmed) {
      return { 
        preview: true, 
        confirmationRequired: true, 
        message: 'WARNING: You are about to permanently delete this funnel. Please confirm to proceed.',
        instruction: 'Wait for user to say yes before calling with confirmed=true.'
      };
    }
    await db.delete(Report).where(and(eq(Report.id, funnelId), eq(Report.projectId, projectId)));
    return { success: true, message: 'Funnel deleted.' };
  }
});

export const createSegmentTool = () => tool({
  description: 'Create a segment (cohort). confirmed=false shows preview.',
  parameters: z.object({
    projectId: z.string(),
    name: z.string(),
    filters: z.any(),
    confirmed: z.boolean(),
  }),
  execute: async ({ projectId, name, filters, confirmed }) => {
    if (!confirmed) return { preview: true, confirmationRequired: true, message: 'Confirm segment creation.' };
    const id = crypto.randomUUID();
    await db.insert(Segment).values({ id, projectId, name, type: 'segment', parameters: filters });
    return { success: true, id };
  }
});

export const updateCohortTool = tool({
  description: 'Update an existing cohort/segment. confirmed=false shows preview.',
  parameters: z.object({
    cohortId: z.string(),
    projectId: z.string(),
    name: z.string().optional(),
    filters: z.any().optional(),
    confirmed: z.boolean(),
  }),
  execute: async ({ cohortId, projectId, name, filters, confirmed }) => {
    if (!confirmed) return { preview: true, confirmationRequired: true, message: 'Confirm update.' };
    await db.update(Segment).set({ 
      ...(name && { name }), 
      ...(filters && { parameters: filters }),
      updatedAt: new Date()
    }).where(and(eq(Segment.id, cohortId), eq(Segment.projectId, projectId)));
    return { success: true, message: 'Cohort updated.' };
  }
});

export const deleteCohortTool = tool({
  description: 'Delete a cohort/segment. MUST set confirmed=false first.',
  parameters: z.object({
    cohortId: z.string(),
    projectId: z.string(),
    confirmed: z.boolean(),
  }),
  execute: async ({ cohortId, projectId, confirmed }) => {
    if (!confirmed) {
      return { 
        preview: true, 
        confirmationRequired: true, 
        message: 'WARNING: You are about to permanently delete this cohort. Please confirm to proceed.',
        instruction: 'Wait for user to say yes before calling with confirmed=true.'
      };
    }
    await db.delete(Segment).where(and(eq(Segment.id, cohortId), eq(Segment.projectId, projectId)));
    return { success: true, message: 'Cohort deleted.' };
  }
});
