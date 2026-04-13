/**
 * Tests for pass@k and pass^k calculators.
 */

import { describe, test, expect } from "bun:test";
import { passAtK, passAt1, type TrialResult } from "../src/pass-at-k";

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makeResults(passes: number, fails: number): TrialResult[] {
  return [
    ...Array.from({ length: passes }, () => ({ pass: true })),
    ...Array.from({ length: fails }, () => ({ pass: false })),
  ];
}

// ---------------------------------------------------------------------------
// passAtK tests
// ---------------------------------------------------------------------------

describe("passAtK", () => {
  test("all pass => pass@k = 1, pass^k = 1", () => {
    const results = makeResults(5, 0);
    const r = passAtK(results, 3);
    expect(r.pass_at_k).toBe(1);
    expect(r.pass_pow_k).toBe(1);
    expect(r.k).toBe(3);
    expect(r.successes).toBe(5);
    expect(r.failures).toBe(0);
  });

  test("all fail => pass@k = 0, pass^k = 0", () => {
    const results = makeResults(0, 5);
    const r = passAtK(results, 3);
    expect(r.pass_at_k).toBe(0);
    expect(r.pass_pow_k).toBe(0);
    expect(r.successes).toBe(0);
    expect(r.failures).toBe(5);
  });

  test("1 out of 5 pass, k=1 => pass@1 = 0.2", () => {
    const results = makeResults(1, 4);
    const r = passAtK(results, 1);
    // pass@1 with unbiased estimator: 1 - C(4,1)/C(5,1) = 1 - 4/5 = 0.2
    expect(r.pass_at_k).toBeCloseTo(0.2, 5);
    // pass^1 = (1/5)^1 = 0.2
    expect(r.pass_pow_k).toBeCloseTo(0.2, 5);
  });

  test("2 out of 5 pass, k=2 => correct unbiased estimate", () => {
    const results = makeResults(2, 3);
    const r = passAtK(results, 2);
    // pass@2 = 1 - C(3,2)/C(5,2) = 1 - 3/10 = 0.7
    expect(r.pass_at_k).toBeCloseTo(0.7, 5);
    // pass^2 = (2/5)^2 = 0.16
    expect(r.pass_pow_k).toBeCloseTo(0.16, 5);
  });

  test("3 out of 10 pass, k=3", () => {
    const results = makeResults(3, 7);
    const r = passAtK(results, 3);
    // pass@3 = 1 - C(7,3)/C(10,3) = 1 - 35/120 = 1 - 0.29167 = 0.70833
    expect(r.pass_at_k).toBeCloseTo(0.7083, 3);
    // pass^3 = (3/10)^3 = 0.027
    expect(r.pass_pow_k).toBeCloseTo(0.027, 3);
  });

  test("k defaults to n when not specified", () => {
    const results = makeResults(3, 2);
    const r = passAtK(results);
    expect(r.k).toBe(5);
    // k >= n and c > 0 => pass@k = 1
    expect(r.pass_at_k).toBe(1);
    // pass^5 = (3/5)^5 = 0.07776
    expect(r.pass_pow_k).toBeCloseTo(0.07776, 4);
  });

  test("k > n with successes => pass@k = 1", () => {
    const results = makeResults(2, 3);
    const r = passAtK(results, 10);
    expect(r.pass_at_k).toBe(1);
  });

  test("k > n with no successes => pass@k = 0", () => {
    const results = makeResults(0, 3);
    const r = passAtK(results, 10);
    expect(r.pass_at_k).toBe(0);
  });

  test("single trial pass", () => {
    const r = passAtK([{ pass: true }], 1);
    expect(r.pass_at_k).toBe(1);
    expect(r.pass_pow_k).toBe(1);
    expect(r.successes).toBe(1);
    expect(r.failures).toBe(0);
  });

  test("single trial fail", () => {
    const r = passAtK([{ pass: false }], 1);
    expect(r.pass_at_k).toBe(0);
    expect(r.pass_pow_k).toBe(0);
    expect(r.successes).toBe(0);
    expect(r.failures).toBe(1);
  });

  test("throws on empty results", () => {
    expect(() => passAtK([])).toThrow("at least one trial");
  });

  test("throws on k <= 0", () => {
    expect(() => passAtK([{ pass: true }], 0)).toThrow("positive integer");
    expect(() => passAtK([{ pass: true }], -1)).toThrow("positive integer");
  });

  test("pass^k decreases as k increases", () => {
    const results = makeResults(7, 3); // 70% success rate
    const k1 = passAtK(results, 1);
    const k3 = passAtK(results, 3);
    const k5 = passAtK(results, 5);

    expect(k1.pass_pow_k).toBeGreaterThan(k3.pass_pow_k);
    expect(k3.pass_pow_k).toBeGreaterThan(k5.pass_pow_k);
  });

  test("pass@k increases as k increases", () => {
    const results = makeResults(3, 7); // 30% success rate
    const k1 = passAtK(results, 1);
    const k2 = passAtK(results, 2);
    const k3 = passAtK(results, 3);

    expect(k1.pass_at_k).toBeLessThanOrEqual(k2.pass_at_k);
    expect(k2.pass_at_k).toBeLessThanOrEqual(k3.pass_at_k);
  });

  test("values are clamped to [0, 1]", () => {
    const results = makeResults(5, 5);
    const r = passAtK(results, 3);
    expect(r.pass_at_k).toBeGreaterThanOrEqual(0);
    expect(r.pass_at_k).toBeLessThanOrEqual(1);
    expect(r.pass_pow_k).toBeGreaterThanOrEqual(0);
    expect(r.pass_pow_k).toBeLessThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// passAt1 convenience
// ---------------------------------------------------------------------------

describe("passAt1", () => {
  test("equivalent to passAtK(results, 1)", () => {
    const results = makeResults(3, 7);
    const r1 = passAt1(results);
    const r2 = passAtK(results, 1);

    expect(r1.pass_at_k).toBeCloseTo(r2.pass_at_k, 10);
    expect(r1.pass_pow_k).toBeCloseTo(r2.pass_pow_k, 10);
    expect(r1.k).toBe(1);
  });

  test("pass@1 = success rate for k=1", () => {
    const results = makeResults(4, 6);
    const r = passAt1(results);
    // pass@1 = 1 - C(6,1)/C(10,1) = 1 - 6/10 = 0.4
    expect(r.pass_at_k).toBeCloseTo(0.4, 5);
  });
});
