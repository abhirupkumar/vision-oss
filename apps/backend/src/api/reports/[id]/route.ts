import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db, Report } from '@vision/db';
import { eq, and } from 'drizzle-orm';
import { notFound } from '../../../lib/response.js';

const app = new Hono<{ Variables: { userId: string } }>();

app.get('/', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  const report = await db.query.Report.findFirst({
    where: and(eq(Report.id, id), eq(Report.userId, userId)),
  });

  if (!report) return notFound();
  return c.json(report);
});

app.patch('/', zValidator('json', z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  parameters: z.any().optional(),
})), async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');
  const data = c.req.valid('json');

  const [report] = await db.update(Report)
    .set(data)
    .where(and(eq(Report.id, id), eq(Report.userId, userId)))
    .returning();

  if (!report) return notFound();
  return c.json(report);
});

app.delete('/', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  const [deleted] = await db.delete(Report)
    .where(and(eq(Report.id, id), eq(Report.userId, userId)))
    .returning();

  if (!deleted) return notFound();
  return c.json({ success: true });
});

export default app;
