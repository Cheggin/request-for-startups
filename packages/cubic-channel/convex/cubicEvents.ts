import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const addEvent = mutation({
  args: {
    repo: v.string(),
    prNumber: v.number(),
    file: v.optional(v.string()),
    line: v.optional(v.number()),
    severity: v.string(),
    message: v.string(),
    author: v.string(),
    commentId: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("cubicEvents")
      .filter((q) => q.eq(q.field("commentId"), args.commentId))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("cubicEvents", {
      ...args,
      status: "pending",
    });
  },
});

export const getUnprocessed = query({
  args: {
    repo: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cubicEvents")
      .withIndex("by_repo_status", (q) =>
        q.eq("repo", args.repo).eq("status", "pending")
      )
      .collect();
  },
});

export const markProcessed = mutation({
  args: {
    eventId: v.id("cubicEvents"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.eventId, { status: "processed" });
  },
});

export const markAllProcessed = mutation({
  args: {
    repo: v.string(),
  },
  handler: async (ctx, args) => {
    const pending = await ctx.db
      .query("cubicEvents")
      .withIndex("by_repo_status", (q) =>
        q.eq("repo", args.repo).eq("status", "pending")
      )
      .collect();

    for (const event of pending) {
      await ctx.db.patch(event._id, { status: "processed" });
    }

    return pending.length;
  },
});
