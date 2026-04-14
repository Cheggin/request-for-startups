/**
 * @rfs/fixed-boundary — Enforces which files agents can modify.
 */

export {
  checkBoundary,
  loadAgentScopes,
  FROZEN_PATHS,
} from "./boundary.js";
export type { BoundaryResult, AgentConfig } from "./boundary.js";

export { handleHookInput, runCli } from "./hook.js";
export type { HookInput, HookOutput } from "./hook.js";
