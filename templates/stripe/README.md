# Stripe Billing Integration

Embedded Checkout + webhooks-as-source-of-truth pattern for Next.js + Convex.

## Architecture

- **Embedded Checkout** keeps users on your domain (no Stripe redirect). PCI compliant out of the box.
- **Server Actions** create Checkout Sessions — no separate API route needed for session creation.
- **Webhooks** are the single source of truth for subscription state. Never trust redirect URLs.
- **Convex subscription table** caches Stripe state locally so you never query the Stripe API on every page load.
- **cancel_at_period_end** is handled gracefully — users retain access until their paid period ends.

## Environment Variables

Add these to your `.env`:

```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Setup

1. Install dependencies:

```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

2. Create products and prices in the [Stripe Dashboard](https://dashboard.stripe.com/products).

3. Update `constants.ts` with your real Stripe Price IDs:
   - Replace `price_starter_monthly`, `price_starter_annual`, etc.

4. Add the Convex schema from `subscription-status.ts` to your `convex/schema.ts`.

5. Set up webhooks (see below).

## Webhook Setup

### Local Development

Use the Stripe CLI to forward webhooks to your local server:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret (`whsec_...`) from the CLI output into your `.env`.

### Production

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks).
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Subscribe to these events:
   - `checkout.session.completed`
   - `invoice.paid`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the signing secret to your production environment variables.

## Files

| File | Purpose |
|------|---------|
| `constants.ts` | Price IDs, plan definitions, feature lists, route paths |
| `checkout.tsx` | Embedded Checkout component + Server Action for session creation |
| `webhook-handler.ts` | Next.js API route handling 4 webhook event types |
| `pricing.tsx` | Pricing page with tier cards and monthly/annual toggle |
| `subscription-status.ts` | Convex queries and mutations for local subscription state |

## Testing with Stripe CLI

```bash
# Trigger specific events
stripe trigger checkout.session.completed
stripe trigger invoice.paid
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

## Key Design Decisions

- **Embedded Checkout over redirect**: User stays on your domain. Better conversion rates.
- **Webhooks over polling**: Stripe pushes state changes to you. No cron jobs.
- **Local Convex cache**: `isSubscriptionActive` query runs in milliseconds against Convex, not seconds against the Stripe API.
- **Idempotent handlers**: Webhook handlers use upsert logic. Stripe may send duplicate events.
- **Graceful cancellation**: `cancel_at_period_end` does not revoke access immediately. Users keep access until their paid period ends.
