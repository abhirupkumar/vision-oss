/**
 * LLM Provider Registry
 *
 * Contains:
 *  - Provider routing config (base URLs, auth header names)
 *  - Request parsers  — extract model, prompt, params from request body
 *  - Response parsers — extract tokens, output, tool calls from accumulated SSE/JSON buffer
 */

export interface ProviderConfig {
  /** Real provider API base URL (no trailing slash). */
  baseUrl: string;
  /** Which header carries the API key when forwarding to the provider. */
  authHeader: 'Authorization' | 'x-api-key' | 'api-key';
  /** Prefix to prepend to the key value (e.g. 'Bearer '). */
  authPrefix: 'Bearer ' | '';
}

export interface ParsedRequest {
  model: string;
  prompt: string | null;           // JSON-stringified messages / input, truncated to 50k
  toolDefinitions: any[];
  modelParameters: Record<string, any>;
  isStreaming: boolean;
}

export interface ParsedResponse {
  output: string | null;           // text output, truncated to 50k
  toolCalls: any[];
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  promptCacheReadTokens: number | null;
  promptCacheWriteTokens: number | null;
  reasoningTokens: number | null;
  usageDetails: Record<string, any>;
}

// ─── Provider configs ─────────────────────────────────────────────────────────────────────────────

export const PROVIDERS: Record<string, ProviderConfig> = {
  openai:     { baseUrl: 'https://api.openai.com',                    authHeader: 'Authorization', authPrefix: 'Bearer ' },
  anthropic:  { baseUrl: 'https://api.anthropic.com',                 authHeader: 'x-api-key',     authPrefix: '' },
  google:     { baseUrl: 'https://generativelanguage.googleapis.com',  authHeader: 'Authorization', authPrefix: 'Bearer ' },
  mistral:    { baseUrl: 'https://api.mistral.ai',                    authHeader: 'Authorization', authPrefix: 'Bearer ' },
  groq:       { baseUrl: 'https://api.groq.com/openai/v1',            authHeader: 'Authorization', authPrefix: 'Bearer ' },
  cohere:     { baseUrl: 'https://api.cohere.ai',                     authHeader: 'Authorization', authPrefix: 'Bearer ' },
  together:   { baseUrl: 'https://api.together.xyz',                  authHeader: 'Authorization', authPrefix: 'Bearer ' },
  openrouter: { baseUrl: 'https://openrouter.ai/api',                 authHeader: 'Authorization', authPrefix: 'Bearer ' },
  deepseek:   { baseUrl: 'https://api.deepseek.com',                  authHeader: 'Authorization', authPrefix: 'Bearer ' },
  perplexity: { baseUrl: 'https://api.perplexity.ai',                authHeader: 'Authorization', authPrefix: 'Bearer ' },
  fireworks:  { baseUrl: 'https://api.fireworks.ai/inference',        authHeader: 'Authorization', authPrefix: 'Bearer ' },
  xai:        { baseUrl: 'https://api.x.ai',                          authHeader: 'Authorization', authPrefix: 'Bearer ' },
  nebius:     { baseUrl: 'https://api.tokenfactory.nebius.com',       authHeader: 'Authorization', authPrefix: 'Bearer ' },
  novita:     { baseUrl: 'https://api.novita.ai',                     authHeader: 'Authorization', authPrefix: 'Bearer ' },
  cerebras:   { baseUrl: 'https://api.cerebras.ai',                   authHeader: 'Authorization', authPrefix: 'Bearer ' },
  deepinfra:  { baseUrl: 'https://api.deepinfra.com',                 authHeader: 'Authorization', authPrefix: 'Bearer ' },
  anyscale:   { baseUrl: 'https://api.endpoints.anyscale.com',        authHeader: 'Authorization', authPrefix: 'Bearer ' },
  llama:      { baseUrl: 'https://api.llama.com',                     authHeader: 'Authorization', authPrefix: 'Bearer ' },
  lemonfox:   { baseUrl: 'https://api.lemonfox.ai',                   authHeader: 'Authorization', authPrefix: 'Bearer ' },
  qstash:     { baseUrl: 'https://qstash.upstash.io',                 authHeader: 'Authorization', authPrefix: 'Bearer ' },
  vercel:     { baseUrl: 'https://ai-gateway.vercel.sh',              authHeader: 'Authorization', authPrefix: 'Bearer ' },
  // Azure: baseUrl is dynamic or defaults to openai.azure.com — caller can inject X-Vision-Azure-Endpoint
  azure:      { baseUrl: 'https://openai.azure.com',                  authHeader: 'api-key',       authPrefix: '' },
};

