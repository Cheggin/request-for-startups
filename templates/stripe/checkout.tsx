"use client";

/**
 * Embedded Stripe Checkout component.
 *
 * Uses Stripe Embedded Checkout (not redirect) to keep the user on your domain.
 * Session creation happens via a Server Action — no separate API route needed.
 *
 * Usage:
 *   <EmbeddedCheckout priceId="price_pro_monthly" />
 *
 * @see https://docs.stripe.com/checkout/embedded/quickstart
 */

import { useCallback, useState } from "react";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout as StripeEmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { STRIPE_CONFIG, BILLING_ROUTES } from "./constants";

const stripePromise = loadStripe(STRIPE_CONFIG.publishableKey);

// ---------------------------------------------------------------------------
// Server Action — creates a Checkout Session on the server
// ---------------------------------------------------------------------------

async function createCheckoutSession(
  priceId: string,
  trialDays?: number
): Promise<string> {
  "use server";

  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY!);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    ui_mode: "embedded",
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}${BILLING_ROUTES.success}?session_id={CHECKOUT_SESSION_ID}`,
    ...(trialDays && trialDays > 0
      ? { subscription_data: { trial_period_days: trialDays } }
      : {}),
  });

  return session.client_secret as string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface EmbeddedCheckoutProps {
  priceId: string;
  trialDays?: number;
}

export function EmbeddedCheckout({
  priceId,
  trialDays,
}: EmbeddedCheckoutProps) {
  const [error, setError] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async () => {
    try {
      const clientSecret = await createCheckoutSession(priceId, trialDays);
      return clientSecret;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create checkout session";
      setError(message);
      throw err;
    }
  }, [priceId, trialDays]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">
          Something went wrong loading checkout. Please try again.
        </p>
        <button
          onClick={() => setError(null)}
          className="mt-3 text-sm font-medium text-red-600 underline hover:text-red-800"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div id="checkout" className="w-full">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ fetchClientSecret }}
      >
        <StripeEmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Success page helper — verify the session on mount
// ---------------------------------------------------------------------------

export async function verifyCheckoutSession(sessionId: string) {
  "use server";

  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY!);

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  return {
    status: session.status,
    customerEmail: session.customer_details?.email ?? null,
    subscriptionId: session.subscription as string | null,
  };
}
