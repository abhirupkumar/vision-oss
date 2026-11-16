import { Hono } from 'hono';
import { db, PaymentConnection, saveRevenue } from '@vision/db';
import { and, eq } from 'drizzle-orm';
import { decrypt, secret } from '@/lib/crypto';
import { getProviderAdapter, type PaymentProviderKey } from '@/lib/payments/index.js';
import { buildUnattributedLog, getEffectiveVisitorId, resolveAttribution } from '@/lib/payments/attribution.js';
import { dispatchNotifications } from '@/lib/integrations/dispatch.js';

const SUPPORTED_PROVIDERS: PaymentProviderKey[] = ['stripe', 'paddle', 'polar', 'lemonsqueezy'];

function isValidProvider(p: string): p is PaymentProviderKey {
  return SUPPORTED_PROVIDERS.includes(p as PaymentProviderKey);
}

function getSignatureHeader(c: any, provider: PaymentProviderKey): string {
  const headerMap: Record<PaymentProviderKey, string> = {
    stripe: 'stripe-signature',
    paddle: 'paddle-signature',
    polar: 'webhook-signature',
    lemonsqueezy: 'x-signature',
  };
  return c.req.header(headerMap[provider]) ?? '';
}

const app = new Hono();

app.post('/', async (c) => {
  const provider = c.req.param('provider');

  if (!isValidProvider(provider)) {
    return c.json({ error: `Unsupported provider: ${provider}` }, 400);
  }

  const rawBodyText = await c.req.text();
  const rawBody = Buffer.from(rawBodyText, 'utf8');
  const signature = getSignatureHeader(c, provider);

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBodyText);
  } catch {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }

  const connections = await db.query.PaymentConnection.findMany({
    where: and(
      eq(PaymentConnection.provider, provider),
      eq(PaymentConnection.status, 'active')
    ),
    columns: { id: true, projectId: true, webhookSecret: true },
  });

  if (!connections || connections.length === 0) {
    return c.json({ received: true, note: 'No active connections found' });
  }

  const adapter = getProviderAdapter(provider);

  let matchedConnection: (typeof connections)[0] | null = null;
  for (const conn of connections) {
    if (conn.webhookSecret) {
      try {
        const decryptedSecret = decrypt(conn.webhookSecret, secret());
        if (adapter.verifyWebhookSignature(rawBody, signature, decryptedSecret)) {
          matchedConnection = conn;
          break;
        }
      } catch (err) {
        // Ignore
      }
    }
  }

  if (!matchedConnection) {
    return c.json({ error: 'Invalid webhook signature' }, 401);
  }

  const normalized = adapter.normalizeWebhookEvent(payload);
  if (!normalized) {
    return c.json({ received: true, note: 'Event type not tracked' });
  }

  const attribution = resolveAttribution({
    projectid: normalized.projectId,
    visitorid: normalized.visitorId,
    deviceid: normalized.deviceId,
  });

  if (!attribution.ok) {
    const log = buildUnattributedLog(normalized.providerEventId, provider, attribution.missing);
    console.warn('[webhook/payments] Unattributed event:', JSON.stringify(log));
  }

  try {


    if (attribution.ok && attribution.projectId) {
      const effectiveId = getEffectiveVisitorId(attribution);
      await saveRevenue({
        projectId: attribution.projectId,
        visitorId: effectiveId || '',
        eventId: normalized.providerEventId,
        eventName: normalized.eventType,
        currency: normalized.currency,
        revenue: normalized.amount / 100,
        createdAt: new Date(),
      }).catch((err) => console.error('[webhook/payments] Tinybird revenue insert error:', err));

      if (normalized.notify) {
        dispatchNotifications(attribution.projectId, {
          eventName: 'payment_received',
          properties: {
            eventType: normalized.eventType,
            amount: normalized.amount / 100,
            currency: normalized.currency,
            provider,
            description: `${(normalized.amount / 100).toFixed(2)} ${normalized.currency.toUpperCase()} via ${provider}`,
          },
        }).catch((err) => console.error('[webhook/payments] Notify error:', err));
      }
    }
  } catch (err: any) {
    if (err?.code === '23505' || err?.code === 'SQLITE_CONSTRAINT') {
      return c.json({ received: true, note: 'Already processed' });
    }
    console.error('[webhook/payments] Error persisting event:', err);
    return c.json({ error: 'Internal error' }, 500);
  }

  return c.json({ received: true });
});

export default app;
