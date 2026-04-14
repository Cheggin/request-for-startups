import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
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
