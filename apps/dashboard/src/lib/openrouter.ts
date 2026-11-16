import OpenAI from 'openai';

if (!process.env.OPENROUTER_API_KEY) {
  console.warn('[Vision AI] OPENROUTER_API_KEY is not set. AI features will not work.');
}

/**
 * OpenRouter client — drop-in OpenAI-compatible API.
 * Set OPENROUTER_API_KEY in your .env file.
 * Optionally set OPENROUTER_MODEL to override the default model.
 *
 * @see https://openrouter.ai/docs
 */
const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || '',
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://vision-analytics.app',
    'X-Title': 'Vision Analytics',
  },
});

/** Default model — can be overridden via env. */
export const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || 'google/gemma-4-31b-it:free';

/** Faster / cheaper model for chat tool-calling. */
export const CHAT_MODEL = process.env.OPENROUTER_CHAT_MODEL || 'google/gemma-4-31b-it:free';

/** Smarter model for deep analysis (Playbook). */
export const ANALYSIS_MODEL = process.env.OPENROUTER_ANALYSIS_MODEL || 'google/gemma-4-31b-it:free';

export default openrouter;
