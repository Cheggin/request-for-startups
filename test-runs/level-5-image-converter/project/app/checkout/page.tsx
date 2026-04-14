"use client";

import { Suspense, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { createCheckoutSession } from "@/lib/stripe-actions";
import Link from "next/link";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

function CheckoutForm() {
  const searchParams = useSearchParams();
  const priceId = searchParams.get("price");
  const [error, setError] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async () => {
    try {
      return await createCheckoutSession(priceId!);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create checkout session";
      setError(message);
      throw err;
    }
  }, [priceId]);

  if (!priceId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          No plan selected
        </h1>
        <p className="mt-2 text-muted">
          Please choose a plan from the pricing page.
        </p>
        <Link
          href="/pricing"
          className="mt-6 inline-block rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          View Pricing
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="rounded-lg border border-error bg-error-light p-6">
          <p className="text-sm text-error">
            Something went wrong loading checkout. Please try again.
          </p>
          <button
            onClick={() => setError(null)}
            className="mt-3 text-sm font-medium text-error underline hover:opacity-80"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-center text-2xl font-bold text-foreground">
        Complete your purchase
      </h1>
      <div id="checkout">
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{ fetchClientSecret }}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-muted">Loading checkout...</div>
      }
    >
      <CheckoutForm />
    </Suspense>
  );
}
