import { DodoPayments } from 'dodopayments';

let dodoClient: DodoPayments | null = null;

export function getDodoClient(): DodoPayments {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  if (!apiKey) {
    throw new Error('DODO_PAYMENTS_API_KEY is not set in environment variables');
  }

  if (!dodoClient) {
    const environment = (process.env.DODO_PAYMENTS_ENVIRONMENT === 'live_mode' ? 'live_mode' : 'test_mode');
    dodoClient = new DodoPayments({
      bearerToken: apiKey,
      webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_SECRET || null,
      environment,
    });
  }

  return dodoClient;
}

export async function createCheckoutSession({
  organizationId,
  email,
  name,
  returnUrl,
}: {
  organizationId: string;
  email?: string;
  name?: string;
  returnUrl: string;
}) {
  const client = getDodoClient();
  const productId = process.env.DODO_PAYMENTS_BASE_PRODUCT_ID;
  if (!productId) {
    throw new Error('DODO_PAYMENTS_BASE_PRODUCT_ID is not set in environment variables');
  }

  const session = await client.checkoutSessions.create({
    product_cart: [
      {
        product_id: productId,
        quantity: 1,
      },
    ],
    billing_address: undefined,
    customer: email
      ? {
          email,
          name: name || email.split('@')[0],
        }
      : undefined,
    return_url: returnUrl,
    metadata: {
      organizationId,
    },
  });

  return {
    checkoutUrl: (session as any).checkout_url,
    sessionId: (session as any).id,
  };
}

export async function createCustomerPortalSession(
  customerId: string,
  returnUrl?: string
) {
  const client = getDodoClient();
  const session = await client.customers.customerPortal.create(customerId, {
    return_url: returnUrl,
  });

  return {
    portalUrl: (session as any).url || (session as any).portal_url,
  };
}

export function unwrapWebhook(rawBody: string, headers: Record<string, string>) {
  const client = getDodoClient();
  return client.webhooks.unwrap(rawBody, { headers });
}
