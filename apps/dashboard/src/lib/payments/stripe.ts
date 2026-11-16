import crypto from 'crypto';
import type {
  NormalizedPaymentEvent,
  PermissionCheckResult,
  ProviderAdapter,
  WebhookCreateResult,
} from './types';
import { ATTRIBUTION_KEYS, REQUIRED_WEBHOOK_EVENTS } from './types';

export class StripeAdapter implements ProviderAdapter {
  readonly name = 'Stripe';

  async validateCredentials(config: Record<string, string>): Promise<boolean> {
    const { apiKey } = config;
    if (!apiKey?.startsWith('sk_')) return false;
    try {
      const res = await fetch('https://api.stripe.com/v1/account', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async checkRequiredPermissions(config: Record<string, string>): Promise<PermissionCheckResult> {
    const { apiKey } = config;
    const missing: string[] = [];

    try {
      // Test charges read
      const chargesRes = await fetch('https://api.stripe.com/v1/charges?limit=1', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!chargesRes.ok) missing.push('read:charges');

      // Test payment_intents read
      const piRes = await fetch('https://api.stripe.com/v1/payment_intents?limit=1', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!piRes.ok) missing.push('read:payment_intents');

      // Test subscriptions read
      const subRes = await fetch('https://api.stripe.com/v1/subscriptions?limit=1', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!subRes.ok) missing.push('read:subscriptions');

      // Webhook write is only verifiable at creation time
    } catch {
      missing.push('read:charges', 'read:payment_intents', 'read:subscriptions');
    }

    return { ok: missing.length === 0, missingPermissions: missing };
  }

  async createWebhook(
    config: Record<string, string>,
    endpointUrl: string,
  ): Promise<WebhookCreateResult> {
    const { apiKey } = config;
    try {
      const body = new URLSearchParams();
      body.append('url', endpointUrl);
      body.append('description', 'Vision Analytics payment webhook');
      for (const evt of REQUIRED_WEBHOOK_EVENTS.stripe) {
        body.append('enabled_events[]', evt);
      }

      const res = await fetch('https://api.stripe.com/v1/webhook_endpoints', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });
      const json = (await res.json()) as any;
      if (!res.ok) {
        return { ok: false, webhookId: null, webhookSecret: null, error: json.error?.message };
      }
      return {
        ok: true,
        webhookId: json.id,
        webhookSecret: json.secret,
      };
    } catch (err: any) {
      return { ok: false, webhookId: null, webhookSecret: null, error: err.message };
    }
  }

  verifyWebhookSignature(payload: Buffer, signature: string, secret: string): boolean {
    try {
      // Stripe-Signature header format: t=...,v1=...
      const parts = signature.split(',').reduce<Record<string, string>>((acc, part) => {
        const [k, v] = part.split('=');
        acc[k] = v;
        return acc;
      }, {});
      const timestamp = parts['t'];
      const receivedSig = parts['v1'];
      const signedPayload = `${timestamp}.${payload.toString('utf8')}`;
      const expectedSig = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
      return crypto.timingSafeEqual(
        Buffer.from(expectedSig, 'hex'),
        Buffer.from(receivedSig, 'hex'),
      );
    } catch {
      return false;
    }
  }

  normalizeWebhookEvent(raw: Record<string, unknown>): NormalizedPaymentEvent | null {
    const event = raw as any;
    const type = event.type as string;
    const obj = event.data?.object ?? {};
    const metadata = obj.metadata ?? event.data?.object?.payment_intent?.metadata ?? {};

    const eventTypeMap: Record<string, string> = {
      'payment_intent.succeeded': 'payment.succeeded',
      'payment_intent.payment_failed': 'payment.failed',
      'checkout.session.completed': 'payment.succeeded',
      'charge.refunded': 'payment.refunded',
      'customer.subscription.created': 'subscription.created',
      'customer.subscription.updated': 'subscription.updated',
      'customer.subscription.deleted': 'subscription.cancelled',
      'invoice.paid': 'payment.succeeded',
      'invoice.payment_failed': 'payment.failed',
    };

    const mappedType = eventTypeMap[type];
    if (!mappedType) return null;

    const amount = obj.amount ?? obj.amount_paid ?? obj.amount_total ?? 0;
    const currency = (obj.currency ?? 'usd').toLowerCase();

    let providerEventId = event.id;
    if (['payment_intent.succeeded', 'payment_intent.payment_failed'].includes(type)) {
      providerEventId = obj.id;
    } else if (
      [
        'checkout.session.completed',
        'charge.refunded',
        'invoice.paid',
        'invoice.payment_failed',
      ].includes(type)
    ) {
      providerEventId = obj.payment_intent ?? obj.id;
    }

    return {
      providerEventId,
      projectId: metadata[ATTRIBUTION_KEYS.PROJECT_ID] ?? null,
      visitorId: metadata[ATTRIBUTION_KEYS.VISITOR_ID] ?? null,
      deviceId: metadata[ATTRIBUTION_KEYS.DEVICE_ID] ?? null,
      eventType: mappedType as any,
      currency,
      amount,
      status: obj.status ?? 'unknown',
      occurredAt: new Date((event.created ?? Date.now() / 1000) * 1000),
      rawPayload: raw,
    };
  }
}