// ─── Helpers ────────────────────────────────────────────────────────────────────────────────────

const TRUNCATION_LIMIT = 50_000;

function truncate(text: string | null | undefined): string | null {
  if (!text) return null;
  return text.length > TRUNCATION_LIMIT ? text.slice(0, TRUNCATION_LIMIT) : text;
}

export function wasTruncated(text: string | null | undefined): boolean {
  return !!text && text.length > TRUNCATION_LIMIT;
}

function tryParseJSON(text: string): any {
  try { return JSON.parse(text); } catch { return null; }
}

// ─── Request parsers ──────────────────────────────────────────────────────────────────────────────

export function parseOpenAIRequest(body: any): ParsedRequest {
  return {
    model: body?.model ?? '',
    prompt: truncate(JSON.stringify(body?.messages ?? [])),
    toolDefinitions: body?.tools ?? [],
    modelParameters: {
      temperature:        body?.temperature,
      max_tokens:         body?.max_tokens,
      top_p:              body?.top_p,
      frequency_penalty:  body?.frequency_penalty,
      presence_penalty:   body?.presence_penalty,
      seed:               body?.seed,
      stop:               body?.stop,
    },
    isStreaming: body?.stream === true,
  };
}

export function parseAnthropicRequest(body: any): ParsedRequest {
  const messages = [
    ...(body?.system ? [{ role: 'system', content: body.system }] : []),
    ...(body?.messages ?? []),
  ];
  return {
    model: body?.model ?? '',
    prompt: truncate(JSON.stringify(messages)),
    toolDefinitions: body?.tools ?? [],
    modelParameters: {
      max_tokens:   body?.max_tokens,
      temperature:  body?.temperature,
      top_p:        body?.top_p,
    },
    isStreaming: body?.stream === true,
  };
}

export function parseGoogleRequest(body: any): ParsedRequest {
  return {
    model: body?.model ?? '',
    prompt: truncate(JSON.stringify(body?.contents ?? [])),
    toolDefinitions: body?.tools ?? [],
    modelParameters: {
      temperature:     body?.generationConfig?.temperature,
      max_tokens:      body?.generationConfig?.maxOutputTokens,
      top_p:           body?.generationConfig?.topP,
    },
    isStreaming: false, // Google uses separate streaming endpoint
  };
}

/** Generic fallback parser for unknown providers. */
export function parseGenericRequest(body: any): ParsedRequest {
  return {
    model: body?.model ?? '',
    prompt: truncate(JSON.stringify(body?.messages ?? body?.prompt ?? body ?? '')),
    toolDefinitions: body?.tools ?? [],
    modelParameters: {},
    isStreaming: body?.stream === true,
  };
}

// ─── Response parsers ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse accumulated SSE/JSON buffer from an OpenAI-compatible provider.
 * Works for both streaming (SSE lines) and non-streaming (single JSON object) responses.
 */
