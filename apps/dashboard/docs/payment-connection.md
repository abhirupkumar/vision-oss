# Payment Provider Connection

Vision can automatically ingest revenue events from your payment provider and correlate them with your analytics sessions. This guide covers setup, required permissions, and the checkout metadata contract.

---

## Supported Providers

| Provider | Type |
|---|---|
| **Stripe** | Direct API key + webhook |
| **Paddle** | Paddle Billing v2 API key + notification settings |
| **Polar** | Personal access token + webhook endpoint |
| **Lemon Squeezy** | API key + Store ID + webhook |

> [!NOTE]
> For providers not in this list (PayPal, Braintree, Square, etc.) use Vision's built-in [`revenue` event tracking](#fallback-revenue-events) instead.

---

## Setup During Onboarding

When you create a workspace or project, Vision's onboarding wizard includes an optional **Connect Payment Provider** step:

1. Select your provider from the dropdown.
2. Enter the required API credentials.
3. Click **Connect Provider**.

Vision will automatically:
- Validate your credentials
- Check for required read permissions
- Register a webhook endpoint with the provider
- Store the connection securely

> [!IMPORTANT]
> Once you click **Connect Provider**, the **Next** button is disabled until the connection succeeds. If permissions are missing, you must fix them before continuing.

You may **skip** this step entirely — it can be connected later from your project settings.

---

## Provider-Specific Setup

### Stripe

1. Go to [Stripe API Keys](https://dashboard.stripe.com/apikeys)
2. Copy your **Secret key** (`sk_live_...`)
3. Ensure the key is not restricted — or grant these permissions:

| Permission | Required For |
|---|---|
| `read:charges` | Payment history |
| `read:payment_intents` | Payment status |
| `read:subscriptions` | Subscription lifecycle |
| Webhook creation | Auto-registered by Vision |

Vision registers the following Stripe events:
```
payment_intent.succeeded    payment_intent.payment_failed
checkout.session.completed  charge.refunded
customer.subscription.created   customer.subscription.updated
customer.subscription.deleted   invoice.paid   invoice.payment_failed
```

---

### Paddle

1. Go to [Paddle Authentication](https://vendors.paddle.com/authentication-v2)
2. Generate an API key with **read** access
3. Required permissions:

| Permission | Required For |
|---|---|
| `read:transactions` | Payment history |
| `read:subscriptions` | Subscription data |
| Notification settings | Auto-registered by Vision |

Vision registers these Paddle events:
```
transaction.completed   transaction.payment_failed   transaction.refunded
subscription.created    subscription.updated         subscription.cancelled   subscription.paused
```

---

### Polar

1. Go to [Polar Settings → API Tokens](https://polar.sh/settings)
2. Generate a **Personal Access Token**
3. Optionally provide your **Organization ID** to scope the webhook

Required permissions:
```
read:orders        read:subscriptions
```

Vision generates a random webhook secret locally and registers it with Polar.

---

### Lemon Squeezy

1. Go to [Lemon Squeezy API Settings](https://app.lemonsqueezy.com/settings/api)
2. Generate an API key
3. Find your **Store ID** from the store dashboard URL: `/stores/{storeId}`

Required permissions:
```
read:orders   read:subscriptions   read:webhooks
```

---

## Checkout Metadata Contract

> [!IMPORTANT]
> This is the **most critical part** of payment attribution. Without these metadata keys, revenue events cannot be linked to visitor sessions.

Vision uses a **maximum of two identifiers** passed in checkout session metadata:

| Key | Type | When to use |
|---|---|---|
| `projectId` | **Required** | Always — your Vision project ID |
| `visitorid` | Preferred | When the user is identified (logged in) |
| `deviceid` | Fallback | When the user is anonymous |

Pass exactly one visitor identifier — `visitorid` for known users, `deviceid` for anonymous visitors.

### Attribution Rules

```
projectId + visitorid  → Full attributed event (joins to identified user session)
projectId + deviceid   → Anonymous attributed event (joins to device session)
projectId only         → Unattributed (stored but cannot link to session)
(nothing)              → Unattributed (logged for debugging)
```

---

## Code Examples

### Stripe — Checkout Session

```typescript
const session = await stripe.checkout.sessions.create({
  line_items: [...],
  mode: 'payment',
  metadata: {
    projectId: 'your-vision-project-id',   // required
    visitorid: user.visionVisitorId,        // identified user
    // — OR —
    deviceid: anonymousDeviceId,           // anonymous visitor
  },
  success_url: 'https://yourapp.com/success',
  cancel_url: 'https://yourapp.com/cancel',
});
```

### Paddle — Transaction (Billing v2)

```typescript
const transaction = await paddle.transactions.create({
  items: [...],
  customData: {
    projectId: 'your-vision-project-id',
    visitorid: user.visionVisitorId,
    // or: deviceid: anonymousDeviceId,
  },
});
```

### Polar — Checkout

```typescript
const checkout = await polar.checkouts.create({
  productId: 'prod_xxx',
  metadata: {
    projectId: 'your-vision-project-id',
    visitorid: user.visionVisitorId,
    // or: deviceid: anonymousDeviceId,
  },
});
```

### Lemon Squeezy — Checkout

```typescript
const checkout = await lemonSqueezyClient.checkout({
  storeId: 12345,
  variantId: 'var_xxx',
  checkoutData: {
    custom: {
      projectId: 'your-vision-project-id',
      visitorid: user.visionVisitorId,
      // or: deviceid: anonymousDeviceId,
    },
  },
});
```

---

## Fallback: Revenue Events (Unsupported Providers)

For payment providers **not supported** by Vision's native webhook integration (e.g. PayPal, Braintree, Square), use Vision's built-in `revenue` event from your server:

```javascript
// Send a revenue event from your server after payment confirmation
fetch('https://your-sigma-url/api/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'event',
    payload: {
      projectId: 'your-vision-project-id',
      hostname: 'yourapp.com',
      name: 'revenue',
      data: {
        revenue: 49.99,
        currency: 'USD',
        orderId: 'order_abc123',
      },
    },
  }),
});
```

This writes directly to the `Revenue` table and integrates with all Vision revenue analytics views.

---

## Webhook Troubleshooting

### "Invalid webhook signature"
- Your API key may have been rotated after connection — reconnect to re-register the webhook
- The provider may have sent a test event using a different secret

### "Missing required permissions"
- Stripe: use the **Secret key**, not the **Publishable key**
- Paddle: ensure the API key is not scoped to read-only for a specific entity
- Lemon Squeezy: verify the Store ID matches the store the API key belongs to

### "No active connections found"
- The connection may be in `pending` or `failed` state — reconnect in project settings
- Check that the webhook URL is publicly accessible (not `localhost`)

### Revenue not appearing in analytics
- Verify `projectId` matches your Vision project ID exactly
- Ensure `visitorid` or `deviceid` is passed in metadata — without it, events are unattributed
- Anonymous events (`deviceid` only) will only link to sessions where the tracker saw that device
