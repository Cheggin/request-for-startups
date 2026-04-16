import { describe, test, expect } from "bun:test";
import { formatNumber, formatRelativeTime } from "./format";

describe("formatNumber", () => {
  test("formats thousands with commas", () => {
    expect(formatNumber(1000)).toBe("1,000");
    expect(formatNumber(1234567)).toBe("1,234,567");
  });

  test("formats zero", () => {
    expect(formatNumber(0)).toBe("0");
  });

  test("formats small numbers without commas", () => {
    expect(formatNumber(42)).toBe("42");
  });
});

describe("formatRelativeTime", () => {
  test("returns 'just now' for recent timestamps", () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe("just now");
  });

  test("returns minutes ago for timestamps within an hour", () => {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    expect(formatRelativeTime(tenMinAgo)).toBe("10m ago");
  });

  test("returns hours ago for timestamps within a day", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    expect(formatRelativeTime(threeHoursAgo)).toBe("3h ago");
  });

  test("returns days ago for timestamps within a month", () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 86400 * 1000).toISOString();
    expect(formatRelativeTime(fiveDaysAgo)).toBe("5d ago");
  });
});
