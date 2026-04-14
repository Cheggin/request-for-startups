// Store — file operations and directory structure
export {
  initKnowledgeBase,
  initAllKnowledgeBases,
  getBasePath,
  getRawPath,
  getWikiPath,
  getIndexPath,
  getLogPath,
  isValidCategory,
} from "./store.js";

// Ingest — source ingestion into raw/
export {
  ingestSource,
  ingestFromUrl,
  slugify,
  type Source,
  type IngestResult,
} from "./ingest.js";

// Wiki — page management
export {
  createPage,
  updatePage,
  readPage,
  listPages,
  searchPages,
  linkPages,
  parseFrontmatter,
  type WikiPage,
  type WikiPageMeta,
} from "./wiki.js";

// Index Manager — index.md maintenance
export {
  rebuildIndex,
  addToIndex,
  removeFromIndex,
  type IndexEntry,
} from "./index-manager.js";

// Log — append-only operation log
export {
  logOperation,
  readLog,
  recentLog,
  type LogEntry,
  type ParsedLogEntry,
} from "./log.js";

// Lint — wiki health checker
export { lintWiki, type LintIssue, type LintResult } from "./lint.js";

// Query — context preparation for LLM synthesis
export { queryKnowledge, type QueryContext } from "./query.js";

// Constants
export {
  CATEGORIES,
  HARNESS_DIR,
  STALE_THRESHOLD_DAYS,
  type Category,
  type SourceType,
  type OperationType,
} from "./constants.js";
