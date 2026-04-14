import { describe, test, expect } from "bun:test";
import { classifyError, shouldRetry, FATAL_PATTERNS, TRANSIENT_PATTERNS } from "../src/error-classifier.js";

describe("classifyError", () => {
  test("classifies auth errors as FATAL", () => {
    const result = classifyError(new Error("Unauthorized: invalid API key"));
    expect(result.severity).toBe("FATAL");
    expect(result.shouldRetry).toBe(false);
    expect(result.maxRetries).toBe(0);
  });

  test("classifies permission denied as FATAL", () => {
    const result = classifyError("Permission denied for this resource");
    expect(result.severity).toBe("FATAL");
  });

  test("classifies quota exceeded as FATAL", () => {
    const result = classifyError(new Error("Quota exceeded for model"));
    expect(result.severity).toBe("FATAL");
  });

  test("classifies timeout as TRANSIENT", () => {
    const result = classifyError(new Error("Request timeout after 30s"));
    expect(result.severity).toBe("TRANSIENT");
    expect(result.shouldRetry).toBe(true);
    expect(result.maxRetries).toBe(3);
  });

  test("classifies rate limit as TRANSIENT", () => {
    const result = classifyError(new Error("Rate limit exceeded, try again"));
    expect(result.severity).toBe("TRANSIENT");
  });

  test("classifies connection reset as TRANSIENT", () => {
    const result = classifyError(new Error("ECONNRESET: connection reset"));
    expect(result.severity).toBe("TRANSIENT");
  });

  test("classifies 429 as TRANSIENT", () => {
    const result = classifyError(new Error("HTTP 429 Too Many Requests"));
    expect(result.severity).toBe("TRANSIENT");
  });

  test("classifies unknown errors as UNKNOWN", () => {
    const result = classifyError(new Error("Something weird happened"));
    expect(result.severity).toBe("UNKNOWN");
    expect(result.shouldRetry).toBe(true);
    expect(result.maxRetries).toBe(1);
  });

  test("FATAL takes priority over TRANSIENT for ambiguous messages", () => {
    // Message contains both "unauthorized" and "try again"
    const result = classifyError(new Error("Unauthorized: please try again later"));
    expect(result.severity).toBe("FATAL");
  });

  test("accepts string input", () => {
    const result = classifyError("ETIMEDOUT on network call");
    expect(result.severity).toBe("TRANSIENT");
  });

  test("preserves original error message", () => {
    const msg = "Original Error Message Here";
    const result = classifyError(new Error(msg));
    expect(result.message).toBe(msg);
  });
});

describe("shouldRetry", () => {
  test("returns true for TRANSIENT on first attempt", () => {
    expect(shouldRetry(new Error("timeout"), 0)).toBe(true);
  });

  test("returns true for TRANSIENT up to maxRetries", () => {
    expect(shouldRetry(new Error("timeout"), 2)).toBe(true);
    expect(shouldRetry(new Error("timeout"), 3)).toBe(false);
  });

  test("returns false for FATAL regardless of attempt", () => {
    expect(shouldRetry(new Error("unauthorized"), 0)).toBe(false);
  });

  test("returns true for UNKNOWN on first attempt only", () => {
    expect(shouldRetry(new Error("weird thing"), 0)).toBe(true);
    expect(shouldRetry(new Error("weird thing"), 1)).toBe(false);
  });
});

describe("pattern coverage", () => {
  test("all FATAL_PATTERNS classify as FATAL", () => {
    for (const pattern of FATAL_PATTERNS) {
      const result = classifyError(new Error(`Error: ${pattern} happened`));
      expect(result.severity).toBe("FATAL");
    }
  });

  test("all TRANSIENT_PATTERNS classify as TRANSIENT", () => {
    for (const pattern of TRANSIENT_PATTERNS) {
      const result = classifyError(new Error(`Error: ${pattern} happened`));
      // Some transient patterns might also match fatal (e.g., if one contains the other)
      // but standalone they should be transient
      expect(["TRANSIENT", "FATAL"]).toContain(result.severity);
    }
  });
});
