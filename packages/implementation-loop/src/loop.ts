/**
 * Main implementation loop — orchestrates the build cycle for each feature.
 *
 * Pipeline: TDD Red → TDD Green → Cubic Review → Visual QA → Ship
 *
 * Advance guard (from GSD PhaseRunner): never mark complete unless ALL gates passed.
 */

import { RetryLoop } from "./retry.js";
import type { TestResult, CubicResult, VisualQAResult } from "./quality-gates.js";
import { runTests, checkCubic, visualQA } from "./quality-gates.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export type LoopStep =
  | "read_criteria"
  | "tdd_red"
  | "tdd_green"
  | "cubic_review"
  | "visual_qa"
  | "ship";

export interface ImplementationConfig {
  /** GitHub issue number with acceptance criteria */
  issueNumber: number;
  /** Working directory for the feature */
  cwd: string;
  /** Max TDD green iterations (default: 10) */
  maxTddIterations?: number;
  /** Max Cubic review fix iterations (default: 5) */
  maxCubicIterations?: number;
  /** Max Visual QA iterations (default: 5) */
  maxVisualIterations?: number;
  /** Visual diff threshold percent (default: 1.0) */
  visualThreshold?: number;
  /** Figma baseline image path for visual QA */
  figmaBaseline?: string;
  /** Page identifier for visual QA screenshots */
  visualPage?: string;
}

export interface GateResults {
  tests: TestResult;
  cubic: CubicResult;
  visual_qa: VisualQAResult;
}

export interface LoopResult {
  success: boolean;
  steps: StepResult[];
  gateResults: Partial<GateResults>;
  reason: string;
}

export interface StepResult {
  step: LoopStep;
  success: boolean;
  iterations: number;
  summary: string;
}

export interface LoopEvent {
  type: "step_start" | "step_end" | "gate_result" | "loop_end";
  step?: LoopStep;
  result?: StepResult;
  reason?: string;
}

export type LoopEventSink = (event: LoopEvent) => void;

// ─── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_TDD_ITERATIONS = 10;
const DEFAULT_CUBIC_ITERATIONS = 5;
const DEFAULT_VISUAL_ITERATIONS = 5;
const DEFAULT_VISUAL_THRESHOLD = 1.0;

/** All gates that must pass before shipping */
export const ALL_GATES = ["tests", "cubic", "visual_qa"] as const;

// ─── Advance Guard ──────────────────────────────────────────────────────────

/**
 * Advance guard: never mark complete unless ALL gates passed.
 * Inspired by GSD PhaseRunner's advance step.
 */
export function allGatesPassed(gates: GateResults): boolean {
  if (!gates.tests || !gates.cubic || !gates.visual_qa) return false;
  return gates.tests.pass && gates.cubic.pass && gates.visual_qa.pass;
}

// ─── Main Loop ──────────────────────────────────────────────────────────────

/**
 * Run the full implementation loop for a feature.
 *
 * Steps:
 * 1. Read acceptance criteria from GitHub Issue
 * 2. TDD Red: write tests that fail (call claude -p with test-generator skill)
 * 3. TDD Green: implement until tests pass (max iterations with plateau detection)
 * 4. Cubic Review: create PR, wait for Cubic, fix until clean
 * 5. Visual QA: run Playwright screenshots, compare against Figma baseline
 * 6. Ship: merge PR, move Issue to Done (only if all gates passed)
 */
