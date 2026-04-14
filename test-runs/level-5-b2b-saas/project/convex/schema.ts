import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),

  teams: defineTable({
    name: v.string(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }),

  teamMembers: defineTable({
    teamId: v.id("teams"),
    userId: v.optional(v.id("users")),
    email: v.string(),
    role: v.union(v.literal("owner"), v.literal("member")),
    status: v.union(v.literal("pending"), v.literal("active")),
    inviteToken: v.optional(v.string()),
    joinedAt: v.optional(v.number()),
    invitedAt: v.number(),
  })
    .index("by_team", ["teamId"])
    .index("by_user", ["userId"])
    .index("by_invite_token", ["inviteToken"])
    .index("by_team_email", ["teamId", "email"]),

  surveys: defineTable({
    teamId: v.id("teams"),
    createdBy: v.id("users"),
    title: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("closed")
    ),
    questions: v.array(
      v.object({
        id: v.string(),
        type: v.union(v.literal("rating"), v.literal("text")),
        text: v.string(),
        order: v.number(),
      })
    ),
    sentAt: v.optional(v.number()),
    closesAt: v.optional(v.number()),
    isRecurring: v.optional(v.boolean()),
    recurringDay: v.optional(v.number()),
    parentSurveyId: v.optional(v.id("surveys")),
    createdAt: v.number(),
  })
    .index("by_team", ["teamId"])
    .index("by_team_status", ["teamId", "status"])
    .index("by_closes_at", ["closesAt"]),

  responseTokens: defineTable({
    surveyId: v.id("surveys"),
    teamMemberId: v.id("teamMembers"),
    token: v.string(),
    used: v.boolean(),
    reminderSentAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_survey", ["surveyId"])
    .index("by_survey_member", ["surveyId", "teamMemberId"]),

  responses: defineTable({
    surveyId: v.id("surveys"),
    answers: v.array(
      v.object({
        questionId: v.string(),
        rating: v.optional(v.number()),
        text: v.optional(v.string()),
      })
    ),
    submittedAt: v.number(),
  }).index("by_survey", ["surveyId"]),

  savedQuestions: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("rating"), v.literal("text")),
    text: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  surveyTemplates: defineTable({
    name: v.string(),
    description: v.string(),
    questions: v.array(
      v.object({
        type: v.union(v.literal("rating"), v.literal("text")),
        text: v.string(),
        order: v.number(),
      })
    ),
    isBuiltIn: v.boolean(),
    createdBy: v.optional(v.id("users")),
  }),
});
