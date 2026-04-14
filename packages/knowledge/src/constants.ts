export const CATEGORIES = [
  "coding",
  "growth",
  "design",
  "operations",
  "content",
  "general",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const SOURCE_TYPES = ["article", "doc", "code", "paper"] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

export const HARNESS_DIR = ".harness/knowledge";

export const STALE_THRESHOLD_DAYS = 30;

export const WIKI_LINK_PATTERN = /\[\[([^\]]+)\]\]/g;

export const FRONTMATTER_DELIMITER = "---";

export const LOG_PREFIXES = {
  ingest: "[INGEST]",
  query: "[QUERY]",
  lint: "[LINT]",
  update: "[UPDATE]",
} as const;

export type OperationType = keyof typeof LOG_PREFIXES;
