/**
 * Common Convex schema patterns for reuse across different startup types.
 * Each template returns a table definition string ready to insert into schema.ts.
 */

export interface TableTemplate {
  name: string;
  description: string;
  /** The defineTable(...) call as a string */
  definition: string;
}

export const USERS_TABLE: TableTemplate = {
  name: "users",
  description: "Core users table with auth provider references",
  definition: `users: defineTable({
    name: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
    externalId: v.string(),
    provider: v.string(),
    role: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_externalId", ["externalId"])`,
};

export const SESSIONS_TABLE: TableTemplate = {
  name: "sessions",
  description: "User sessions for auth tracking",
  definition: `sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_userId", ["userId"])`,
};

export const SUBSCRIPTIONS_TABLE: TableTemplate = {
  name: "subscriptions",
  description: "Stripe subscription tracking",
  definition: `subscriptions: defineTable({
    userId: v.id("users"),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    plan: v.string(),
    status: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_stripeCustomerId", ["stripeCustomerId"])
    .index("by_stripeSubscriptionId", ["stripeSubscriptionId"])`,
};

export const CONTENT_ITEMS_TABLE: TableTemplate = {
  name: "contentItems",
  description: "Generic content items (posts, articles, etc.)",
  definition: `contentItems: defineTable({
    authorId: v.id("users"),
    title: v.string(),
    slug: v.string(),
    body: v.string(),
    status: v.string(),
    tags: v.optional(v.array(v.string())),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_authorId", ["authorId"])
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])`,
};

export const NOTIFICATIONS_TABLE: TableTemplate = {
  name: "notifications",
  description: "User notification records",
  definition: `notifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    read: v.boolean(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_read", ["userId", "read"])`,
};

export const FILE_UPLOADS_TABLE: TableTemplate = {
  name: "fileUploads",
  description: "File upload metadata tracking",
  definition: `fileUploads: defineTable({
    userId: v.id("users"),
    storageId: v.string(),
    fileName: v.string(),
    mimeType: v.string(),
    sizeBytes: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])`,
};

export const ALL_TEMPLATES: TableTemplate[] = [
  USERS_TABLE,
  SESSIONS_TABLE,
  SUBSCRIPTIONS_TABLE,
  CONTENT_ITEMS_TABLE,
  NOTIFICATIONS_TABLE,
  FILE_UPLOADS_TABLE,
];

/**
 * Get a template by table name.
 */
export function getTableTemplate(name: string): TableTemplate | undefined {
  return ALL_TEMPLATES.find((t) => t.name === name);
}

/**
 * Get multiple templates by name.
 */
export function getTableTemplates(names: string[]): TableTemplate[] {
  return names
    .map((n) => getTableTemplate(n))
    .filter((t): t is TableTemplate => t !== undefined);
}
