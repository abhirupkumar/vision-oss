/**
 * LLM Proxy Route
 *
 * Transparent HTTP proxy between users and LLM providers.
 * Intercepts responses with ReadableInterceptor to capture telemetry
 * with zero added latency — DB writes happen via waitUntil after the
 * response is already delivered to the client.
 *
 * Usage (OpenAI example):
 *   baseURL = "https://your-vision.com/llm-proxy/openai/v1"
 *   headers: { "X-Sigma-Project": "proj_...", "X-Sigma-Api-Key": "sk-..." }
 */

import { Hono } from 'hono';
import { saveLlmEvent, calculateCost, isOrganizationLocked, isProjectLocked } from '@vision/db';
import { ReadableInterceptor } from '../../lib/llm-proxy/ReadableInterceptor.js';
import { PROVIDERS, getRequestParser, getResponseParser, wasTruncated } from '../../lib/llm-proxy/providers.js';
import { fetchProject } from '../../lib/load.js';

const app = new Hono();

const TRUNCATION_LIMIT = 50_000;

function truncateBody(text: string | null | undefined): { value: string | null; truncated: boolean } {
  if (!text) return { value: null, truncated: false };
  if (text.length <= TRUNCATION_LIMIT) return { value: text, truncated: false };
  return { value: text.slice(0, TRUNCATION_LIMIT), truncated: true };
}

function parseTags(header: string | null | undefined): string[] {
  if (!header) return [];
  const trimmed = header.trim();
  if (trimmed.startsWith('[')) {
    try { return JSON.parse(trimmed); } catch { /* fall through */ }
  }
  return trimmed.split(',').map((t) => t.trim()).filter(Boolean);
}

function tryParseJSON(text: string | null | undefined): any {
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
}

function resolveStatus(httpStatus: number, reason: 'done' | 'cancel' | 'timeout'): string {
  if (reason === 'cancel')  return 'cancelled';
  if (reason === 'timeout') return 'timeout';
  if (httpStatus === 200)   return 'success';
  if (httpStatus === 429)   return 'rate_limited';
  if (httpStatus >= 500)    return 'error';
  return 'error';
}

function buildClientHeaders(providerHeaders: Headers): Headers {
  const out = new Headers(providerHeaders);
  // Remove transfer-encoding so Node/edge runtimes don't double-chunk
  out.delete('content-encoding');
  out.delete('transfer-encoding');
  // Add CORS
  out.set('access-control-allow-origin', '*');
  return out;
}

// Handle OPTIONS preflight
app.options('/:provider/*', (c) => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    },
  });
});

