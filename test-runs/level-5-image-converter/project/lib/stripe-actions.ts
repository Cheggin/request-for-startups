"use server";

/**
 * Stripe server actions.
 *
 * This file has the "use server" directive at the top so all exported
 * functions are Server Actions — safe to import from Client Components.
 */

import Stripe from "stripe";
import { BILLING_ROUTES } from "./stripe";

function getStripeServer() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-03-25.dahlia",
  });
}

export async function createCheckoutSession(priceId: string): Promise<string> {
  const stripe = getStripeServer();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    ui_mode: "embedded_page",
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}${BILLING_ROUTES.success}?session_id={CHECKOUT_SESSION_ID}`,
  });

  return session.client_secret as string;
}

export async function verifyCheckoutSession(sessionId: string) {
  const stripe = getStripeServer();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  return {
    status: session.status,
    customerEmail: session.customer_details?.email ?? null,
    subscriptionId: session.subscription as string | null,
  };
}
