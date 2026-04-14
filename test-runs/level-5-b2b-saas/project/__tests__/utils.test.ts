import { describe, it, expect } from "vitest";
import {
  cn,
  formatDate,
  generateId,
  calculateAverage,
  calculateResponseRate,
  getRatingDistribution,
  getRatingColor,
  getStatusColor,
} from "@/lib/utils";

describe("cn (class name joiner)", () => {
  it("joins multiple class strings", () => {
    expect(cn("foo", "bar", "baz")).toBe("foo bar baz");
  });

  it("filters out falsy values", () => {
    expect(cn("foo", false, undefined, null, "bar")).toBe("foo bar");
  });

  it("returns empty string for no truthy classes", () => {
    expect(cn(false, undefined, null)).toBe("");
  });
});

describe("formatDate", () => {
  it("formats a timestamp as readable date", () => {
    const timestamp = new Date("2026-03-15T12:00:00Z").getTime();
    const result = formatDate(timestamp);
    expect(result).toContain("Mar");
    expect(result).toContain("15");
    expect(result).toContain("2026");
  });
});

describe("generateId", () => {
  it("returns a string of length 10", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id.length).toBe(10);
  });

  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe("calculateAverage", () => {
  it("returns the average of an array of numbers", () => {
    expect(calculateAverage([1, 2, 3, 4, 5])).toBe(3);
  });

  it("returns 0 for an empty array", () => {
    expect(calculateAverage([])).toBe(0);
  });

  it("handles single value", () => {
    expect(calculateAverage([4.5])).toBe(4.5);
  });

  it("handles decimal results", () => {
    expect(calculateAverage([4, 5])).toBe(4.5);
  });
});

describe("calculateResponseRate", () => {
  it("returns percentage as integer", () => {
    expect(calculateResponseRate(5, 7)).toBe(71);
  });

  it("returns 100 for full response", () => {
    expect(calculateResponseRate(7, 7)).toBe(100);
  });

  it("returns 0 when no one responded", () => {
    expect(calculateResponseRate(0, 7)).toBe(0);
  });

  it("returns 0 when total is 0", () => {
    expect(calculateResponseRate(0, 0)).toBe(0);
  });
});

describe("getRatingDistribution", () => {
  it("counts ratings into 5 buckets", () => {
    const ratings = [1, 2, 3, 4, 5, 4, 4, 3, 5];
    const dist = getRatingDistribution(ratings);
    expect(dist).toEqual([1, 1, 2, 3, 2]);
  });

  it("returns all zeros for empty array", () => {
    expect(getRatingDistribution([])).toEqual([0, 0, 0, 0, 0]);
  });

  it("ignores out-of-range values", () => {
    const ratings = [0, 6, -1, 3, 3];
    expect(getRatingDistribution(ratings)).toEqual([0, 0, 2, 0, 0]);
  });
});

describe("getRatingColor", () => {
  it("returns green for high ratings", () => {
    expect(getRatingColor(4)).toBe("#22c55e");
    expect(getRatingColor(5)).toBe("#22c55e");
  });

  it("returns yellow for medium ratings", () => {
    expect(getRatingColor(3)).toBe("#eab308");
    expect(getRatingColor(3.5)).toBe("#eab308");
  });

  it("returns red for low ratings", () => {
    expect(getRatingColor(1)).toBe("#ef4444");
    expect(getRatingColor(2)).toBe("#ef4444");
  });
});

describe("getStatusColor", () => {
  it("returns correct classes for each status", () => {
    expect(getStatusColor("active")).toContain("emerald");
    expect(getStatusColor("draft")).toContain("zinc");
    expect(getStatusColor("closed")).toContain("slate");
    expect(getStatusColor("pending")).toContain("amber");
  });

  it("returns default for unknown status", () => {
    expect(getStatusColor("unknown")).toContain("zinc");
  });
});
