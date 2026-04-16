import { describe, test, expect } from "bun:test";
import { formatNumber, formatRelativeTime } from "../src/lib/format";

describe("formatNumber", () => {
  test("formats integers with commas", () => {
    expect(formatNumber(1000)).toBe("1,000");
    expect(formatNumber(1234567)).toBe("1,234,567");
  });

  test("formats zero", () => {
    expect(formatNumber(0)).toBe("0");
  });

  test("formats negative numbers", () => {
    expect(formatNumber(-5000)).toBe("-5,000");
  });

  test("formats decimals", () => {
    expect(formatNumber(1234.56)).toBe("1,234.56");
  });
});

describe("formatRelativeTime", () => {
  test("returns 'just now' for timestamps less than a minute ago", () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe("just now");
  });

  test("returns minutes ago for recent timestamps", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(fiveMinAgo)).toBe("5m ago");
  });

  test("returns hours ago", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    expect(formatRelativeTime(threeHoursAgo)).toBe("3h ago");
  });

  test("returns days ago", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400 * 1000).toISOString();
    expect(formatRelativeTime(twoDaysAgo)).toBe("2d ago");
  });

  test("returns months ago for old timestamps", () => {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86400 * 1000).toISOString();
    expect(formatRelativeTime(ninetyDaysAgo)).toBe("3mo ago");
  });
});
