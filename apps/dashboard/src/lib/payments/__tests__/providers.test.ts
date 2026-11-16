import crypto from 'crypto';
import { LemonSqueezyAdapter } from '@/lib/payments/lemonsqueezy';
import { PaddleAdapter } from '@/lib/payments/paddle';
import { PolarAdapter } from '@/lib/payments/polar';
import { StripeAdapter } from '@/lib/payments/stripe';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeStripeSignature(payload: string, secret: string): string {
  const ts = Math.floor(Date.now() / 1000).toString();
  const signed = `${ts}.${payload}`;
  const sig = crypto.createHmac('sha256', secret).update(signed).digest('hex');
  return `t=${ts},v1=${sig}`;
}

function makePaddleSignature(payload: string, secret: string): string {
  const ts = Math.floor(Date.now() / 1000).toString();
  const signed = `${ts}:${payload}`;
  const sig = crypto.createHmac('sha256', secret).update(signed).digest('hex');
  return `ts=${ts};h1=${sig}`;
}

function makePolarSignature(payload: string, secret: string): string {
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `sha256=${sig}`;
}

function makeLSSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

// ─── Stripe ──────────────────────────────────────────────────────────────────

describe('StripeAdapter', () => {
  const adapter = new StripeAdapter();
  const secret = 'whsec_test123';
  const payload = JSON.stringify({ type: 'payment_intent.succeeded' });
  const buf = Buffer.from(payload);

  describe('verifyWebhookSignature', () => {
    it('accepts a valid Stripe signature', () => {
      const sig = makeStripeSignature(payload, secret);
      expect(adapter.verifyWebhookSignature(buf, sig, secret)).toBe(true);
    });

    it('rejects a tampered Stripe signature', () => {
      const sig = makeStripeSignature(payload, secret);
      const tampered = sig.replace(/v1=.+/, 'v1=deadbeef');
      expect(adapter.verifyWebhookSignature(buf, tampered, secret)).toBe(false);
    });

    it('rejects an empty signature', () => {
      expect(adapter.verifyWebhookSignature(buf, '', secret)).toBe(false);
    });
  });

  describe('normalizeWebhookEvent', () => {
    it('normalizes payment_intent.succeeded', () => {
      const raw = {
        id: 'evt_123',
        type: 'payment_intent.succeeded',
        created: 1700000000,
        data: {
          object: {
            amount: 4999,
            currency: 'usd',
            status: 'succeeded',
            metadata: {
              projectid: 'proj_1',
              visitorid: 'vis_1',
            },
          },
        },
      };
      const normalized = adapter.normalizeWebhookEvent(raw);
      expect(normalized).not.toBeNull();
      expect(normalized!.eventType).toBe('payment.succeeded');
      expect(normalized!.currency).toBe('usd');
      expect(normalized!.amount).toBe(4999);
      expect(normalized!.projectId).toBe('proj_1');
      expect(normalized!.visitorId).toBe('vis_1');
    });

    it('returns null for untracked event types', () => {
      const raw = { id: 'evt_unk', type: 'customer.created', data: { object: {} } };
      expect(adapter.normalizeWebhookEvent(raw)).toBeNull();
    });

    it('normalizes charge.refunded to payment.refunded', () => {
      const raw = {
        id: 'evt_ref',
        type: 'charge.refunded',
        created: 1700000000,
        data: { object: { amount: 1000, currency: 'eur', status: 'succeeded', metadata: {} } },
      };
      const normalized = adapter.normalizeWebhookEvent(raw);
      expect(normalized!.eventType).toBe('payment.refunded');
    });

    it('normalizes customer.subscription.created to subscription.created', () => {
      const raw = {
        id: 'evt_sub',
        type: 'customer.subscription.created',
        created: 1700000000,
        data: { object: { amount: 0, currency: 'usd', status: 'active', metadata: {} } },
      };
      const normalized = adapter.normalizeWebhookEvent(raw);
      expect(normalized!.eventType).toBe('subscription.created');
    });
  });
});

// ─── Paddle ───────────────────────────────────────────────────────────────────

