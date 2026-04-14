import { describe, test, expect } from "bun:test";
import type {
  ImplementationConfig,
  GateResults,
  LoopResult,
  LoopStep,
} from "../src/loop.js";
import { ALL_GATES, allGatesPassed } from "../src/loop.js";

describe("ALL_GATES", () => {
  test("contains the 3 required gates", () => {
    expect(ALL_GATES).toContain("tests");
    expect(ALL_GATES).toContain("cubic");
    expect(ALL_GATES).toContain("visual_qa");
    expect(ALL_GATES.length).toBe(3);
  });
});

describe("allGatesPassed", () => {
  test("returns true when all gates pass", () => {
    const gates: GateResults = {
      tests: { pass: true, output: "ok", failCount: 0 },
      cubic: { pass: true, issues: [] },
      visual_qa: { pass: true, diffPercent: 0, screenshot: "shot.png" },
    };
    expect(allGatesPassed(gates)).toBe(true);
  });

  test("returns false when tests fail", () => {
    const gates: GateResults = {
      tests: { pass: false, output: "2 failed", failCount: 2 },
      cubic: { pass: true, issues: [] },
      visual_qa: { pass: true, diffPercent: 0, screenshot: "shot.png" },
    };
    expect(allGatesPassed(gates)).toBe(false);
  });

  test("returns false when cubic has issues", () => {
    const gates: GateResults = {
      tests: { pass: true, output: "ok", failCount: 0 },
      cubic: { pass: false, issues: ["missing error handling"] },
      visual_qa: { pass: true, diffPercent: 0, screenshot: "shot.png" },
    };
    expect(allGatesPassed(gates)).toBe(false);
  });

  test("returns false when visual QA fails", () => {
    const gates: GateResults = {
      tests: { pass: true, output: "ok", failCount: 0 },
      cubic: { pass: true, issues: [] },
      visual_qa: { pass: false, diffPercent: 5.2, screenshot: "shot.png" },
    };
    expect(allGatesPassed(gates)).toBe(false);
  });

  test("returns false when any gate is missing", () => {
    const gates: Partial<GateResults> = {
      tests: { pass: true, output: "ok", failCount: 0 },
      cubic: { pass: true, issues: [] },
    };
    expect(allGatesPassed(gates as GateResults)).toBe(false);
  });
});
