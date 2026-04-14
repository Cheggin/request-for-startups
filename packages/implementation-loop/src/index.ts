/**
 * @rfs/implementation-loop — Core build cycle for each feature.
 *
 * Orchestrates: TDD → Cubic Review → Visual QA → Ship
 * with advance guard ensuring all gates pass before shipping.
 */

export {
  runImplementationLoop,
  allGatesPassed,
  ALL_GATES,
} from "./loop.js";
export type {
  ImplementationConfig,
  GateResults,
  LoopResult,
  StepResult,
  LoopStep,
  LoopEvent,
  LoopEventSink,
} from "./loop.js";

export {
  runTests,
  checkCubic,
  visualQA,
  parseTestOutput,
  parseCubicIssues,
  parseVisualDiff,
} from "./quality-gates.js";
export type {
  TestResult,
  CubicResult,
  VisualQAResult,
} from "./quality-gates.js";

export { RetryLoop } from "./retry.js";
export type {
  RetryConfig,
  AttemptResult,
  RetryResult,
  IterationEvent,
} from "./retry.js";
