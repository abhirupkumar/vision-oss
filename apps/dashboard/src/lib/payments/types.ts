/**
 * Normalized internal payment event schema.
 * All provider adapters must map their raw webhook payloads to this shape.
 */
export interface NormalizedPaymentEvent {
  /** Provider-assigned stable event ID — used for idempotency. */
  providerEventId: string;
  /** Vision project ID sourced from checkout metadata. */
  projectId: string | null;
  /** Identified visitor ID sourced from checkout metadata (optional). */
  visitorId: string | null;
  /** Anonymous device ID sourced from checkout metadata (optional, fallback). */
  deviceId: string | null;
  /** Normalized event type. */
  eventType: PaymentEventType;
  /** ISO 4217 currency code, lowercase. */
  currency: string;
  /** Payment amount in smallest currency unit (e.g. cents). */
  amount: number;
  /** Human-readable status string from provider. */
  status: string;
  /** ISO 8601 timestamp when the payment occurred at the provider. */
  occurredAt: Date;
  /** Original raw payload, stored verbatim for debugging. */
  rawPayload: Record<string, unknown>;
}

export type PaymentEventType =
  | 'payment.succeeded'
  | 'payment.failed'
  | 'payment.pending'
  | 'payment.refunded'
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.cancelled'
  | 'subscription.renewed';

/**
 * Result of a provider credential + permission check.
 */
export interface PermissionCheckResult {
  ok: boolean;
  missingPermissions: string[];
  details?: string;
}

/**
 * Result of webhook registration with the provider.
 */
export interface WebhookCreateResult {
  ok: boolean;
  webhookId: string | null;
  webhookSecret: string | null;
  error?: string;
}

/**
 * Interface every provider adapter must implement.
 */
export interface ProviderAdapter {
  /** Human-readable provider name */
  readonly name: string;
  /** Validate the supplied credentials (e.g. API key) */
  validateCredentials(config: Record<string, string>): Promise<boolean>;
  /** Check that the credentials have the required read-only scopes */
  checkRequiredPermissions(config: Record<string, string>): Promise<PermissionCheckResult>;
  /** Register a webhook endpoint with the provider */
  createWebhook(config: Record<string, string>, endpointUrl: string): Promise<WebhookCreateResult>;
  /** Verify an incoming webhook request signature */
  verifyWebhookSignature(payload: Buffer, signature: string, secret: string): boolean;
  /** Normalize a raw provider webhook payload to the internal schema */
  normalizeWebhookEvent(rawBody: Record<string, unknown>): NormalizedPaymentEvent | null;
}

/**
 * Required webhook events per provider.
 * This matrix is used both for documentation and for webhook registration calls.
 */
export const REQUIRED_WEBHOOK_EVENTS: Record<string, string[]> = {
  stripe: [
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'checkout.session.completed',
    'charge.refunded',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.paid',
    'invoice.payment_failed',
  ],
  paddle: [
    'transaction.completed',
    'transaction.payment_failed',
    'transaction.refunded',
    'subscription.created',
    'subscription.updated',
    'subscription.cancelled',
    'subscription.paused',
  ],
  polar: [
    'order.created',
    'subscription.created',
    'subscription.updated',
    'subscription.cancelled',
    'subscription.revoked',
    'checkout.created',
    'checkout.updated',
  ],
  lemonsqueezy: [
    'order_created',
    'subscription_created',
    'subscription_updated',
    'subscription_cancelled',
    'subscription_expired',
    'subscription_payment_success',
    'subscription_payment_failed',
    'subscription_payment_refunded',
  ],
};

/**
 * Required permissions / capabilities per provider.
 * What the adapter checks via checkRequiredPermissions().
 */
export const REQUIRED_PERMISSIONS: Record<string, string[]> = {
  stripe: ['read:charges', 'read:payment_intents', 'read:subscriptions', 'webhook:write'],
  paddle: ['read:transactions', 'read:subscriptions', 'webhook:write'],
  polar: ['read:orders', 'read:subscriptions', 'webhook:write'],
  lemonsqueezy: ['read:orders', 'read:subscriptions', 'read:webhooks', 'webhook:write'],
};

/**
 * Checkout metadata attribution keys (public contract).
 * These must be set when creating a checkout session.
 */
export const ATTRIBUTION_KEYS = {
  PROJECT_ID: 'projectId',
  VISITOR_ID: 'visitorid',
  DEVICE_ID: 'deviceid',
} as const;
