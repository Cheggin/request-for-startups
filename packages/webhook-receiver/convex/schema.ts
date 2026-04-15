import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  mentions: defineTable({
    platform: v.union(
      v.literal("reddit"),
      v.literal("hn"),
      v.literal("twitter"),
      v.literal("linkedin")
    ),
    externalId: v.string(),
    keyword: v.string(),
    title: v.string(),
    content: v.string(),
    url: v.string(),
    author: v.string(),
    engagement: v.number(),
    commentCount: v.number(),
    score: v.number(),
    sentiment: v.union(
      v.literal("positive"),
      v.literal("negative"),
      v.literal("neutral")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("scored"),
      v.literal("queued_for_response"),
      v.literal("ignored")
    ),
    dedupKey: v.string(),
    createdAt: v.string(),
    ingestedAt: v.number(),
  })
    .index("by_dedupKey", ["dedupKey"])
    .index("by_platform_status", ["platform", "status"])
    .index("by_status", ["status"])
    .index("by_score", ["score"]),

  responseQueue: defineTable({
    mentionId: v.string(),
    platform: v.union(
      v.literal("reddit"),
      v.literal("hn"),
      v.literal("twitter"),
      v.literal("linkedin")
    ),
    url: v.string(),
    replyAngle: v.string(),
    priority: v.number(),
    status: v.union(
      v.literal("queued"),
      v.literal("drafted"),
      v.literal("posted"),
      v.literal("attributed")
    ),
    responseText: v.optional(v.string()),
    postedAt: v.optional(v.string()),
    attributionData: v.optional(
      v.object({
        clickThrough: v.optional(v.number()),
        referralUrl: v.optional(v.string()),
      })
    ),
    createdAt: v.number(),
  })
    .index("by_mentionId", ["mentionId"])
    .index("by_status", ["status"])
    .index("by_priority", ["priority"]),

  webhookEvents: defineTable({
    source: v.string(),
    eventType: v.string(),
    eventId: v.string(),
    payload: v.string(),
    metadata: v.optional(
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
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("processed")
    ),
    agentTarget: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_source_status", ["source", "status"])
    .index("by_source_eventId", ["source", "eventId"])
    .index("by_agentTarget_status", ["agentTarget", "status"]),
});