describe('PaddleAdapter', () => {
  const adapter = new PaddleAdapter();
  const secret = 'paddle_secret_xyz';
  const payload = JSON.stringify({ event_type: 'transaction.completed' });
  const buf = Buffer.from(payload);

  describe('verifyWebhookSignature', () => {
    it('accepts a valid Paddle signature', () => {
      const sig = makePaddleSignature(payload, secret);
      expect(adapter.verifyWebhookSignature(buf, sig, secret)).toBe(true);
    });

    it('rejects a wrong-secret signature', () => {
      const sig = makePaddleSignature(payload, 'wrong_secret');
      expect(adapter.verifyWebhookSignature(buf, sig, secret)).toBe(false);
    });
  });

  describe('normalizeWebhookEvent', () => {
    it('normalizes transaction.completed to payment.succeeded', () => {
      const raw = {
        notification_id: 'ntf_abc',
        event_type: 'transaction.completed',
        occurred_at: new Date().toISOString(),
        data: {
          status: 'completed',
          currency_code: 'USD',
          details: { totals: { grand_total: '2999' } },
          custom_data: { projectid: 'proj_2', deviceid: 'dev_9' },
        },
      };
      const normalized = adapter.normalizeWebhookEvent(raw);
      expect(normalized!.eventType).toBe('payment.succeeded');
      expect(normalized!.amount).toBe(2999);
      expect(normalized!.projectId).toBe('proj_2');
      expect(normalized!.deviceId).toBe('dev_9');
      // isAnonymous is on AttributionResult, not NormalizedPaymentEvent
    });
  });
});

// ─── Polar ────────────────────────────────────────────────────────────────────

describe('PolarAdapter', () => {
  const adapter = new PolarAdapter();
  const secret = 'polar_secret_abc';
  const payload = JSON.stringify({ type: 'order.created' });
  const buf = Buffer.from(payload);

  describe('verifyWebhookSignature', () => {
    it('accepts sha256= prefixed signature', () => {
      const sig = makePolarSignature(payload, secret);
      expect(adapter.verifyWebhookSignature(buf, sig, secret)).toBe(true);
    });

    it('rejects invalid signature', () => {
      expect(adapter.verifyWebhookSignature(buf, 'sha256=badvalue', secret)).toBe(false);
    });
  });

  describe('normalizeWebhookEvent', () => {
    it('normalizes order.created to payment.succeeded', () => {
      const raw = {
        event_id: 'evt_polar_1',
        type: 'order.created',
        created_at: new Date().toISOString(),
        data: {
          net_amount: 1500,
          currency: 'usd',
          status: 'paid',
          metadata: { projectid: 'proj_3', visitorid: 'vis_3' },
        },
      };
      const normalized = adapter.normalizeWebhookEvent(raw);
      expect(normalized!.eventType).toBe('payment.succeeded');
      expect(normalized!.projectId).toBe('proj_3');
    });
  });
});

// ─── LemonSqueezy ─────────────────────────────────────────────────────────────

describe('LemonSqueezyAdapter', () => {
  const adapter = new LemonSqueezyAdapter();
  const secret = 'ls_secret_qwe';
  const payload = JSON.stringify({ meta: { event_name: 'order_created' } });
  const buf = Buffer.from(payload);

  describe('verifyWebhookSignature', () => {
    it('accepts valid HMAC-SHA256 signature', () => {
      const sig = makeLSSignature(payload, secret);
      expect(adapter.verifyWebhookSignature(buf, sig, secret)).toBe(true);
    });

    it('rejects tampered payload', () => {
      const sig = makeLSSignature('different_payload', secret);
      expect(adapter.verifyWebhookSignature(buf, sig, secret)).toBe(false);
    });
  });

  describe('normalizeWebhookEvent', () => {
    it('normalizes order_created to payment.succeeded', () => {
      const raw = {
        meta: { event_name: 'order_created' },
        data: {
          id: 'ord_1',
          attributes: {
            total: 999,
            currency: 'USD',
            status: 'paid',
            created_at: new Date().toISOString(),
            meta: {
              custom_data: { projectid: 'proj_ls', deviceid: 'dev_ls' },
            },
          },
        },
      };
      const normalized = adapter.normalizeWebhookEvent(raw);
      expect(normalized!.eventType).toBe('payment.succeeded');
      expect(normalized!.amount).toBe(999);
      expect(normalized!.projectId).toBe('proj_ls');
      expect(normalized!.deviceId).toBe('dev_ls');
    });

    it('normalizes subscription_cancelled correctly', () => {
      const raw = {
        meta: { event_name: 'subscription_cancelled' },
        data: {
          id: 'sub_1',
          attributes: {
            total: 0,
            currency: 'USD',
            status: 'cancelled',
            created_at: new Date().toISOString(),
            meta: { custom_data: {} },
          },
        },
      };
      const normalized = adapter.normalizeWebhookEvent(raw);
      expect(normalized!.eventType).toBe('subscription.cancelled');
    });

    it('returns null for unknown event names', () => {
      const raw = { meta: { event_name: 'unknown_event' }, data: { id: 'x', attributes: {} } };
      expect(adapter.normalizeWebhookEvent(raw)).toBeNull();
    });
  });
});
