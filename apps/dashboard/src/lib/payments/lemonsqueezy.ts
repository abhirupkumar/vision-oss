import crypto from 'crypto';
import type {
  NormalizedPaymentEvent,
  PermissionCheckResult,
  ProviderAdapter,
  WebhookCreateResult,
} from './types';
import { ATTRIBUTION_KEYS, REQUIRED_WEBHOOK_EVENTS } from './types';

export class LemonSqueezyAdapter implements ProviderAdapter {
  readonly name = 'LemonSqueezy';

  private baseUrl = 'https://api.lemonsqueezy.com/v1';

  async validateCredentials(config: Record<string, string>): Promise<boolean> {
    const { apiKey } = config;
    if (!apiKey) return false;
    try {
      const res = await fetch(`${this.baseUrl}/users/me`, {
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
      const ordersRes = await fetch(`${this.baseUrl}/orders?page[size]=1`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!ordersRes.ok) missing.push('read:orders');

      const subRes = await fetch(`${this.baseUrl}/subscriptions?page[size]=1`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!subRes.ok) missing.push('read:subscriptions');

      const webhooksRes = await fetch(`${this.baseUrl}/webhooks?page[size]=1`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!webhooksRes.ok) missing.push('read:webhooks');
    } catch {
      missing.push('read:orders', 'read:subscriptions', 'read:webhooks');
    }
    return { ok: missing.length === 0, missingPermissions: missing };
  }

  async createWebhook(
    config: Record<string, string>,
    endpointUrl: string,
  ): Promise<WebhookCreateResult> {
    const { apiKey, storeId } = config;
    if (!storeId) {
      return {
        ok: false,
        webhookId: null,
        webhookSecret: null,
        error: 'LemonSqueezy storeId is required to register webhooks',
      };
    }
    try {
      const secret = crypto.randomBytes(32).toString('hex');
      const res = await fetch(`${this.baseUrl}/webhooks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/vnd.api+json',
          Accept: 'application/vnd.api+json',
        },
        body: JSON.stringify({
          data: {
            type: 'webhooks',
            attributes: {
              url: endpointUrl,
              events: REQUIRED_WEBHOOK_EVENTS.lemonsqueezy,
              secret,
            },
            relationships: {
              store: {
                data: { type: 'stores', id: storeId },
              },
            },
          },
        }),
      });
      const json = (await res.json()) as any;
      if (!res.ok) {
        return {
          ok: false,
          webhookId: null,
          webhookSecret: null,
          error: json.errors?.[0]?.detail ?? 'Unknown error',
        };
      }
      return {
        ok: true,
        webhookId: json.data?.id ?? null,
        webhookSecret: secret,
      };
    } catch (err: any) {
      return { ok: false, webhookId: null, webhookSecret: null, error: err.message };
    }
  }

  verifyWebhookSignature(payload: Buffer, signature: string, secret: string): boolean {
    try {
      const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
    } catch {
      return false;
    }
  }

  normalizeWebhookEvent(raw: Record<string, unknown>): NormalizedPaymentEvent | null {
    const event = raw as any;
    const metaType = event.meta?.event_name as string;
    const data = event.data ?? {};
    const attributes = data.attributes ?? {};
    const metadata = attributes.meta?.custom_data ?? {};

    const eventTypeMap: Record<string, string> = {
      order_created: 'payment.succeeded',
      subscription_created: 'subscription.created',
      subscription_updated: 'subscription.updated',
      subscription_cancelled: 'subscription.cancelled',
      subscription_expired: 'subscription.cancelled',
      subscription_payment_success: 'payment.succeeded',
      subscription_payment_failed: 'payment.failed',
      subscription_payment_refunded: 'payment.refunded',
    };

    const mappedType = eventTypeMap[metaType];
    if (!mappedType) return null;

    const amount = attributes.total ?? attributes.subtotal ?? 0;
    const currency = (attributes.currency ?? 'usd').toLowerCase();

    return {
      providerEventId: `${metaType}-${data.id ?? Date.now()}`,
      projectId: metadata[ATTRIBUTION_KEYS.PROJECT_ID] ?? null,
      visitorId: metadata[ATTRIBUTION_KEYS.VISITOR_ID] ?? null,
      deviceId: metadata[ATTRIBUTION_KEYS.DEVICE_ID] ?? null,
      eventType: mappedType as any,
      currency,
      amount,
      status: attributes.status ?? 'unknown',
      occurredAt: new Date(attributes.created_at ?? Date.now()),
      rawPayload: raw,
    };
  }
}
