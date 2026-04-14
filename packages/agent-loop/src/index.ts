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
export { runLoop, buildSystemPrompt, spawnClaude, preTaskLearning, postTaskLearning } from "./loop.js";
export {
  extractLearnings,
  proposeSkillUpdate,
  shouldUpdateSkill,
  checkIsSimplification,
  SKILL_UPDATE_CONFIDENCE_THRESHOLD,
  LEARNING_SIGNAL_PATTERNS,
} from "./self-improve.js";
export type {
  ExtractedLearning,
  SkillUpdateProposal,
  TranscriptAnalysis,
} from "./self-improve.js";
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
  LearningContext,
  PostTaskResult,
} from "./types.js";
