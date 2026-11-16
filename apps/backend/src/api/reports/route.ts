import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import crypto from 'node:crypto';
import { db, Report } from '@vision/db';
import { eq } from 'drizzle-orm';

const app = new Hono<{ Variables: { userId: string } }>();

app.get('/', async (c) => {
  const userId = c.get('userId');
  const reports = await db.query.Report.findMany({
    where: eq(Report.userId, userId),
  });
  return c.json(reports);
});

app.post('/', zValidator('json', z.object({
  name: z.string(),
  description: z.string().optional(),
  type: z.string(),
  parameters: z.any().optional(),
  projectId: z.string(),
})), async (c) => {
  const data = c.req.valid('json');
  const userId = c.get('userId');

  const [report] = await db.insert(Report).values({
    id: crypto.randomUUID(),
    userId,
    projectId: data.projectId,
    type: data.type,
    name: data.name,
    description: data.description || '',
    parameters: data.parameters || {},
  }).returning();

  return c.json(report);
});

export default app;
