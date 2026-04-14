import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const metadataValidator = v.optional(
  v.object({
    repo: v.optional(v.string()),
    severity: v.optional(v.string()),
    url: v.optional(v.string()),
    title: v.optional(v.string()),
    author: v.optional(v.string()),
    prNumber: v.optional(v.number()),
    file: v.optional(v.string()),
    line: v.optional(v.number()),
    monitor: v.optional(v.string()),
    environment: v.optional(v.string()),
  })
);

export const addEvent = mutation({
  args: {
    source: v.string(),
    eventType: v.string(),
    eventId: v.string(),
    payload: v.string(),
    metadata: metadataValidator,
    agentTarget: v.optional(v.string()),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    // Deduplicate by source + eventId
    const existing = await ctx.db
      .query("webhookEvents")
      .withIndex("by_source_eventId", (q) =>
        q.eq("source", args.source).eq("eventId", args.eventId)
      )
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("webhookEvents", {
      ...args,
      status: "pending",
    });
  },
});

export const getUnprocessed = query({
  args: {
    source: v.optional(v.string()),
    agentTarget: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.agentTarget) {
      return await ctx.db
        .query("webhookEvents")
        .withIndex("by_agentTarget_status", (q) =>
          q.eq("agentTarget", args.agentTarget).eq("status", "pending")
        )
        .collect();
    }

    if (args.source) {
      return await ctx.db
        .query("webhookEvents")
        .withIndex("by_source_status", (q) =>
          q.eq("source", args.source).eq("status", "pending")
        )
        .collect();
    }

    return await ctx.db
      .query("webhookEvents")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
  },
});

export const markProcessing = mutation({
  args: {
    eventId: v.id("webhookEvents"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.eventId, { status: "processing" });
  },
});

export const markProcessed = mutation({
  args: {
    eventId: v.id("webhookEvents"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.eventId, { status: "processed" });
  },
});

export const getBySource = query({
  args: {
    source: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("webhookEvents")
      .withIndex("by_source_status", (q) => q.eq("source", args.source))
      .order("desc")
      .collect();

    if (args.limit) {
      return results.slice(0, args.limit);
    }
    return results;
  },
});