export function parseOpenAIResponse(chunks: string[]): ParsedResponse {
  const raw = chunks.join('');
  const isSSE = raw.trimStart().startsWith('data:');

  if (isSSE) {
    // ── Streaming path: parse SSE lines ──────────────────────────────────────────────────────────────────
    let outputText = '';
    let reasoningText = '';
    const toolCalls: any[] = [];
    let usage: any = null;

    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.replace(/^data:\s*/, '').trim();
      if (payload === '[DONE]') continue;
      const parsed = tryParseJSON(payload);
      if (!parsed) continue;

      const choice = parsed.choices?.[0];
      const delta = choice?.delta;

      // 1. Content
      if (delta?.content) {
        if (typeof delta.content === 'string') {
          outputText += delta.content;
        } else if (Array.isArray(delta.content)) {
          outputText += delta.content.map((p: any) => (typeof p === 'string' ? p : p?.text ?? '')).join('');
        }
      }

      // 2. Reasoning / Chain-of-thought (Groq, DeepSeek-R1, OpenAI o1/o3, Safeguard models)
      const reasoningChunk = delta?.reasoning ?? delta?.reasoning_content;
      if (reasoningChunk) {
        if (typeof reasoningChunk === 'string') {
          reasoningText += reasoningChunk;
        } else if (Array.isArray(reasoningChunk)) {
          reasoningText += reasoningChunk.map((p: any) => (typeof p === 'string' ? p : p?.text ?? '')).join('');
        }
      }

      // 3. Choice text (completions endpoint)
      if (choice?.text) {
        outputText += choice.text;
      }

      // Accumulate streaming tool call deltas
      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          if (tc.index !== undefined) {
            toolCalls[tc.index] = toolCalls[tc.index] ?? { id: tc.id, type: tc.type, function: { name: '', arguments: '' } };
            if (tc.function?.name)      toolCalls[tc.index].function.name += tc.function.name;
            if (tc.function?.arguments) toolCalls[tc.index].function.arguments += tc.function.arguments;
          }
        }
      }

      if (parsed.usage) usage = parsed.usage;
    }

    let finalOutput: string | null = null;
    if (outputText.trim() && reasoningText.trim()) {
      finalOutput = `<think>\n${reasoningText.trim()}\n</think>\n\n${outputText.trim()}`;
    } else if (outputText.trim()) {
      finalOutput = outputText;
    } else if (reasoningText.trim()) {
      finalOutput = `<think>\n${reasoningText.trim()}\n</think>`;
    }

    return buildOpenAIResponse(truncate(finalOutput), toolCalls.filter(Boolean), usage);
  } else {
    // ── Non-streaming path: parse single JSON body ─────────────────────────────────────────────────────
    const parsed = tryParseJSON(raw);
    if (!parsed) return emptyResponse();

    const choice = parsed.choices?.[0];
    const message = choice?.message;

    // 1. Content
    let content: string | null = null;
    const rawContent = message?.content ?? choice?.text ?? parsed.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? null;
    if (typeof rawContent === 'string') {
      content = rawContent;
    } else if (Array.isArray(rawContent)) {
      content = rawContent.map((p: any) => (typeof p === 'string' ? p : p?.text ?? '')).join('');
    }

    // 2. Reasoning (Groq, DeepSeek R1, OpenAI o1/o3 reasoning models)
    let reasoning: string | null = null;
    const rawReasoning = message?.reasoning ?? message?.reasoning_content ?? null;
    if (typeof rawReasoning === 'string') {
      reasoning = rawReasoning;
    } else if (Array.isArray(rawReasoning)) {
      reasoning = rawReasoning.map((p: any) => (typeof p === 'string' ? p : p?.text ?? '')).join('');
    }

    // 3. Refusal
    const refusal = message?.refusal ?? null;

    let finalOutput: string | null = null;
    if (content?.trim() && reasoning?.trim()) {
      finalOutput = `<think>\n${reasoning.trim()}\n</think>\n\n${content.trim()}`;
    } else if (content && content.trim().length > 0) {
      finalOutput = content;
    } else if (reasoning && reasoning.trim().length > 0) {
      finalOutput = `<think>\n${reasoning.trim()}\n</think>`;
    } else if (refusal && refusal.trim().length > 0) {
      finalOutput = refusal;
    }

    const toolCalls = message?.tool_calls ?? [];
    return buildOpenAIResponse(truncate(finalOutput), toolCalls, parsed.usage);
  }
}

function buildOpenAIResponse(output: string | null, toolCalls: any[], usage: any): ParsedResponse {
  return {
    output,
    toolCalls,
    promptTokens:           usage?.prompt_tokens ?? null,
    completionTokens:       usage?.completion_tokens ?? null,
    totalTokens:            usage?.total_tokens ?? null,
    promptCacheReadTokens:  usage?.prompt_tokens_details?.cached_tokens ?? null,
    promptCacheWriteTokens: null, // OpenAI does not expose cache write tokens
    reasoningTokens:        usage?.completion_tokens_details?.reasoning_tokens ?? null,
    usageDetails:           usage ?? {},
  };
}

