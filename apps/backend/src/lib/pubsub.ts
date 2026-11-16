import { EventEmitter } from 'events';
import redis from './redis';

// Detect if we're running in a Node.js environment (vs Cloudflare Worker)
const isNode =
  typeof process !== 'undefined' && process.release?.name === 'node';

// ─── Upstash REST helpers ───────────────────────────────────────────────────

function getUpstashConfig(): { restUrl: string; token: string } | null {
  const rawUrl = process.env.REDIS_URL || '';
  if (!rawUrl.includes('upstash.io')) return null;
  try {
    const url = new URL(rawUrl);
    return {
      restUrl: `https://${url.hostname}`,
      token: decodeURIComponent(url.password),
    };
  } catch {
    return null;
  }
}

/** Publish via Upstash REST API (Cloudflare Worker safe) */
async function upstashPublish(channel: string, message: string): Promise<void> {
  const cfg = getUpstashConfig();
  if (!cfg) return;
  try {
    const res = await fetch(
      `${cfg.restUrl}/publish/${encodeURIComponent(channel)}/${encodeURIComponent(message)}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${cfg.token}` },
      },
    );
    if (!res.ok) {
      const text = await res.text();
      console.error('[pubsub] Upstash publish error:', res.status, text);
    }
  } catch (error) {
    console.error('[pubsub] Upstash publish fetch error:', error);
  }
}

/**
 * Subscribe via Upstash REST Pub/Sub stream (Cloudflare Worker safe).
 * Upstash exposes an SSE-compatible stream at GET /subscribe/:channel
 * Returns an unsubscribe function.
 */
async function upstashSubscribe(
  channel: string,
  callback: (message: string) => void,
): Promise<() => Promise<void>> {
  const cfg = getUpstashConfig();
  if (!cfg) return async () => { };

  let abortController = new AbortController();

  (async () => {
    try {
      const res = await fetch(
        `${cfg.restUrl}/subscribe/${encodeURIComponent(channel)}`,
        {
          headers: { Authorization: `Bearer ${cfg.token}` },
          signal: abortController.signal,
        },
      );

      if (!res.ok || !res.body) {
        console.error('[pubsub] Upstash subscribe failed:', res.status);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        // SSE lines look like: data: {"message":"..."}
        for (const line of text.split('\n')) {
          if (line.startsWith('data:')) {
            try {
              const json = JSON.parse(line.slice(5).trim());
              if (json?.message !== undefined) {
                callback(json.message);
              }
            } catch {
              // Non-JSON data lines (e.g. heartbeats) — ignore
            }
          }
        }
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('[pubsub] Upstash subscribe stream error:', err);
      }
    }
  })();

  return async () => {
    abortController.abort();
  };
}

// ─── PubSub class ──────────────────────────────────────────────────────────

class PubSub {
  private emitter = new EventEmitter();

  async publish(channel: string, message: string): Promise<void> {
    if (redis.enabled) {
      if (isNode) {
        // Node.js: use raw redis TCP client
        await redis.client.connect();
        await redis.client.client.publish(channel, message);
      } else {
        // Cloudflare Worker: use Upstash HTTP
        await upstashPublish(channel, message);
      }
    } else {
      this.emitter.emit(channel, message);
    }
  }

  async subscribe(
    channel: string,
    callback: (message: string) => void,
  ): Promise<() => Promise<void>> {
    if (redis.enabled) {
      if (isNode) {
        // Node.js: duplicate the TCP redis client for subscription
        const subscriber = redis.client.client.duplicate();
        await subscriber.connect();
        await subscriber.subscribe(channel, callback);
        return async () => {
          await subscriber.unsubscribe(channel);
          await subscriber.quit();
        };
      } else {
        // Cloudflare Worker: use Upstash HTTP SSE stream
        return upstashSubscribe(channel, callback);
      }
    } else {
      // In-memory fallback (local dev without Redis)
      this.emitter.on(channel, callback);
      return async () => {
        this.emitter.off(channel, callback);
      };
    }
  }
}

export const pubsub = new PubSub();
