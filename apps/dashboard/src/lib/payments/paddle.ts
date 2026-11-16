import crypto from 'crypto';
import type {
  NormalizedPaymentEvent,
  PermissionCheckResult,
  ProviderAdapter,
  WebhookCreateResult,
} from './types';
import { ATTRIBUTION_KEYS, REQUIRED_WEBHOOK_EVENTS } from './types';

export class PaddleAdapter implements ProviderAdapter {
  readonly name = 'Paddle';

  private baseUrl = 'https://api.paddle.com';

  async validateCredentials(config: Record<string, string>): Promise<boolean> {
    const { apiKey } = config;
    if (!apiKey) return false;
    try {
      const res = await fetch(`${this.baseUrl}/customers?per_page=1`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
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
      const txRes = await fetch(`${this.baseUrl}/transactions?per_page=1`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!txRes.ok) missing.push('read:transactions');

      const subRes = await fetch(`${this.baseUrl}/subscriptions?per_page=1`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!subRes.ok) missing.push('read:subscriptions');
    } catch {
      missing.push('read:transactions', 'read:subscriptions');
    }
    return { ok: missing.length === 0, missingPermissions: missing };
  }

  async createWebhook(
    config: Record<string, string>,
    endpointUrl: string,
  ): Promise<WebhookCreateResult> {
    const { apiKey } = config;
    try {
      const res = await fetch(`${this.baseUrl}/notification-settings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: 'Vision Analytics payment webhook',
          destination: endpointUrl,
          type: 'url',
          subscribed_events: REQUIRED_WEBHOOK_EVENTS.paddle,
        }),
      });
      const json = (await res.json()) as any;
      if (!res.ok) {
        return { ok: false, webhookId: null, webhookSecret: null, error: json.error?.detail };
      }
      return {
        ok: true,
        webhookId: json.data?.id ?? null,
        webhookSecret: json.data?.endpoint_secret_key ?? null,
      };
    } catch (err: any) {
      return { ok: false, webhookId: null, webhookSecret: null, error: err.message };
    }
  }

  verifyWebhookSignature(payload: Buffer, signature: string, secret: string): boolean {
    try {
      // Paddle-Signature: ts=...;h1=...
      const parts = signature.split(';').reduce<Record<string, string>>((acc, part) => {
        const [k, v] = part.split('=');
        acc[k] = v;
        return acc;
      }, {});
      const ts = parts['ts'];
      const h1 = parts['h1'];
      const signed = `${ts}:${payload.toString('utf8')}`;
      const expected = crypto.createHmac('sha256', secret).update(signed).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(h1, 'hex'));
    } catch {
      return false;
    }
  }

  normalizeWebhookEvent(raw: Record<string, unknown>): NormalizedPaymentEvent | null {
    const event = raw as any;
    const type = event.event_type as string;
    const data = event.data ?? {};
    const customData = data.custom_data ?? {};

    const eventTypeMap: Record<string, string> = {
      'transaction.completed': 'payment.succeeded',
      'transaction.payment_failed': 'payment.failed',
      'transaction.refunded': 'payment.refunded',
      'subscription.created': 'subscription.created',
      'subscription.updated': 'subscription.updated',
      'subscription.cancelled': 'subscription.cancelled',
      'subscription.paused': 'subscription.updated',
    };

    const mappedType = eventTypeMap[type];
    if (!mappedType) return null;

    const details = data.details?.totals ?? {};
    const amount = parseInt(details.grand_total ?? '0', 10);
    const currency = (data.currency_code ?? 'usd').toLowerCase();

    return {
      providerEventId: data.id ?? event.notification_id ?? `${type}-${Date.now()}`,
      projectId: customData[ATTRIBUTION_KEYS.PROJECT_ID] ?? null,
      visitorId: customData[ATTRIBUTION_KEYS.VISITOR_ID] ?? null,
      deviceId: customData[ATTRIBUTION_KEYS.DEVICE_ID] ?? null,
      eventType: mappedType as any,
      currency,
      amount,
      status: data.status ?? 'unknown',
      occurredAt: new Date(event.occurred_at ?? Date.now()),
      rawPayload: raw,
    };
  }
}
