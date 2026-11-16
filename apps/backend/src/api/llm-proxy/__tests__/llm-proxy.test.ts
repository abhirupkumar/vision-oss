process.loadEnvFile('../../.env');
import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import llmProxyRoute from '../route.js';

describe('LLM Proxy Route', () => {
  const app = new Hono();
  app.route('/llm-proxy', llmProxyRoute);

  it('returns 400 when X-Vision-Project is missing', async () => {
    const res = await app.request('/llm-proxy/groq/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer gsk_test123',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'hello' }],
      }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('X-Vision-Project header is required');
  });

  it('returns 403 when X-Vision-Project is invalid', async () => {
    const res = await app.request('/llm-proxy/groq/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer gsk_test123',
        'X-Vision-Project': 'non_existent_project_12345',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'hello' }],
      }),
    });

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe('Invalid project key');
  });

  it('forwards to https://api.groq.com/openai/v1/chat/completions when using /groq/v1', async () => {
    let capturedUrl = '';
    let capturedHost = 'not-called';
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url: any, init: any) => {
      capturedUrl = String(url);
      capturedHost = init?.headers?.get?.('host') ?? (init?.headers?.host || null);
      return new Response(JSON.stringify({ choices: [{ message: { content: 'hi' } }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    try {
      const res = await app.request('/llm-proxy/groq/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer gsk_test123',
          'X-Vision-Project': 'insta',
          'Host': 'api-vision.akb2003.workers.dev',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: 'hello' }],
        }),
      });

      expect(capturedUrl).toBe('https://api.groq.com/openai/v1/chat/completions');
      expect(capturedHost).toBeNull();
      expect(res.status).toBe(200);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('normalizes /groq/openai/v1 so /openai is not duplicated', async () => {
    let capturedUrl = '';
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url: any) => {
      capturedUrl = String(url);
      return new Response(JSON.stringify({ choices: [{ message: { content: 'hi' } }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    try {
      const res = await app.request('/llm-proxy/groq/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer gsk_test123',
          'X-Vision-Project': 'insta',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: 'hello' }],
        }),
      });

      expect(capturedUrl).toBe('https://api.groq.com/openai/v1/chat/completions');
      expect(res.status).toBe(200);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('normalizes /groq/v1/openai/v1 so /openai/v1 is not duplicated', async () => {
    let capturedUrl = '';
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url: any) => {
      capturedUrl = String(url);
      return new Response(JSON.stringify({ choices: [{ message: { content: 'hi' } }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    try {
      const res = await app.request('/llm-proxy/groq/v1/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer gsk_test123',
          'X-Vision-Project': 'insta',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: 'hello' }],
        }),
      });

      expect(capturedUrl).toBe('https://api.groq.com/openai/v1/chat/completions');
      expect(res.status).toBe(200);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('normalizes bare /groq/chat/completions to /openai/v1/chat/completions', async () => {
    let capturedUrl = '';
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url: any) => {
      capturedUrl = String(url);
      return new Response(JSON.stringify({ choices: [{ message: { content: 'hi' } }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    try {
      const res = await app.request('/llm-proxy/groq/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer gsk_test123',
          'X-Vision-Project': 'insta',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: 'hello' }],
        }),
      });

      expect(capturedUrl).toBe('https://api.groq.com/openai/v1/chat/completions');
      expect(res.status).toBe(200);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
