import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  console.warn('[Vision AI] GEMINI_API_KEY is not set. AI features will not work.');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Get the Gemini 1.5 Flash model (fast, cost-efficient for tool use).
 */
export function getGeminiModel(modelName = 'gemini-1.5-flash') {
  return genAI.getGenerativeModel({ model: modelName });
}

/**
 * Get the Gemini 1.5 Pro model (more powerful for complex analysis).
 */
export function getGeminiProModel() {
  return getGeminiModel('gemini-2.5-pro');
}

export default genAI;
