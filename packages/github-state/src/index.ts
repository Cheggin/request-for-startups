export {
  createIssue,
  updateIssue,
  closeIssue,
  getIssue,
  searchIssues,
  getAssignedAgent,
} from "./issues.js";
export type {
  CreateIssueOptions,
  UpdateIssueOptions,
  Issue,
} from "./issues.js";

export {
  listProjectItems,
  findItemByIssue,
  moveCard,
  addIssueToProject,
  transitionIssue,
  getColumns,
  getColumnOptionId,
} from "./project-board.js";
export type {
  ProjectItem,
  ProjectConfig,
} from "./project-board.js";

export {
  rebuildContext,
  formatHandoffMarkdown,
} from "./context-rebuild.js";
export type {
  HandoffDocument,
  HandoffSection,
  HandoffIssue,
} from "./context-rebuild.js";

export {
  postAuditComment,
  postPickupComment,
  postCompletionComment,
  postVerificationComment,
  getIssueComments,
  getRecentAuditComments,
} from "./audit-trail.js";
export type {
  AuditEntry,
  IssueComment,
} from "./audit-trail.js";

export { execGh, execGhJson } from "./gh.js";
export type { ExecResult } from "./gh.js";

export {
  COLUMNS,
  AGENT_LABELS,
  CATEGORY_LABELS,
  STALE_THRESHOLD_HOURS,
} from "./constants.js";
export type { Column, AgentLabel, CategoryLabel } from "./constants.js";
