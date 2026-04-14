/**
 * Stripe webhook handler — Next.js API Route.
 *
 * Webhooks are the source of truth for subscription state.
 * Never trust redirect URLs or client-side session data for billing status.
 *
 * Handles:
 *   - checkout.session.completed — new subscription created
 *   - invoice.paid — recurring payment succeeded
 *   - customer.subscription.updated — plan change, cancel_at_period_end, trial end
 *   - customer.subscription.deleted — subscription fully canceled
 *
 * @see https://docs.stripe.com/webhooks
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { HANDLED_WEBHOOK_EVENTS } from "./constants";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// ---------------------------------------------------------------------------
// Route config — disable body parsing so we can verify the raw signature
// ---------------------------------------------------------------------------

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${message}`);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      default:
        // Unhandled event type — log but don't fail
        console.log(`Unhandled Stripe event: ${event.type}`);
    }
  } catch (err) {
    console.error(`Error processing webhook ${event.type}:`, err);
    // Return 500 so Stripe retries the webhook
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  // Always return 200 for handled events to prevent Stripe from retrying
  return NextResponse.json({ received: true });
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

/**
 * checkout.session.completed
 *
 * Fired when a customer completes Embedded Checkout.
 * Create the local subscription record in Convex.
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;
  const customerEmail = session.customer_details?.email ?? null;

  if (!subscriptionId) {
    console.warn("Checkout session has no subscription — possibly a one-time payment");
    return;
  }

  // Retrieve the full subscription to get plan details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id ?? null;

  // TODO: Replace with your Convex mutation
  // await convex.mutation(api.subscriptions.create, {
  //   stripeCustomerId: customerId,
  //   stripeSubscriptionId: subscriptionId,
  //   stripePriceId: priceId,
  //   email: customerEmail,
  //   status: subscription.status,
  //   currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
  //   cancelAtPeriodEnd: subscription.cancel_at_period_end,
  // });

  console.log(
    `Checkout completed: subscription=${subscriptionId}, customer=${customerId}, price=${priceId}`
  );
}

/**
 * invoice.paid
 *
 * Fired on every successful payment (initial and recurring).
 * Update the subscription period end date.
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // TODO: Replace with your Convex mutation
  // await convex.mutation(api.subscriptions.updatePeriod, {
  //   stripeSubscriptionId: subscriptionId,
  //   status: subscription.status,
  //   currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
  // });

  console.log(
    `Invoice paid: subscription=${subscriptionId}, period_end=${subscription.current_period_end}`
  );
}

/**
 * customer.subscription.updated
 *
 * Fired on plan changes, trial endings, and cancel_at_period_end toggles.
 * Handle cancel_at_period_end gracefully — don't revoke access immediately.
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price.id ?? null;

  // TODO: Replace with your Convex mutation
  // await convex.mutation(api.subscriptions.update, {
  //   stripeSubscriptionId: subscription.id,
  //   stripePriceId: priceId,
  //   status: subscription.status,
  //   currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
  //   cancelAtPeriodEnd: subscription.cancel_at_period_end,
  // });

  if (subscription.cancel_at_period_end) {
    console.log(
      `Subscription ${subscription.id} will cancel at period end (${new Date(
        subscription.current_period_end * 1000
      ).toISOString()}). Access continues until then.`
    );
  } else {
    console.log(
      `Subscription updated: id=${subscription.id}, status=${subscription.status}, price=${priceId}`
    );
  }
}

/**
 * customer.subscription.deleted
 *
 * Fired when a subscription is fully canceled (after period end if cancel_at_period_end was set).
 * Revoke access and downgrade the user to the free tier.
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // TODO: Replace with your Convex mutation
  // await convex.mutation(api.subscriptions.cancel, {
  //   stripeSubscriptionId: subscription.id,
  //   status: "canceled",
  // });

  console.log(`Subscription deleted: id=${subscription.id} — user downgraded to free tier`);
}
