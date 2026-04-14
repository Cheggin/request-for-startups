import { describe, test, expect } from "bun:test";
import { parseTestOutput, parseCubicIssues, parseVisualDiff } from "../src/quality-gates.js";

describe("parseTestOutput", () => {
  test("parses passing test output", () => {
    const output = "Tests: 12 passed, 0 failed\nDuration: 3.2s";
    const result = parseTestOutput(output, 0);
    expect(result.pass).toBe(true);
    expect(result.failCount).toBe(0);
  });

  test("parses failing test output", () => {
    const output = "Tests: 10 passed, 2 failed\nDuration: 4.1s";
    const result = parseTestOutput(output, 1);
    expect(result.pass).toBe(false);
    expect(result.failCount).toBe(2);
  });

  test("non-zero exit code means failure regardless of output", () => {
    const output = "Tests: 12 passed, 0 failed";
    const result = parseTestOutput(output, 1);
    expect(result.pass).toBe(false);
  });

  test("handles output with no parseable fail count", () => {
    const output = "error: something went wrong";
    const result = parseTestOutput(output, 1);
    expect(result.pass).toBe(false);
    expect(result.output).toContain("error");
  });

  test("zero exit code with 0 failures passes", () => {
    const output = "All tests passed";
    const result = parseTestOutput(output, 0);
    expect(result.pass).toBe(true);
    expect(result.failCount).toBe(0);
  });
});

describe("parseCubicIssues", () => {
  test("empty issues array means pass", () => {
    const result = parseCubicIssues([]);
    expect(result.pass).toBe(true);
    expect(result.issues).toEqual([]);
  });

  test("non-empty issues array means fail", () => {
    const issues = ["Missing error handling in fetchUser", "Unused variable 'temp'"];
    const result = parseCubicIssues(issues);
    expect(result.pass).toBe(false);
    expect(result.issues).toEqual(issues);
  });

  test("single issue still fails", () => {
    const result = parseCubicIssues(["Type mismatch on line 42"]);
    expect(result.pass).toBe(false);
    expect(result.issues.length).toBe(1);
  });
});

describe("parseVisualDiff", () => {
  test("diff below threshold passes", () => {
    const result = parseVisualDiff(0.5, 1.0);
    expect(result.pass).toBe(true);
    expect(result.diffPercent).toBe(0.5);
  });

  test("diff above threshold fails", () => {
    const result = parseVisualDiff(2.5, 1.0);
    expect(result.pass).toBe(false);
    expect(result.diffPercent).toBe(2.5);
  });

  test("diff exactly at threshold passes", () => {
    const result = parseVisualDiff(1.0, 1.0);
    expect(result.pass).toBe(true);
    expect(result.diffPercent).toBe(1.0);
  });

  test("zero diff always passes", () => {
    const result = parseVisualDiff(0, 0.5);
    expect(result.pass).toBe(true);
    expect(result.diffPercent).toBe(0);
  });
});
