/**
 * Stripe billing constants.
 * Define all pricing tiers, feature lists, and plan metadata here.
 * Update these values to match your Stripe Dashboard price IDs.
 */

export const STRIPE_CONFIG = {
  /**
   * Stripe publishable key — loaded from environment.
   * Used client-side for Embedded Checkout.
   */
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
} as const;

// ---------------------------------------------------------------------------
// Plan definitions
// ---------------------------------------------------------------------------

export type PlanId = "free" | "starter" | "pro" | "enterprise";

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PricingPlan {
  id: PlanId;
  name: string;
  description: string;
  monthlyPriceId: string | null; // Stripe Price ID — null for free tier
  annualPriceId: string | null;
  monthlyPrice: number; // display price in dollars
  annualPrice: number; // display price in dollars (per year)
  features: PlanFeature[];
  highlighted: boolean; // visually emphasize this plan
  cta: string; // call-to-action button text
  trialDays: number;
}

export const PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "For individuals getting started",
    monthlyPriceId: null,
    annualPriceId: null,
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      { text: "Up to 100 requests/month", included: true },
      { text: "Community support", included: true },
      { text: "Basic analytics", included: true },
      { text: "Custom domain", included: false },
      { text: "Priority support", included: false },
      { text: "Advanced analytics", included: false },
    ],
    highlighted: false,
    cta: "Get Started",
    trialDays: 0,
  },
  {
    id: "starter",
    name: "Starter",
    description: "For small teams shipping fast",
    monthlyPriceId: "price_starter_monthly", // Replace with your Stripe Price ID
    annualPriceId: "price_starter_annual",
    monthlyPrice: 29,
    annualPrice: 290,
    features: [
      { text: "Up to 10,000 requests/month", included: true },
      { text: "Email support", included: true },
      { text: "Basic analytics", included: true },
      { text: "Custom domain", included: true },
      { text: "Priority support", included: false },
      { text: "Advanced analytics", included: false },
    ],
    highlighted: false,
    cta: "Start Free Trial",
    trialDays: 14,
  },
  {
    id: "pro",
    name: "Pro",
    description: "For growing teams that need more",
    monthlyPriceId: "price_pro_monthly", // Replace with your Stripe Price ID
    annualPriceId: "price_pro_annual",
    monthlyPrice: 79,
    annualPrice: 790,
    features: [
      { text: "Unlimited requests", included: true },
      { text: "Priority support", included: true },
      { text: "Advanced analytics", included: true },
      { text: "Custom domain", included: true },
      { text: "Priority support", included: true },
      { text: "Team management", included: true },
    ],
    highlighted: true,
    cta: "Start Free Trial",
    trialDays: 14,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For organizations with custom needs",
    monthlyPriceId: "price_enterprise_monthly", // Replace with your Stripe Price ID
    annualPriceId: "price_enterprise_annual",
    monthlyPrice: 249,
    annualPrice: 2490,
    features: [
      { text: "Unlimited requests", included: true },
      { text: "Dedicated support engineer", included: true },
      { text: "Advanced analytics", included: true },
      { text: "Custom domain", included: true },
      { text: "SSO / SAML", included: true },
      { text: "SLA guarantee", included: true },
    ],
    highlighted: false,
    cta: "Contact Sales",
    trialDays: 0,
  },
];

// ---------------------------------------------------------------------------
// Subscription statuses
// ---------------------------------------------------------------------------

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | "paused";

/**
 * Statuses that grant access to paid features.
 * cancel_at_period_end is handled separately — access continues until period ends.
 */
export const ACTIVE_STATUSES: SubscriptionStatus[] = [
  "active",
  "trialing",
];

// ---------------------------------------------------------------------------
// Webhook events we handle
// ---------------------------------------------------------------------------

export const HANDLED_WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "invoice.paid",
  "customer.subscription.updated",
  "customer.subscription.deleted",
] as const;

export type HandledWebhookEvent = (typeof HANDLED_WEBHOOK_EVENTS)[number];

// ---------------------------------------------------------------------------
// Route paths
// ---------------------------------------------------------------------------

export const BILLING_ROUTES = {
  pricing: "/pricing",
  checkout: "/checkout",
  success: "/checkout/success",
  cancel: "/checkout/cancel",
  billingPortal: "/api/stripe/portal",
  webhook: "/api/stripe/webhook",
} as const;