export function parseAnthropicResponse(chunks: string[]): ParsedResponse {
  const raw = chunks.join('');
  const isSSE = raw.trimStart().startsWith('event:') || raw.trimStart().startsWith('data:');

  if (isSSE) {
    let outputText = '';
    let thinkingText = '';
    const toolCalls: any[] = [];
    let usage: any = null;

    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const parsed = tryParseJSON(trimmed.replace(/^data:\s*/, '').trim());
      if (!parsed) continue;

      if (parsed.type === 'content_block_delta') {
        if (parsed.delta?.type === 'text_delta') {
          outputText += parsed.delta.text ?? '';
        } else if (parsed.delta?.type === 'thinking_delta') {
          thinkingText += parsed.delta.thinking ?? '';
        } else if (parsed.delta?.type === 'input_json_delta') {
          const idx = parsed.index ?? 0;
          toolCalls[idx] = toolCalls[idx] ?? { type: 'tool_use', input: '' };
          toolCalls[idx].input += parsed.delta.partial_json ?? '';
        }
      }
      if (parsed.type === 'message_delta' && parsed.usage) usage = { ...usage, ...parsed.usage };
      if (parsed.type === 'message_start' && parsed.message?.usage) usage = { ...usage, ...parsed.message.usage };
    }

    let finalOutput: string | null = null;
    if (outputText.trim() && thinkingText.trim()) {
      finalOutput = `<think>\n${thinkingText.trim()}\n</think>\n\n${outputText.trim()}`;
    } else if (outputText.trim()) {
      finalOutput = outputText;
    } else if (thinkingText.trim()) {
      finalOutput = `<think>\n${thinkingText.trim()}\n</think>`;
    }

    return buildAnthropicResponse(truncate(finalOutput), toolCalls.filter(Boolean), usage);
  } else {
    const parsed = tryParseJSON(raw);
    if (!parsed) return emptyResponse();
    const textBlocks = (parsed.content ?? []).filter((b: any) => b.type === 'text');
    const thinkingBlocks = (parsed.content ?? []).filter((b: any) => b.type === 'thinking');
    const toolBlocks = (parsed.content ?? []).filter((b: any) => b.type === 'tool_use');
    const text = textBlocks.map((b: any) => b.text).join('');
    const thinking = thinkingBlocks.map((b: any) => b.thinking).join('');

    let finalOutput: string | null = null;
    if (text.trim() && thinking.trim()) {
      finalOutput = `<think>\n${thinking.trim()}\n</think>\n\n${text.trim()}`;
    } else if (text.trim()) {
      finalOutput = text;
    } else if (thinking.trim()) {
      finalOutput = `<think>\n${thinking.trim()}\n</think>`;
    }

    return buildAnthropicResponse(truncate(finalOutput), toolBlocks, parsed.usage);
  }
}

function buildAnthropicResponse(output: string | null, toolCalls: any[], usage: any): ParsedResponse {
  return {
    output,
    toolCalls,
    promptTokens:           usage?.input_tokens ?? null,
    completionTokens:       usage?.output_tokens ?? null,
    totalTokens:            (usage?.input_tokens ?? 0) + (usage?.output_tokens ?? 0) || null,
    promptCacheReadTokens:  usage?.cache_read_input_tokens ?? null,
    promptCacheWriteTokens: usage?.cache_creation_input_tokens ?? null,
    reasoningTokens:        null,
    usageDetails:           usage ?? {},
  };
}

function emptyResponse(): ParsedResponse {
  return {
    output: null, toolCalls: [], promptTokens: null, completionTokens: null,
    totalTokens: null, promptCacheReadTokens: null, promptCacheWriteTokens: null,
    reasoningTokens: null, usageDetails: {},
  };
}

// ─── Provider → parser mapping ────────────────────────────────────────────────────────────────────────

export function getRequestParser(provider: string): (body: any) => ParsedRequest {
  switch (provider) {
    case 'openai':
    case 'openrouter':
    case 'deepseek':
    case 'perplexity':
    case 'fireworks':
    case 'xai':
    case 'nebius':
    case 'novita':
    case 'cerebras':
    case 'deepinfra':
    case 'anyscale':
    case 'llama':
    case 'lemonfox':
    case 'qstash':
    case 'vercel':
    case 'azure':
    case 'mistral':
    case 'groq':
    case 'cohere':
    case 'together':
      return parseOpenAIRequest;
    case 'anthropic': return parseAnthropicRequest;
    case 'google':    return parseGoogleRequest;
    default:          return parseGenericRequest;
  }
}

export function getResponseParser(provider: string): (chunks: string[]) => ParsedResponse {
  switch (provider) {
    case 'anthropic': return parseAnthropicResponse;
    // openai, groq, mistral, cohere, together, google (Gemini) all use OpenAI-compatible format
    default:          return parseOpenAIResponse;
  }
}
