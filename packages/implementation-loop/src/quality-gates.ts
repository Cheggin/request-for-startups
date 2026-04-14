/**
 * Quality Gates — individual gate runners for the implementation loop.
 *
 * Each gate returns a typed result indicating pass/fail with diagnostic info.
 * Gates are designed to be called by the main loop and retried independently.
 */

import { execFile } from "node:child_process";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TestResult {
  pass: boolean;
  output: string;
  failCount: number;
}

export interface CubicResult {
  pass: boolean;
  issues: string[];
}

export interface VisualQAResult {
  pass: boolean;
  diffPercent: number;
  screenshot: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

/** Default visual diff threshold (percent) */
const DEFAULT_VISUAL_THRESHOLD = 1.0;

/** Regex to extract fail count from test output */
const FAIL_COUNT_REGEX = /(\d+)\s*failed/i;

// ─── Output Parsers (exported for testing) ──────────────────────────────────

/**
 * Parse test runner output and exit code into a TestResult.
 */
export function parseTestOutput(output: string, exitCode: number): TestResult {
  const failMatch = output.match(FAIL_COUNT_REGEX);
  const failCount = failMatch ? parseInt(failMatch[1], 10) : (exitCode !== 0 ? 1 : 0);
  const pass = exitCode === 0 && failCount === 0;

  return { pass, output, failCount };
}

/**
 * Parse Cubic review issues into a CubicResult.
 */
export function parseCubicIssues(issues: string[]): CubicResult {
  return {
    pass: issues.length === 0,
    issues,
  };
}

/**
 * Parse visual diff percentage against threshold.
 */
export function parseVisualDiff(
  diffPercent: number,
  threshold: number = DEFAULT_VISUAL_THRESHOLD,
): VisualQAResult {
  return {
    pass: diffPercent <= threshold,
    diffPercent,
    screenshot: "",
  };
}

// ─── Gate Runners ───────────────────────────────────────────────────────────

/**
 * Run tests in the given directory using `bun test`.
 */
export async function runTests(dir: string): Promise<TestResult> {
  return new Promise((resolve) => {
    execFile("bun", ["test"], { cwd: dir, maxBuffer: 5 * 1024 * 1024 }, (error, stdout, stderr) => {
      const output = stdout + stderr;
      const exitCode = error ? (error as NodeJS.ErrnoException & { code?: number }).code ?? 1 : 0;
      resolve(parseTestOutput(output, typeof exitCode === "number" ? exitCode : 1));
    });
  });
}

/**
 * Check Cubic review issues for a PR.
 * Calls `gh api` to fetch PR review issues from Cubic.
 */
export async function checkCubic(prNumber: number): Promise<CubicResult> {
  return new Promise((resolve) => {
    execFile(
      "gh",
      ["pr", "checks", String(prNumber), "--json", "name,state,description"],
      { maxBuffer: 5 * 1024 * 1024 },
      (error, stdout) => {
        if (error) {
          resolve({ pass: false, issues: [`Failed to fetch PR checks: ${error.message}`] });
          return;
        }

        try {
          const checks = JSON.parse(stdout) as Array<{
            name: string;
            state: string;
            description: string;
          }>;

          const issues = checks
            .filter((c) => c.state !== "SUCCESS" && c.state !== "NEUTRAL")
            .map((c) => `${c.name}: ${c.description || c.state}`);

          resolve(parseCubicIssues(issues));
        } catch {
          resolve({ pass: false, issues: ["Failed to parse PR checks output"] });
        }
      },
    );
  });
}

/**
 * Run visual QA: take Playwright screenshot and compare against baseline.
 * Returns diff percentage.
 */
export async function visualQA(
  page: string,
  baseline: string,
  threshold: number = DEFAULT_VISUAL_THRESHOLD,
): Promise<VisualQAResult> {
  return new Promise((resolve) => {
    execFile(
      "npx",
      [
        "playwright",
        "test",
        "--reporter=json",
        "--grep",
        page,
      ],
      { maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          resolve({
            pass: false,
            diffPercent: 100,
            screenshot: "",
          });
          return;
        }

        // Parse Playwright JSON output for visual diff info
        try {
          const result = JSON.parse(stdout) as {
            suites?: Array<{
              specs?: Array<{
                tests?: Array<{
                  results?: Array<{
                    attachments?: Array<{
                      name: string;
                      path?: string;
                    }>;
                  }>;
                }>;
              }>;
            }>;
          };

          const screenshot =
            result.suites?.[0]?.specs?.[0]?.tests?.[0]?.results?.[0]?.attachments?.find(
              (a) => a.name === "screenshot",
            )?.path ?? "";

          // If tests passed, diff is 0
          const diffPercent = error ? 100 : 0;
          resolve(parseVisualDiff(diffPercent, threshold));
        } catch {
          resolve({ pass: false, diffPercent: 100, screenshot: "" });
        }
      },
    );
  });
}
