
import crypto from 'crypto';
import type {
  NormalizedPaymentEvent,
  PermissionCheckResult,
  ProviderAdapter,
  WebhookCreateResult,
} from './types';
import { ATTRIBUTION_KEYS, REQUIRED_WEBHOOK_EVENTS } from './types';

export class PolarAdapter implements ProviderAdapter {
  readonly name = 'Polar';

  private baseUrl = 'https://api.polar.sh/v1';

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
      const ordersRes = await fetch(`${this.baseUrl}/orders?limit=1`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!ordersRes.ok) missing.push('read:orders');

      const subRes = await fetch(`${this.baseUrl}/subscriptions?limit=1`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!subRes.ok) missing.push('read:subscriptions');
    } catch {
      missing.push('read:orders', 'read:subscriptions');
    }
    return { ok: missing.length === 0, missingPermissions: missing };
  }

  async createWebhook(
    config: Record<string, string>,
    endpointUrl: string,
  ): Promise<WebhookCreateResult> {
    const { apiKey, organizationId } = config;
    try {
      const secret = crypto.randomBytes(32).toString('hex');
      const res = await fetch(`${this.baseUrl}/webhooks/endpoints`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: endpointUrl,
          secret,
          events: REQUIRED_WEBHOOK_EVENTS.polar,
          organization_id: organizationId ?? undefined,
        }),
      });
      const json = (await res.json()) as any;
      if (!res.ok) {
        return {
          ok: false,
          webhookId: null,
          webhookSecret: null,
          error: json.detail ?? json.error,
        };
      }
      return {
        ok: true,
        webhookId: json.id ?? null,
        webhookSecret: secret,
      };
    } catch (err: any) {
      return { ok: false, webhookId: null, webhookSecret: null, error: err.message };
    }
  }

  verifyWebhookSignature(payload: Buffer, signature: string, secret: string): boolean {
    try {
      // Polar uses webhook-signature header: sha256=<hex>
      const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      const received = signature.replace(/^sha256=/, '');
      return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'));
    } catch {
      return false;
    }
  }

  normalizeWebhookEvent(raw: Record<string, unknown>): NormalizedPaymentEvent | null {
    const event = raw as any;
    const type = event.type as string;
    const data = event.data ?? {};
    const metadata = data.metadata ?? data.checkout?.metadata ?? {};

    const eventTypeMap: Record<string, string> = {
      'order.created': 'payment.succeeded',
      'subscription.created': 'subscription.created',
      'subscription.updated': 'subscription.updated',
      'subscription.cancelled': 'subscription.cancelled',
      'subscription.revoked': 'subscription.cancelled',
      'checkout.created': 'payment.pending',
      'checkout.updated': 'payment.pending',
    };

    const mappedType = eventTypeMap[type];
    if (!mappedType) return null;

    const amount = data.net_amount ?? data.amount ?? 0;
    const currency = (data.currency ?? 'usd').toLowerCase();

    return {
      providerEventId: data.id ?? event.event_id ?? `${type}-${Date.now()}`,
      projectId: metadata[ATTRIBUTION_KEYS.PROJECT_ID] ?? null,
      visitorId: metadata[ATTRIBUTION_KEYS.VISITOR_ID] ?? null,
      deviceId: metadata[ATTRIBUTION_KEYS.DEVICE_ID] ?? null,
      notify: metadata[ATTRIBUTION_KEYS.NOTIFY] === 'true' || metadata[ATTRIBUTION_KEYS.NOTIFY] === true,
      eventType: mappedType as any,
      currency,
      amount,
      status: data.status ?? 'unknown',
      occurredAt: new Date(event.created_at ?? Date.now()),
      rawPayload: raw,
    };
  }
}
