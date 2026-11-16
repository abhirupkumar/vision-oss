import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { streamText } from 'ai';
import { createModelFromUserKey, ProviderType } from '../../../../lib/ai/model-factory.js';
import { buildChatSystemPrompt } from '../../../../lib/ai/prompts.js';
import { createChatToolkit } from '../../../../lib/ai/tools/index.js';

const app = new Hono<{ Variables: { userId: string; auth: any } }>();

app.post('/', zValidator('json', z.object({
  projectId: z.string(),
  messages: z.array(z.any()),
  provider: z.enum(['google', 'openai', 'anthropic', 'openrouter']),
  model: z.string().optional(),
  apiKey: z.string().min(1, 'API key is required'),
  insightContext: z.any().optional(),
})), async (c) => {
  const { projectId, messages, provider, model: modelName, apiKey, insightContext } = c.req.valid('json');
  const env = process.env;
  const userId = c.get('userId');

  try {
    const model = createModelFromUserKey(provider as ProviderType, modelName, apiKey);
    const systemPrompt = buildChatSystemPrompt({ projectId, insightContext });
    const tools = createChatToolkit(projectId, userId, env);

    const result = await streamText({
      model,
      system: systemPrompt,
      messages,
      tools,
      maxSteps: 10,
    });

    return result.toDataStreamResponse();
  } catch (err: any) {
    return c.json({ error: 'ai_error', message: err?.message || 'Failed to complete AI request' }, 400);
  }
});

export default app;