app.all('/:provider/*', async (c) => {
  const startTime = Date.now();
  const provider = c.req.param('provider');

  // ── Resolve provider config ──────────────────────────────────────────────────────────────────────────
  let providerConfig = PROVIDERS[provider];
  let providerBaseUrl = providerConfig?.baseUrl;

  if (!providerConfig) {
    // Allow custom provider via X-Vision-Custom-Base-Url header
    const customBase = c.req.header('X-Vision-Custom-Base-Url');
    if (!customBase) {
      return c.json({ error: `Unknown provider: ${provider}. Use X-Vision-Custom-Base-Url for custom endpoints.` }, 400);
    }
    providerBaseUrl = customBase;
    // Use openai-compatible defaults for custom providers
    providerConfig = { baseUrl: customBase, authHeader: 'Authorization', authPrefix: 'Bearer ' };
  }

  // ── Extract Vision metadata from headers ───────────────────────────────────────────────────────────────
  const getHeader = (name: string) => c.req.header(`X-Vision-${name}`) ?? c.req.header(`X-Sigma-${name}`);
  const projectKey     = getHeader('Project');
  if (!projectKey) {
    return c.json({ error: 'X-Vision-Project header is required' }, 400);
  }

  const visionApiKey     = getHeader('Api-Key');
  const userId           = getHeader('User-Id')     ?? '';
  const sessionId        = getHeader('Session-Id')  ?? '';
  const traceId          = getHeader('Trace-Id')    ?? crypto.randomUUID();
  const parentEventId    = getHeader('Parent-Span-Id') ?? '';
  const spanName         = getHeader('Span-Name')   ?? '';
  const spanType         = (getHeader('Span-Type')  ?? 'generation') as string;
  const environment      = getHeader('Environment') ?? '';
  const release          = getHeader('Release')     ?? '';
  const version          = getHeader('Version')     ?? '';
  const tags             = parseTags(getHeader('Tags'));
  const templateName     = getHeader('Template-Name')    ?? '';
  const promptId         = getHeader('Template-Id')      ?? '';
  const promptVersionRaw = getHeader('Template-Version');
  const promptVersion    = promptVersionRaw ? parseInt(promptVersionRaw, 10) || null : null;
  const metadataRaw      = getHeader('Metadata');
  const metadata         = tryParseJSON(metadataRaw) ?? {};
  const spanId           = crypto.randomUUID();

  // ── Validate project ───────────────────────────────────────────────────────────────────────────────
  const project = await fetchProject(projectKey);
  if (!project) {
    return c.json({ error: 'Invalid project key' }, 403);
  }

  // Check if project organization/subscription is locked, expired, cancelled, or has no active plan
  const isLocked = project.organizationId
    ? await isOrganizationLocked(project.organizationId)
    : await isProjectLocked(project.id);

  // ── Read request body ────────────────────────────────────────────────────────────────────────────────
  const bodyText = await c.req.text();
  const bodyJson = tryParseJSON(bodyText);
  const requestParser = getRequestParser(provider);
  const parsedRequest = requestParser(bodyJson ?? {});

  // ── Build forwarded headers ──────────────────────────────────────────────────────────────────────────────
  const forwardHeaders = new Headers(c.req.raw.headers);

  // Strip all X-Vision-* and X-Sigma-* headers — never forward to provider
  const visionKeys: string[] = [];
  forwardHeaders.forEach((_val, key) => {
    const lk = key.toLowerCase();
    if (lk.startsWith('x-vision-') || lk.startsWith('x-sigma-')) visionKeys.push(key);
  });
  visionKeys.forEach((key) => forwardHeaders.delete(key));

  // Set provider auth using X-Vision-Api-Key if provided, else keep original auth
  if (visionApiKey) {
    // Clear existing auth headers, set provider-specific one
    forwardHeaders.delete('authorization');
    forwardHeaders.delete('x-api-key');
    forwardHeaders.delete('api-key');
    forwardHeaders.set(providerConfig.authHeader, providerConfig.authPrefix + visionApiKey);
  }

  // Forward client IP for provider rate limit attribution
  const clientIp = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? '';
  if (clientIp) forwardHeaders.set('x-forwarded-for', clientIp);
  forwardHeaders.delete('host');

  // ── Build target URL ──────────────────────────────────────────────────────────────────────────────────
  const rawPath = c.req.path; // e.g. /llm-proxy/openai/v1/chat/completions
  let providerPath = rawPath.replace(`/llm-proxy/${provider}`, '');
  const queryString = new URL(c.req.url).search;

  let targetUrl: string;
  if (provider === 'groq') {
    // Groq OpenAI-compatible API is at https://api.groq.com/openai/v1/...
    // Different SDKs (Groq SDK vs OpenAI SDK) append /openai/v1, /v1, or /chat/completions.
    // Strip any leading combinations of /openai and /v1 to prevent duplicate path segments.
    const cleanSubPath = providerPath.replace(/^(\/(openai|v1))+/, '');
    const normalizedPath = cleanSubPath.startsWith('/') ? cleanSubPath : (cleanSubPath ? `/${cleanSubPath}` : '');
    targetUrl = `https://api.groq.com/openai/v1${normalizedPath}${queryString}`;
    providerPath = `/v1${normalizedPath}`;
  } else {
    targetUrl = `${providerBaseUrl}${providerPath}${queryString}`;
  }

  // ── Forward to provider ────────────────────────────────────────────────────────────────────────────────────
  let providerResponse: Response;
  try {
    providerResponse = await fetch(targetUrl, {
      method: c.req.method,
      headers: forwardHeaders,
      body: bodyText || undefined,
    });
  } catch (err) {
    console.error('[llm-proxy] provider fetch error:', err);
    return c.json({ error: 'Failed to reach provider', provider, target: targetUrl }, 502);
  }

  // If the account has no active plan, or is expired/cancelled/exhausted:
  // Forward request to LLM and return response to client, but DO NOT store payload/response/telemetry in Tinybird/DB.
  if (isLocked) {
    const clientHeaders = buildClientHeaders(providerResponse.headers);
    clientHeaders.set('X-Vision-Telemetry', 'disabled');
    return new Response(providerResponse.body, {
      status: providerResponse.status,
      headers: clientHeaders,
    });
  }

  // ── Wrap response in ReadableInterceptor ───────────────────────────────────────────────────────────────
  // The interceptor forwards every chunk to the client immediately (zero latency)
  // while accumulating chunks for background DB write.
  if (!providerResponse.body) {
    // Fallback for edge cases where body is null (e.g. 204 No Content)
    return new Response(null, { status: providerResponse.status, headers: buildClientHeaders(providerResponse.headers) });
  }

  const interceptor = new ReadableInterceptor(providerResponse.body);
  const countryCode = c.req.header('cf-ipcountry') ?? '';
  const httpStatus = providerResponse.status;

  // Build client response using intercepted stream — client gets chunks instantly
  const clientResponse = new Response(interceptor.stream, {
    status: httpStatus,
    headers: buildClientHeaders(providerResponse.headers),
  });

  // ── Schedule async DB write (non-blocking) ──────────────────────────────────────────────────────────────────
  const responseParser = getResponseParser(provider);

  const writeTask = interceptor.donePromise.then(async (completed) => {
    const status = resolveStatus(httpStatus, completed.reason);
    const latencyMs = completed.endTime - startTime;
    const ttftMs = completed.firstChunkTime ? completed.firstChunkTime - startTime : null;

    const parsedResponse = responseParser(completed.body);
    const costs = calculateCost(parsedRequest.model, {
      promptTokens:           parsedResponse.promptTokens,
      completionTokens:       parsedResponse.completionTokens,
      promptCacheReadTokens:  parsedResponse.promptCacheReadTokens,
      promptCacheWriteTokens: parsedResponse.promptCacheWriteTokens,
    });

    const rawResponseBody = completed.body.join('');
    const payloadTrunc = truncateBody(bodyText);
    const responseTrunc = truncateBody(rawResponseBody);
    const bodyTruncated = payloadTrunc.truncated || responseTrunc.truncated;

    // Error details: prefer cancel/timeout reason string over provider error body
    const providerError = tryParseJSON(rawResponseBody)?.error;
    const errorCode = completed.reason !== 'done'
      ? completed.reason
      : (providerError?.code ?? '');
    const errorMessage = completed.reason !== 'done'
      ? completed.reason
      : (providerError?.message ?? '');

    return saveLlmEvent({
      id:                     spanId,
      projectId:              project.id,
      traceId,
      parentEventId:          parentEventId || undefined,
      spanType:               spanType as any,
      name:                   spanName,
      level:                  'default',
      startTime:              new Date(startTime),
      endTime:                new Date(completed.endTime),
      completionStartTime:    completed.firstChunkTime ? new Date(completed.firstChunkTime) : null,
      userId:                 userId || undefined,
      sessionId:              sessionId || undefined,
      environment:            environment || undefined,
      release:                release || undefined,
      version:                version || undefined,
      tags:                   tags.length ? tags : undefined,
      model:                  parsedRequest.model,
      provider,
      modelParameters:        Object.keys(parsedRequest.modelParameters).length ? parsedRequest.modelParameters : undefined,
      requestPath:            providerPath,
      payload:                payloadTrunc.value,
      response:               responseTrunc.value,
      bodyTruncated,
      toolCalls:              parsedResponse.toolCalls.length ? parsedResponse.toolCalls : undefined,
      toolDefinitions:        parsedRequest.toolDefinitions.length ? parsedRequest.toolDefinitions : undefined,
      promptTokens:           parsedResponse.promptTokens,
      completionTokens:       parsedResponse.completionTokens,
      totalTokens:            parsedResponse.totalTokens,
      usageUnit:              'tokens',
      promptCacheReadTokens:  parsedResponse.promptCacheReadTokens,
      promptCacheWriteTokens: parsedResponse.promptCacheWriteTokens,
      reasoningTokens:        parsedResponse.reasoningTokens,
      usageDetails:           Object.keys(parsedResponse.usageDetails).length ? parsedResponse.usageDetails : undefined,
      cost:                   costs.cost,
      costDetails:            Object.keys(costs.costDetails).length ? costs.costDetails : undefined,
      inputCost:              costs.inputCost,
      outputCost:             costs.outputCost,
      latencyMs,
      ttftMs,
      status,
      httpStatusCode:         httpStatus,
      errorMessage:           errorMessage || undefined,
      errorCode:              errorCode || undefined,
      templateName:           templateName || undefined,
      promptId:               promptId || undefined,
      promptVersion:          promptVersion ?? undefined,
      metadata:               Object.keys(metadata).length ? metadata : undefined,
      scores:                 undefined,
      countryCode:            countryCode || undefined,
      createdAt:              new Date(startTime),
    });
  }).catch((err) => {
    // Never let a telemetry failure surface to the user
    console.error('[llm-proxy] async write failed:', err);
  });

  // Keep write alive after response is returned (Cloudflare Workers + Node.js edge)
  try {
    const ctx = (c as any).executionCtx ?? (c as any).env?.ctx ?? (c as any).event?.executionCtx;
    if (ctx && typeof ctx.waitUntil === 'function') {
      ctx.waitUntil(writeTask);
    } else {
      writeTask.catch(() => {});
    }
  } catch {
    writeTask.catch(() => {});
  }

  // Return to client IMMEDIATELY — DB write has not run yet
  return clientResponse;
});

export default app;
