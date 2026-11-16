export type PaymentProvider = 'stripe' | 'paddle' | 'polar' | 'lemonsqueezy';

export interface ProviderField {
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
}

export interface ProviderConfig {
  key: PaymentProvider;
  label: string;
  color: string;
  logo: string;
  description: string;
  docsUrl: string;
  fields: ProviderField[];
}

export const PAYMENT_PROVIDERS: ProviderConfig[] = [
  {
    key: 'stripe',
    label: 'Stripe',
    color: '#635BFF',
    logo: '💳',
    description: "The world's most popular payment platform.",
    docsUrl: 'https://dashboard.stripe.com/apikeys',
    fields: [
      {
        name: 'apiKey',
        label: 'Restricted API Key',
        placeholder: 'rk_live_...',
        type: 'password',
        required: true,
      },
    ],
  },
  {
    key: 'paddle',
    label: 'Paddle',
    color: '#00C896',
    logo: '🏓',
    description: 'Merchant of record for SaaS businesses.',
    docsUrl: 'https://vendors.paddle.com/authentication-v2',
    fields: [
      {
        name: 'apiKey',
        label: 'API Key',
        placeholder: 'pdl_live_...',
        type: 'password',
        required: true,
      },
    ],
  },
  {
    key: 'polar',
    label: 'Polar',
    color: '#6366F1',
    logo: '❄️',
    description: 'Open-source monetization for developers.',
    docsUrl: 'https://polar.sh/settings',
    fields: [
      {
        name: 'apiKey',
        label: 'Access Token',
        placeholder: 'polar_at_...',
        type: 'password',
        required: true,
      },
      {
        name: 'organizationId',
        label: 'Organization ID (optional)',
        placeholder: 'org_...',
      },
    ],
  },
  {
    key: 'lemonsqueezy',
    label: 'Lemon Squeezy',
    color: '#FFD83D',
    logo: '🍋',
    description: 'Simple payments for digital products.',
    docsUrl: 'https://app.lemonsqueezy.com/settings/api',
    fields: [
      {
        name: 'apiKey',
        label: 'API Key',
        placeholder: 'eyJ...',
        type: 'password',
        required: true,
      },
      {
        name: 'storeId',
        label: 'Store ID',
        placeholder: '12345',
        required: true,
      },
    ],
  },
];

export const PROVIDER_MAP = PAYMENT_PROVIDERS.reduce(
  (acc, p) => {
    acc[p.key] = p;
    return acc;
  },
  {} as Record<PaymentProvider, ProviderConfig>,
);
