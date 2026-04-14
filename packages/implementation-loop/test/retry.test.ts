import { describe, test, expect } from "bun:test";
import { RetryLoop } from "../src/retry.js";

describe("RetryLoop", () => {
  test("succeeds on first attempt", async () => {
    const loop = new RetryLoop({ maxIterations: 5 });
    let attempts = 0;

    const result = await loop.run(async () => {
      attempts++;
      return { pass: true, summary: "all good" };
    });

    expect(result.passed).toBe(true);
    expect(result.iterations).toBe(1);
    expect(attempts).toBe(1);
  });

  test("retries until pass", async () => {
    const loop = new RetryLoop({ maxIterations: 5 });
    let attempts = 0;

    const result = await loop.run(async () => {
      attempts++;
      if (attempts < 3) return { pass: false, summary: `fail #${attempts}` };
      return { pass: true, summary: "finally passed" };
    });

    expect(result.passed).toBe(true);
    expect(result.iterations).toBe(3);
    expect(attempts).toBe(3);
  });

  test("stops at maxIterations", async () => {
    const loop = new RetryLoop({ maxIterations: 3 });
    let attempts = 0;

    const result = await loop.run(async () => {
      attempts++;
      return { pass: false, summary: `fail #${attempts}` };
    });

    expect(result.passed).toBe(false);
    expect(result.iterations).toBe(3);
    expect(result.reason).toBe("max_iterations");
  });

  test("detects plateau and stops early", async () => {
    const loop = new RetryLoop({
      maxIterations: 20,
      plateauThreshold: 3,
      plateauWindow: 3,
    });
    let call = 0;

    const result = await loop.run(async () => {
      call++;
      // Progress flatlines: same summary every time
      return { pass: false, summary: "same error", progress: 50 };
    });

    expect(result.passed).toBe(false);
    expect(result.reason).toBe("plateau");
    // Should stop well before 20 iterations
    expect(result.iterations).toBeLessThan(20);
  });

  test("emits iteration events", async () => {
    const events: Array<{ iteration: number; passed: boolean }> = [];
    const loop = new RetryLoop({ maxIterations: 3 });

    await loop.run(
      async () => ({ pass: false, summary: "nope" }),
      (event) => events.push(event),
    );

    expect(events.length).toBe(3);
    expect(events[0].iteration).toBe(1);
    expect(events[2].iteration).toBe(3);
  });

  test("passes iteration index to the callback", async () => {
    const loop = new RetryLoop({ maxIterations: 3 });
    const indices: number[] = [];

    await loop.run(async (iteration) => {
      indices.push(iteration);
      return { pass: iteration === 3, summary: `attempt ${iteration}` };
    });

    expect(indices).toEqual([1, 2, 3]);
  });
});
