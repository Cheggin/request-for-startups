import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  cubicEvents: defineTable({
    repo: v.string(),
    prNumber: v.number(),
    file: v.optional(v.string()),
    line: v.optional(v.number()),
    severity: v.string(),
    message: v.string(),
    author: v.string(),
    commentId: v.number(),
    status: v.union(v.literal("pending"), v.literal("processed")),
  })
    .index("by_status", ["status"])
    .index("by_repo_status", ["repo", "status"])
    .index("by_commentId", ["commentId"]),
});
