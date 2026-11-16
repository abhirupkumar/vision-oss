import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { updateLlmScore } from '@vision/db';

const app = new Hono();

const schema = z.object({
  eventId: z.string(),
  score: z.number().min(0).max(1),
});

app.post('/', zValidator('json', schema), async (c) => {
  const projectId = c.req.param('projectId');
  const { eventId, score } = c.req.valid('json');

  try {
    await updateLlmScore(projectId, eventId, score);
    return c.json({ success: true });
  } catch (err: any) {
    console.error('[llm-scores] Failed to update score:', err);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

export default app;
