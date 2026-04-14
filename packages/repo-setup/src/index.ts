export {
  scaffold,
  createGitHubRepo,
  copyWebsiteTemplate,
  generateTaskfile,
  setupFeaturesDir,
  setupHarnessConfigs,
  setupGitignore,
  setupCIWorkflow,
} from "./scaffold.js";
export type { ScaffoldOptions, ExecRunner } from "./scaffold.js";

export {
  configureServices,
  linkVercel,
  linkRailway,
  initConvex,
  configureGitHubWebhook,
} from "./configure-services.js";
export type { ServiceConfig, ConfigureResult } from "./configure-services.js";

export { setupHooks, buildClaudeSettings } from "./setup-hooks.js";
export type { HookConfig, ClaudeSettings } from "./setup-hooks.js";
