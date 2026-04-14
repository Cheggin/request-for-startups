/**
 * @harness/status-dashboard — Terminal status display for the startup harness.
 */

export {
  renderStatus,
  renderDashboard,
  readFeatureProgress,
  readAgentStatuses,
  readCostSummary,
  progressBar,
} from "./dashboard.js";

// Re-export progressBar as a named internal for testing
import { renderDashboard } from "./dashboard.js";
export { renderDashboard as renderDashboardFn };

export type {
  AgentStatus,
  FeatureProgress,
  InvestorUpdate,
  CostSummary,
  DashboardState,
} from "./dashboard.js";
