/** Project board column names */
export const COLUMNS = {
  BACKLOG: "Backlog",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
} as const;

export type Column = (typeof COLUMNS)[keyof typeof COLUMNS];

/** Agent-assignment labels */
export const AGENT_LABELS = [
  "website",
  "backend",
  "ops",
  "research",
  "spec",
] as const;

export type AgentLabel = (typeof AGENT_LABELS)[number];

/** Category labels */
export const CATEGORY_LABELS = [
  "feature",
  "bug",
  "chore",
  "spike",
] as const;

export type CategoryLabel = (typeof CATEGORY_LABELS)[number];

/** Stale threshold in hours (default 24h) */
export const STALE_THRESHOLD_HOURS = 24;
