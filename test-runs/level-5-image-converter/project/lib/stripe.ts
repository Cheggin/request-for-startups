/**
 * Stripe billing configuration.
 *
 * Shared constants importable from both server and client code.
 * Server actions live in lib/stripe-actions.ts ("use server" module).
 */

// ---------------------------------------------------------------------------
// Plan configuration
// ---------------------------------------------------------------------------

export const PRO_PLAN = {
  name: "Pro",
  priceId: "price_pro_monthly", // Replace with your Stripe Price ID
  monthlyPrice: 8,
} as const;

// ---------------------------------------------------------------------------
// Billing routes
// ---------------------------------------------------------------------------

export const BILLING_ROUTES = {
  pricing: "/pricing",
  checkout: "/checkout",
  success: "/checkout/success",
  webhook: "/api/webhooks/stripe",
} as const;
