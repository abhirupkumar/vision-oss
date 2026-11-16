import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export type ProviderType = 'google' | 'openai' | 'anthropic' | 'openrouter';

export function createModelFromUserKey(provider: ProviderType, modelName: string | undefined, apiKey: string) {
  if (!apiKey) {
    throw new Error('API key is required.');
  }

  switch (provider) {
    case 'google': {
      const google = createGoogleGenerativeAI({ apiKey });
      return google(modelName || 'gemini-2.0-flash-001');
    }
    case 'openai': {
      const openai = createOpenAI({ apiKey });
      return openai(modelName || 'gpt-4o-mini');
    }
    case 'anthropic': {
      const anthropic = createAnthropic({ apiKey });
      return anthropic(modelName || 'claude-3-5-sonnet-20241022');
    }
    case 'openrouter': {
      const openrouter = createOpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey,
      });
      return openrouter(modelName || 'openai/gpt-4o-mini');
    }
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}
