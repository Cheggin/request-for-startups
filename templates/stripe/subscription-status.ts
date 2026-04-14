/**
 * Convex functions for local subscription state.
 *
 * Store subscription data in Convex so you never need to query Stripe on every request.
 * Webhooks update this state — it is the local cache of Stripe's source of truth.
 *
 * @see https://docs.convex.dev/functions
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ACTIVE_STATUSES, type SubscriptionStatus } from "./constants";

// ---------------------------------------------------------------------------
// Schema (add to your convex/schema.ts)
// ---------------------------------------------------------------------------

/**
 * Add this table to your Convex schema:
 *
 * subscriptions: defineTable({
 *   userId: v.id("users"),
 *   stripeCustomerId: v.string(),
 *   stripeSubscriptionId: v.string(),
 *   stripePriceId: v.string(),
 *   email: v.optional(v.string()),
 *   status: v.string(),
 *   currentPeriodEnd: v.string(),
 *   cancelAtPeriodEnd: v.boolean(),
 *   createdAt: v.string(),
 *   updatedAt: v.string(),
 * })
 *   .index("by_user", ["userId"])
 *   .index("by_stripe_customer", ["stripeCustomerId"])
 *   .index("by_stripe_subscription", ["stripeSubscriptionId"]),
 */

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Get the current user's subscription.
 * Returns null if the user has no subscription (free tier).
 */
export const getSubscription = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

/**
 * Check if a user has an active subscription.
 * Accounts for cancel_at_period_end — access continues until period ends.
 */
export const isSubscriptionActive = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!subscription) return false;

    const status = subscription.status as SubscriptionStatus;

    // If cancel_at_period_end, check if the period has actually ended
    if (subscription.cancelAtPeriodEnd) {
      const periodEnd = new Date(subscription.currentPeriodEnd);
      if (periodEnd > new Date()) {
        // Period hasn't ended yet — still active
        return true;
      }
      return false;
    }

    return ACTIVE_STATUSES.includes(status);
  },
});

/**
 * Get subscription by Stripe subscription ID.
 * Used by webhook handlers to find the local record.
 */
export const getByStripeSubscriptionId = query({
  args: { stripeSubscriptionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
      )
      .first();
  },
});

// ---------------------------------------------------------------------------
// Mutations (called by webhook handlers)
// ---------------------------------------------------------------------------

/**
 * Create a new subscription record after checkout.session.completed.
 */
export const create = mutation({
  args: {
    userId: v.id("users"),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    stripePriceId: v.string(),
    email: v.optional(v.string()),
    status: v.string(),
    currentPeriodEnd: v.string(),
    cancelAtPeriodEnd: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    // Check for existing subscription for this user
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      // Update existing record instead of creating a duplicate
      return await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now,
      });
    }

    return await ctx.db.insert("subscriptions", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update subscription status and period.
 * Called by invoice.paid and customer.subscription.updated webhooks.
 */
export const update = mutation({
  args: {
    stripeSubscriptionId: v.string(),
    stripePriceId: v.optional(v.string()),
    status: v.string(),
    currentPeriodEnd: v.string(),
    cancelAtPeriodEnd: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
      )
      .first();

    if (!subscription) {
      console.warn(
        `No local subscription found for Stripe ID: ${args.stripeSubscriptionId}`
      );
      return;
    }

    await ctx.db.patch(subscription._id, {
      status: args.status,
      currentPeriodEnd: args.currentPeriodEnd,
      ...(args.stripePriceId ? { stripePriceId: args.stripePriceId } : {}),
      ...(args.cancelAtPeriodEnd !== undefined
        ? { cancelAtPeriodEnd: args.cancelAtPeriodEnd }
        : {}),
      updatedAt: new Date().toISOString(),
    });
  },
});

/**
 * Mark a subscription as canceled.
 * Called by customer.subscription.deleted webhook.
 */
export const cancel = mutation({
  args: {
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
      )
      .first();

    if (!subscription) {
      console.warn(
        `No local subscription found for Stripe ID: ${args.stripeSubscriptionId}`
      );
      return;
    }

    await ctx.db.patch(subscription._id, {
      status: "canceled",
      cancelAtPeriodEnd: false,
      updatedAt: new Date().toISOString(),
    });
  },
});
