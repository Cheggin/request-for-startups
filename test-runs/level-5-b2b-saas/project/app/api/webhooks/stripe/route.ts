import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const action = request.headers.get("x-action");

  // Checkout session creation (called from the checkout page)
  if (action === "create-checkout") {
    const { getStripe } = await import("@/lib/stripe");
    const stripe = getStripe();
    const body = await request.json();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: body.priceId,
          quantity: 1,
        },
      ],
      success_url: `${request.nextUrl.origin}/dashboard?upgraded=true`,
      cancel_url: `${request.nextUrl.origin}/checkout`,
    });

    return Response.json({ url: session.url });
  }

  // Stripe webhook handling
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const { getStripe } = await import("@/lib/stripe");
  const stripe = getStripe();
  const payload = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      // Handle successful checkout — activate Pro subscription
      console.log("Checkout completed:", session.id);
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object;
      console.log("Subscription updated:", subscription.id);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      // Handle cancellation — downgrade to Free
      console.log("Subscription cancelled:", subscription.id);
      break;
    }
  }

  return Response.json({ received: true });
}