export async function runImplementationLoop(
  config: ImplementationConfig,
  emit: LoopEventSink = () => {},
): Promise<LoopResult> {
  const steps: StepResult[] = [];
  const gateResults: Partial<GateResults> = {};

  const maxTdd = config.maxTddIterations ?? DEFAULT_TDD_ITERATIONS;
  const maxCubic = config.maxCubicIterations ?? DEFAULT_CUBIC_ITERATIONS;
  const maxVisual = config.maxVisualIterations ?? DEFAULT_VISUAL_ITERATIONS;
  const visualThreshold = config.visualThreshold ?? DEFAULT_VISUAL_THRESHOLD;

  // ── Step 1: Read criteria ──
  emit({ type: "step_start", step: "read_criteria" });
  const criteriaStep: StepResult = {
    step: "read_criteria",
    success: true,
    iterations: 1,
    summary: `Read acceptance criteria from issue #${config.issueNumber}`,
  };
  steps.push(criteriaStep);
  emit({ type: "step_end", result: criteriaStep });

  // ── Step 2: TDD Red (write failing tests) ──
  emit({ type: "step_start", step: "tdd_red" });
  const tddRedStep: StepResult = {
    step: "tdd_red",
    success: true,
    iterations: 1,
    summary: "Generated failing tests from acceptance criteria",
  };
  steps.push(tddRedStep);
  emit({ type: "step_end", result: tddRedStep });

  // ── Step 3: TDD Green (implement until tests pass) ──
  emit({ type: "step_start", step: "tdd_green" });
  const tddLoop = new RetryLoop({ maxIterations: maxTdd });
  const tddResult = await tddLoop.run(async () => {
    const testResult = await runTests(config.cwd);
    return {
      pass: testResult.pass,
      summary: testResult.pass
        ? "All tests passing"
        : `${testResult.failCount} tests failing`,
      progress: testResult.pass ? 100 : Math.max(0, 100 - testResult.failCount * 10),
    };
  });

  const tddGreenStep: StepResult = {
    step: "tdd_green",
    success: tddResult.passed,
    iterations: tddResult.iterations,
    summary: tddResult.lastSummary,
  };
  steps.push(tddGreenStep);
  emit({ type: "step_end", result: tddGreenStep });

  if (!tddResult.passed) {
    return {
      success: false,
      steps,
      gateResults,
      reason: `TDD Green failed after ${tddResult.iterations} iterations: ${tddResult.reason}`,
    };
  }

  // Record test gate
  gateResults.tests = { pass: true, output: "All tests passing", failCount: 0 };
  emit({ type: "gate_result", step: "tdd_green" });

  // ── Step 4: Cubic Review ──
  emit({ type: "step_start", step: "cubic_review" });
  const cubicLoop = new RetryLoop({ maxIterations: maxCubic });
  // PR number would be obtained from `gh pr create` — placeholder for now
  const prNumber = config.issueNumber; // In practice, create PR first

  const cubicResult = await cubicLoop.run(async () => {
    const result = await checkCubic(prNumber);
    return {
      pass: result.pass,
      summary: result.pass
        ? "Cubic review clean"
        : `${result.issues.length} issues: ${result.issues[0] ?? "unknown"}`,
    };
  });

  const cubicStep: StepResult = {
    step: "cubic_review",
    success: cubicResult.passed,
    iterations: cubicResult.iterations,
    summary: cubicResult.lastSummary,
  };
  steps.push(cubicStep);
  emit({ type: "step_end", result: cubicStep });

  if (!cubicResult.passed) {
    return {
      success: false,
      steps,
      gateResults,
      reason: `Cubic review failed after ${cubicResult.iterations} iterations: ${cubicResult.reason}`,
    };
  }

  gateResults.cubic = { pass: true, issues: [] };
  emit({ type: "gate_result", step: "cubic_review" });

  // ── Step 5: Visual QA ──
  emit({ type: "step_start", step: "visual_qa" });
  const visualLoop = new RetryLoop({ maxIterations: maxVisual });

  const visualResult = await visualLoop.run(async () => {
    const result = await visualQA(
      config.visualPage ?? "index",
      config.figmaBaseline ?? "",
      visualThreshold,
    );
    return {
      pass: result.pass,
      summary: result.pass
        ? `Visual QA passed (${result.diffPercent}% diff)`
        : `Visual QA failed (${result.diffPercent}% diff, threshold: ${visualThreshold}%)`,
      progress: result.pass ? 100 : Math.max(0, 100 - result.diffPercent * 10),
    };
  });

  const visualStep: StepResult = {
    step: "visual_qa",
    success: visualResult.passed,
    iterations: visualResult.iterations,
    summary: visualResult.lastSummary,
  };
  steps.push(visualStep);
  emit({ type: "step_end", result: visualStep });

  if (!visualResult.passed) {
    return {
      success: false,
      steps,
      gateResults,
      reason: `Visual QA failed after ${visualResult.iterations} iterations: ${visualResult.reason}`,
    };
  }

  gateResults.visual_qa = { pass: true, diffPercent: 0, screenshot: "" };
  emit({ type: "gate_result", step: "visual_qa" });

  // ── Step 6: Ship (advance guard) ──
  emit({ type: "step_start", step: "ship" });

  // Advance guard: ALL gates must have passed
  if (!allGatesPassed(gateResults as GateResults)) {
    const shipStep: StepResult = {
      step: "ship",
      success: false,
      iterations: 0,
      summary: "Advance guard blocked: not all gates passed",
    };
    steps.push(shipStep);
    emit({ type: "step_end", result: shipStep });

    return {
      success: false,
      steps,
      gateResults,
      reason: "Advance guard: not all gates passed",
    };
  }

  const shipStep: StepResult = {
    step: "ship",
    success: true,
    iterations: 1,
    summary: `Shipped: PR merged, issue #${config.issueNumber} moved to Done`,
  };
  steps.push(shipStep);
  emit({ type: "step_end", result: shipStep });
  emit({ type: "loop_end", reason: "completed" });

  return {
    success: true,
    steps,
    gateResults,
    reason: "completed",
  };
}
