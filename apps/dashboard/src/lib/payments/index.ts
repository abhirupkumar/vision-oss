import { LemonSqueezyAdapter } from './lemonsqueezy';
import { PaddleAdapter } from './paddle';
import { PolarAdapter } from './polar';
import { StripeAdapter } from './stripe';
import type { ProviderAdapter } from './types';

export type PaymentProviderKey = 'stripe' | 'paddle' | 'polar' | 'lemonsqueezy';

const adapters: Record<PaymentProviderKey, ProviderAdapter> = {
  stripe: new StripeAdapter(),
  paddle: new PaddleAdapter(),
  polar: new PolarAdapter(),
  lemonsqueezy: new LemonSqueezyAdapter(),
};

/**
 * Get a provider adapter by key.
 * Throws if the provider is not supported.
 */
export function getProviderAdapter(provider: PaymentProviderKey): ProviderAdapter {
  const adapter = adapters[provider];
  if (!adapter) {
    throw new Error(`Unsupported payment provider: ${provider}`);
  }
  return adapter;
}

/**
 * Build the webhook endpoint URL for a provider.
 * Falls back to NEXT_PUBLIC_APP_URL or window.location.origin.
 */
export function buildWebhookUrl(provider: PaymentProviderKey): string {
  const base = process.env.WEBHOOK_BASE_URL || process.env.NEXT_PUBLIC_API_URL || '';
  return `${base}/webhooks/payments/${provider}`;
}

export { StripeAdapter, PaddleAdapter, PolarAdapter, LemonSqueezyAdapter };
export * from './types';
