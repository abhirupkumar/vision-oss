/**
 * Unified AI provider for Vision Analytics.
 *
 * Supports two backends:
 *   - google      →  @google/generative-ai  (default)
 *   - openrouter  →  openai SDK → openrouter.ai
 *
 * Configuration env vars:
 *   AI_PROVIDER                 = "google" | "openrouter"   (default: "google")
 *   GEMINI_API_KEY              = Google AI API key
 *   GOOGLE_AI_MODEL             = override Google chat model  (default: gemini-2.0-flash)
 *   GOOGLE_ANALYSIS_MODEL       = override Google analysis model (default: gemini-2.5-flash-preview-05-20)
 *   OPENROUTER_API_KEY          = OpenRouter API key
 *   OPENROUTER_CHAT_MODEL       = override OpenRouter chat model
 *   OPENROUTER_ANALYSIS_MODEL   = override OpenRouter analysis model
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import openrouterClient, {
  ANALYSIS_MODEL as OR_ANALYSIS_MODEL,
  CHAT_MODEL as OR_CHAT_MODEL,
} from './openrouter';

// ── Provider selection ────────────────────────────────────────────────────────

export type ProviderName = 'google' | 'openrouter';
export const AI_PROVIDER: ProviderName = (process.env.AI_PROVIDER || 'openrouter') as ProviderName;

// ── Model names ───────────────────────────────────────────────────────────────

export const GOOGLE_CHAT_MODEL = process.env.GOOGLE_AI_MODEL || 'gemini-3.1-pro-preview';
export const GOOGLE_ANALYSIS_MODEL = process.env.GOOGLE_ANALYSIS_MODEL || 'gemini-3.1-pro-preview';

// Re-export OpenRouter model names for convenience
export { OR_CHAT_MODEL, OR_ANALYSIS_MODEL };

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface AICompletion {
  text: string | null;
  toolCalls: ToolCall[];
}

// ── Schema conversion: OpenAI (lowercase) → Gemini (UPPERCASE) ────────────────

function toGeminiSchema(schema: any): any {
  if (!schema || typeof schema !== 'object') return schema;
  const out: any = {};
  for (const [k, v] of Object.entries(schema)) {
    if (k === 'type' && typeof v === 'string') {
      out.type = v.toUpperCase();
    } else if (k === 'properties' && typeof v === 'object') {
      out.properties = {};
      for (const [pk, pv] of Object.entries(v as object)) {
        out.properties[pk] = toGeminiSchema(pv);
      }
    } else if (k === 'items') {
      out.items = toGeminiSchema(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

// ── Message conversion: OpenAI format → Gemini contents ──────────────────────

function toGeminiContents(messages: any[]): any[] {
  // Build tool_call_id → function_name map (needed for functionResponse)
  const toolCallMap = new Map<string, string>();
  for (const msg of messages) {
    if (msg.role === 'assistant' && msg.tool_calls) {
      for (const tc of msg.tool_calls) {
        toolCallMap.set(tc.id, tc.function?.name ?? 'unknown');
      }
    }
  }

  const contents: any[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') continue; // handled via systemInstruction

    if (msg.role === 'user') {
      contents.push({ role: 'user', parts: [{ text: msg.content ?? '' }] });
    } else if (msg.role === 'assistant') {
      const parts: any[] = [];
      if (msg.content) parts.push({ text: msg.content });
      for (const tc of msg.tool_calls ?? []) {
        let args: any = {};
        try {
          args = JSON.parse(tc.function?.arguments || '{}');
        } catch {}
        parts.push({ functionCall: { name: tc.function?.name, args } });
      }
      if (parts.length > 0) contents.push({ role: 'model', parts });
    } else if (msg.role === 'tool') {
      const fnName = toolCallMap.get(msg.tool_call_id) ?? 'unknown';
      let response: any;
      try {
        response = JSON.parse(msg.content);
      } catch {
        response = { result: msg.content };
      }

      const fnPart = { functionResponse: { name: fnName, response } };
      const prev = contents[contents.length - 1];

      // Merge consecutive tool responses into one user turn (Gemini requirement)
      if (prev?.role === 'user' && prev.parts?.every((p: any) => p.functionResponse)) {
        prev.parts.push(fnPart);
      } else {
        contents.push({ role: 'user', parts: [fnPart] });
      }
    }
  }

  return contents;
}

// ── Google Gemini implementation ──────────────────────────────────────────────

async function googleComplete(messages: any[], tools: any[], model: string): Promise<AICompletion> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Add it to your .env file.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const systemMsg = messages.find((m: any) => m.role === 'system');

  // Convert tools to Gemini function declarations
  const functionDeclarations = tools.map((t: any) => {
    const fn = t.function ?? t; // support both OpenAI wrapper and flat format
    return {
      name: fn.name,
      description: fn.description,
      parameters: toGeminiSchema(fn.parameters),
    };
  });

  const modelConfig: any = {
    model,
    generationConfig: { temperature: 0.3 },
    ...(systemMsg ? { systemInstruction: systemMsg.content } : {}),
  };

  if (functionDeclarations.length > 0) {
    modelConfig.tools = [{ functionDeclarations }];
    modelConfig.toolConfig = { functionCallingConfig: { mode: 'AUTO' } };
  }

  const genModel = genAI.getGenerativeModel(modelConfig);
  const contents = toGeminiContents(messages);

  const result = await genModel.generateContent({ contents });
  const candidate = result.response.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];

  let text: string | null = null;
  const toolCalls: ToolCall[] = [];

  for (const part of parts) {
    if (part.text) text = (text ?? '') + part.text;
    if (part.functionCall) {
      toolCalls.push({
        id: `gemini-${part.functionCall.name}-${Date.now()}-${toolCalls.length}`,
        name: part.functionCall.name,
        arguments: part.functionCall.args ?? {},
      });
    }
  }

  return { text: text?.trim() ?? null, toolCalls };
}

// ── OpenRouter implementation ─────────────────────────────────────────────────

async function openrouterComplete(
  messages: any[],
  tools: any[],
  model: string,
): Promise<AICompletion> {
  // Ensure tools are in OpenAI { type:'function', function:{...} } format
  const openaiTools = tools.map((t: any) =>
    t.type === 'function'
      ? t
      : {
          type: 'function' as const,
          function: { name: t.name, description: t.description, parameters: t.parameters },
        },
  );

  const response = await openrouterClient.chat.completions.create({
    model,
    messages,
    ...(openaiTools.length > 0 ? { tools: openaiTools, tool_choice: 'auto' } : {}),
  } as any);

  const choice = response.choices[0];

  // Strip Qwen3/DeepSeek chain-of-thought tags
  const rawText = choice?.message?.content ?? '';
  const text =
    rawText
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
      .trim() || null;

  const toolCalls: ToolCall[] = (choice?.message?.tool_calls ?? []).map((tc: any) => {
    let args: Record<string, any> = {};
    try {
      args = JSON.parse(tc.function?.arguments || '{}');
    } catch {}
    return { id: tc.id, name: tc.function?.name ?? 'unknown', arguments: args };
  });

  return { text, toolCalls };
}

// ── Unified API ───────────────────────────────────────────────────────────────

/**
 * Call the active AI provider for chat with tool-calling support.
 * Messages must be in OpenAI format (role: system/user/assistant/tool).
 * Tools can be in OpenAI { type:'function', function:{...} } format OR flat { name, description, parameters }.
 */
export async function aiComplete(
  messages: any[],
  tools: any[],
  options?: { provider?: ProviderName; model?: string },
): Promise<AICompletion> {
  const provider = options?.provider ?? AI_PROVIDER;
  if (provider === 'google') {
    return googleComplete(messages, tools, options?.model ?? GOOGLE_CHAT_MODEL);
  }
  return openrouterComplete(messages, tools, options?.model ?? OR_CHAT_MODEL);
}

/**
 * Call the active AI provider for deep analysis (no tools, optimised for long-form reasoning).
 * Used by Playbook and similar features.
 */
export async function aiCompleteAnalysis(
  messages: any[],
  options?: { provider?: ProviderName },
): Promise<AICompletion> {
  const provider = options?.provider ?? AI_PROVIDER;
  if (provider === 'google') {
    return googleComplete(messages, [], GOOGLE_ANALYSIS_MODEL);
  }
  return openrouterComplete(messages, [], OR_ANALYSIS_MODEL);
}
