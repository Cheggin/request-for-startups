import { execSync } from "node:child_process";
import {
  ALL_VALIDATORS,
  type ExecRunner,
  type ValidationResult,
} from "./validators.js";

export interface ValidationSummary {
  passed: number;
  failed: number;
  warned: number;
  results: ValidationResult[];
  allCriticalPassed: boolean;
}

const defaultExec: ExecRunner = (command: string) => {
  return execSync(command, { encoding: "utf-8", stdio: "pipe" });
};

export function validateAll(
  exec: ExecRunner = defaultExec,
  validators = ALL_VALIDATORS
): ValidationSummary {
  const results: ValidationResult[] = [];

  for (const validator of validators) {
    results.push(validator(exec));
  }

  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const warned = results.filter((r) => r.status === "warn").length;
  const allCriticalPassed = results
    .filter((r) => r.critical)
    .every((r) => r.status === "pass");

  return { passed, failed, warned, results, allCriticalPassed };
}

export function formatSummary(summary: ValidationSummary): string {
  const lines: string[] = [];
  lines.push("Service Validation Report");
  lines.push("========================");
  lines.push("");

  for (const result of summary.results) {
    const icon =
      result.status === "pass"
        ? "PASS"
        : result.status === "fail"
          ? "FAIL"
          : "WARN";
    const tag = result.critical ? "[critical]" : "[optional]";
    lines.push(`[${icon}] ${result.service} ${tag} - ${result.message}`);
    if (result.diagnostic) {
      lines.push(`       Fix: ${result.diagnostic}`);
    }
  }

  lines.push("");
  lines.push(
    `Summary: ${summary.passed} passed, ${summary.failed} failed, ${summary.warned} warnings`
  );

  if (!summary.allCriticalPassed) {
    lines.push("");
    lines.push(
      "BLOCKED: Critical service(s) failed. Agent work cannot proceed."
    );
  }

  return lines.join("\n");
}
