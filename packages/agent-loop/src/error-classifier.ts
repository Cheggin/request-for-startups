/**
 * Error classifier — categorizes errors as FATAL, TRANSIENT, or UNKNOWN.
 *
 * From Archon executor-shared.ts:
 * - FATAL: auth/permission/quota failures that won't resolve with retry
 * - TRANSIENT: timeouts, connection resets, rate limits
 * - UNKNOWN: anything else (retry once, then escalate)
 *
 * FATAL patterns take priority over TRANSIENT to prevent ambiguous messages
 * from being retried.
 */

import type { ErrorSeverity, ClassifiedError } from "./types.js";

// ─── Pattern Lists ───────────────────────────────────────────────────────────

export const FATAL_PATTERNS: string[] = [
  "unauthorized",
  "forbidden",
  "invalid token",
  "authentication failed",
  "permission denied",
  "invalid api key",
  "quota exceeded",
  "credit balance",
  "auth error",
  "account suspended",
  "billing",
];

export const TRANSIENT_PATTERNS: string[] = [
  "timeout",
  "econnrefused",
  "econnreset",
  "etimedout",
  "rate limit",
  "rate_limit",
  "too many requests",
  "429",
  "503",
  "502",
  "500",
  "service unavailable",
  "overloaded",
  "try again",
  "temporarily unavailable",
];

// ─── Classification ──────────────────────────────────────────────────────────

function matchesPattern(message: string, patterns: string[]): boolean {
  return patterns.some((pattern) => message.includes(pattern));
}

/**
 * Classify an error by its message. FATAL takes priority over TRANSIENT.
 */
export function classifyError(error: Error | string): ClassifiedError {
  const message = (typeof error === "string" ? error : error.message).toLowerCase();

  if (matchesPattern(message, FATAL_PATTERNS)) {
    return {
      severity: "FATAL",
      message: typeof error === "string" ? error : error.message,
      shouldRetry: false,
      maxRetries: 0,
    };
  }

  if (matchesPattern(message, TRANSIENT_PATTERNS)) {
    return {
      severity: "TRANSIENT",
      message: typeof error === "string" ? error : error.message,
      shouldRetry: true,
      maxRetries: 3,
    };
  }

  return {
    severity: "UNKNOWN",
    message: typeof error === "string" ? error : error.message,
    shouldRetry: true,
    maxRetries: 1,
  };
}

/**
 * Convenience: classify and determine if a retry should happen given the current attempt count.
 */
export function shouldRetry(error: Error | string, attempt: number): boolean {
  const classified = classifyError(error);
  return classified.shouldRetry && attempt < classified.maxRetries;
}
