import { describe, it, expect, vi } from "vitest";
import { validateAll, formatSummary } from "../src/validate-all.js";
import type { ExecRunner, ValidationResult } from "../src/validators.js";

describe("validate-all", () => {
  describe("validateAll", () => {
    it("should run all validators and aggregate results", () => {
      const mockExec: ExecRunner = vi.fn().mockReturnValue("ok");
      const result = validateAll(mockExec);
      expect(result.results).toHaveLength(7);
      expect(result.passed + result.failed + result.warned).toBe(7);
    });

    it("should report allCriticalPassed when critical services pass", () => {
      const mockExec: ExecRunner = vi.fn().mockReturnValue("ok");
      const result = validateAll(mockExec);
      expect(result.allCriticalPassed).toBe(true);
    });

    it("should report allCriticalPassed=false when a critical service fails", () => {
      const failingValidator = (_exec: ExecRunner): ValidationResult => ({
        service: "github",
        status: "fail",
        message: "GitHub down",
        critical: true,
      });
      const passingValidator = (_exec: ExecRunner): ValidationResult => ({
        service: "vercel",
        status: "pass",
        message: "ok",
        critical: true,
      });

      const mockExec: ExecRunner = vi.fn();
      const result = validateAll(mockExec, [
        failingValidator,
        passingValidator,
      ]);
      expect(result.allCriticalPassed).toBe(false);
      expect(result.failed).toBe(1);
      expect(result.passed).toBe(1);
    });

    it("should allow non-critical warnings without blocking", () => {
      const warningValidator = (_exec: ExecRunner): ValidationResult => ({
        service: "slack",
        status: "warn",
        message: "Slack not connected",
        critical: false,
      });
      const passingValidator = (_exec: ExecRunner): ValidationResult => ({
        service: "github",
        status: "pass",
        message: "ok",
        critical: true,
      });

      const mockExec: ExecRunner = vi.fn();
      const result = validateAll(mockExec, [
        warningValidator,
        passingValidator,
      ]);
      expect(result.allCriticalPassed).toBe(true);
      expect(result.warned).toBe(1);
    });

    it("should accept custom validators", () => {
      const custom = (_exec: ExecRunner): ValidationResult => ({
        service: "custom",
        status: "pass",
        message: "Custom check passed",
        critical: false,
      });
      const mockExec: ExecRunner = vi.fn();
      const result = validateAll(mockExec, [custom]);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].service).toBe("custom");
    });
  });

  describe("formatSummary", () => {
    it("should format a passing summary", () => {
      const summary = {
        passed: 2,
        failed: 0,
        warned: 0,
        allCriticalPassed: true,
        results: [
          {
            service: "github",
            status: "pass" as const,
            message: "GitHub authenticated",
            critical: true,
          },
          {
            service: "vercel",
            status: "pass" as const,
            message: "Vercel ok",
            critical: true,
          },
        ],
      };
      const output = formatSummary(summary);
      expect(output).toContain("[PASS] github [critical]");
      expect(output).toContain("[PASS] vercel [critical]");
      expect(output).toContain("2 passed, 0 failed, 0 warnings");
      expect(output).not.toContain("BLOCKED");
    });

    it("should show BLOCKED when critical services fail", () => {
      const summary = {
        passed: 0,
        failed: 1,
        warned: 0,
        allCriticalPassed: false,
        results: [
          {
            service: "github",
            status: "fail" as const,
            message: "GitHub auth failed",
            critical: true,
            diagnostic: "Run gh auth login",
          },
        ],
      };
      const output = formatSummary(summary);
      expect(output).toContain("[FAIL] github [critical]");
      expect(output).toContain("BLOCKED");
      expect(output).toContain("Fix: Run gh auth login");
    });

    it("should show warnings with [optional] tag", () => {
      const summary = {
        passed: 1,
        failed: 0,
        warned: 1,
        allCriticalPassed: true,
        results: [
          {
            service: "github",
            status: "pass" as const,
            message: "ok",
            critical: true,
          },
          {
            service: "slack",
            status: "warn" as const,
            message: "not connected",
            critical: false,
          },
        ],
      };
      const output = formatSummary(summary);
      expect(output).toContain("[WARN] slack [optional]");
      expect(output).not.toContain("BLOCKED");
    });
  });
});
