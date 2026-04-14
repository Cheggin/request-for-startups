import { describe, test, expect } from "bun:test";
import { routeError, routeErrors } from "../src/alert-router";
import type { AgentError } from "../src/queries";

function makeError(overrides: Partial<AgentError> = {}): AgentError {
  return {
    issueId: "1",
    title: "Test Error",
    errorType: "Error",
    errorMessage: "Something broke",
    location: "src/index.ts",
    occurrences: 5,
    firstSeen: "2026-04-10T10:00:00Z",
    lastSeen: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    stackTrace: [],
    suggestedAction: "Fix it",
    category: "frontend",
    ...overrides,
  };
}

describe("alert-router", () => {
  describe("routeError", () => {
    test("routes frontend errors to website agent", () => {
      const error = makeError({ category: "frontend" });
      const result = routeError(error);
      expect(result.targetAgent).toBe("website");
      expect(result.instruction).toContain("Frontend error");
    });

    test("routes API errors to backend agent", () => {
      const error = makeError({ category: "api" });
      const result = routeError(error);
      expect(result.targetAgent).toBe("backend");
      expect(result.instruction).toContain("API error");
    });

    test("routes infra errors to ops agent", () => {
      const error = makeError({ category: "infra" });
      const result = routeError(error);
      expect(result.targetAgent).toBe("ops");
      expect(result.instruction).toContain("Infrastructure error");
    });

    test("routes unknown errors to backend agent", () => {
      const error = makeError({ category: "unknown" });
      const result = routeError(error);
      expect(result.targetAgent).toBe("backend");
    });

    test("assigns critical priority for high-volume recent errors", () => {
      const error = makeError({
        occurrences: 150,
        lastSeen: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
      });
      const result = routeError(error);
      expect(result.priority).toBe("critical");
      expect(result.instruction).toContain("URGENT");
    });

    test("assigns high priority for very recent errors", () => {
      const error = makeError({
        occurrences: 3,
        lastSeen: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
      });
      const result = routeError(error);
      expect(result.priority).toBe("high");
    });

    test("assigns low priority for few old errors", () => {
      const error = makeError({
        occurrences: 2,
        lastSeen: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
      });
      const result = routeError(error);
      expect(result.priority).toBe("low");
    });
  });

  describe("routeErrors", () => {
    test("groups errors by agent target", () => {
      const errors = [
        makeError({ issueId: "1", category: "frontend" }),
        makeError({ issueId: "2", category: "api" }),
        makeError({ issueId: "3", category: "frontend" }),
        makeError({ issueId: "4", category: "infra" }),
      ];

      const result = routeErrors(errors);
      expect(result.website.length).toBe(2);
      expect(result.backend.length).toBe(1);
      expect(result.ops.length).toBe(1);
    });

    test("sorts errors by priority within each agent", () => {
      const errors = [
        makeError({
          issueId: "1",
          category: "frontend",
          occurrences: 2,
          lastSeen: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        }),
        makeError({
          issueId: "2",
          category: "frontend",
          occurrences: 200,
          lastSeen: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        }),
      ];

      const result = routeErrors(errors);
      expect(result.website[0].error.issueId).toBe("2"); // Critical comes first
      expect(result.website[1].error.issueId).toBe("1"); // Low comes last
    });

    test("returns empty arrays when no errors", () => {
      const result = routeErrors([]);
      expect(result.website).toEqual([]);
      expect(result.backend).toEqual([]);
      expect(result.ops).toEqual([]);
    });
  });
});
