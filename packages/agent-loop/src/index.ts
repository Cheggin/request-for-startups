/**
 * @harness/agent-loop — TypeScript agent loop runtime.
 */

export { parseAgentFile, loadAgent, listAgents } from "./agent-loader.js";
export { loadSkills, concatSkills } from "./skill-loader.js";
export {
  createGateGuard,
  configProtection,
  createLoggingHook,
  createDefaultHooks,
  runBeforeHooks,
  runAfterHooks,
} from "./hook-runner.js";
export {
  PlateauDetector,
  PLATEAU_THRESHOLD,
  PLATEAU_WINDOW,
  STUCK_THRESHOLD,
  STUCK_WINDOW,
  REPETITION_COUNT,
} from "./plateau-detector.js";
export {
  classifyError,
  shouldRetry,
  FATAL_PATTERNS,
  TRANSIENT_PATTERNS,
} from "./error-classifier.js";
export { runLoop, buildSystemPrompt, spawnClaude } from "./loop.js";
export type {
  AgentDefinition,
  LoadedSkill,
  ModeName,
  ModeResult,
  ToolCallContext,
  BeforeToolCallResult,
  AfterToolCallResult,
  HookSet,
  PlateauSignal,
  ProgressEntry,
  ErrorSeverity,
  ClassifiedError,
  LoopConfig,
  LoopEvent,
} from "./types.js";
