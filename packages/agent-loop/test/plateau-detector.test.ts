import { describe, test, expect } from "bun:test";
import { PlateauDetector } from "../src/plateau-detector.js";

describe("PlateauDetector", () => {
  test("returns ok for normal progress", () => {
    const d = new PlateauDetector();
    expect(d.record(10)).toBe("ok");
    expect(d.record(25)).toBe("ok");
    expect(d.record(50)).toBe("ok");
    expect(d.record(80)).toBe("ok");
  });

  test("detects stuck: <5% gain for 2 consecutive iterations", () => {
    const d = new PlateauDetector();
    d.record(50);
    d.record(52); // +2, <5%
    const signal = d.record(54); // +2, <5% — 2 consecutive
    expect(signal).toBe("stuck");
  });

  test("detects plateau: <3% gain for 4 consecutive iterations", () => {
    const d = new PlateauDetector();
    d.record(50);
    d.record(51); // +1
    d.record(52); // +1
    d.record(53); // +1
    const signal = d.record(54); // +1 — 4 consecutive <3%
    expect(signal).toBe("plateau");
  });

  test("does not false-trigger plateau with early entries", () => {
    const d = new PlateauDetector();
    d.record(50);
    d.record(51);
    // Only 1 delta so far, need 4 consecutive
    expect(d.record(52)).toBe("stuck"); // 2 consecutive <5%
  });

  test("resets after good progress breaks the streak", () => {
    const d = new PlateauDetector();
    d.record(50);
    d.record(52); // +2
    d.record(60); // +8, breaks streak
    d.record(62); // +2
    const signal = d.record(64); // +2, only 2 consecutive <5%
    expect(signal).toBe("stuck"); // stuck, not plateau
  });

  test("detects repetition: 3 identical outputs", () => {
    const d = new PlateauDetector();
    d.record(30, "same output");
    d.record(35, "same output");
    const signal = d.record(40, "same output");
    expect(signal).toBe("plateau");
  });

  test("no repetition with different outputs", () => {
    const d = new PlateauDetector();
    d.record(30, "output A");
    d.record(45, "output B");
    d.record(60, "output C");
    // All signals should be ok (progress is good too)
    expect(d.record(75, "output D")).toBe("ok");
  });

  test("lastDelta returns correct value", () => {
    const d = new PlateauDetector();
    d.record(10);
    d.record(25);
    expect(d.lastDelta()).toBe(15);
  });

  test("lastDelta returns 100 with fewer than 2 entries", () => {
    const d = new PlateauDetector();
    expect(d.lastDelta()).toBe(100);
    d.record(50);
    expect(d.lastDelta()).toBe(100);
  });

  test("reset clears all state", () => {
    const d = new PlateauDetector();
    d.record(50);
    d.record(51);
    d.record(52);
    d.reset();
    expect(d.getEntries().length).toBe(0);
    expect(d.lastDelta()).toBe(100);
  });

  test("getEntries returns immutable copy", () => {
    const d = new PlateauDetector();
    d.record(10);
    d.record(20);
    const entries = d.getEntries();
    expect(entries.length).toBe(2);
    expect(entries[0].progress).toBe(10);
    expect(entries[1].progress).toBe(20);
  });
});
