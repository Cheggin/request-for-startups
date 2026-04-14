import { describe, test, expect } from "bun:test";
import { formatForAgent } from "../src/queries";
import type { SentryIssue } from "../src/queries";

function makeMockIssue(overrides: Partial<SentryIssue> = {}): SentryIssue {
  return {
    id: "12345",
    title: "TypeError: Cannot read property 'map' of undefined",
    culprit: "app/components/UserList.tsx",
    level: "error",
    status: "unresolved",
    firstSeen: "2026-04-10T10:00:00Z",
    lastSeen: "2026-04-13T12:00:00Z",
    count: "42",
    platform: "javascript",
    metadata: {
      type: "TypeError",
      value: "Cannot read property 'map' of undefined",
      filename: "app/components/UserList.tsx",
      function: "render",
    },
    shortId: "PROJ-123",
    project: { slug: "my-project", name: "My Project" },
    ...overrides,
  };
}

describe("queries", () => {
  describe("formatForAgent", () => {
    test("formats frontend error correctly", () => {
      const issue = makeMockIssue();
      const result = formatForAgent(issue);

      expect(result.issueId).toBe("12345");
      expect(result.title).toBe("TypeError: Cannot read property 'map' of undefined");
      expect(result.errorType).toBe("TypeError");
      expect(result.errorMessage).toBe("Cannot read property 'map' of undefined");
      expect(result.location).toContain("UserList.tsx");
      expect(result.occurrences).toBe(42);
      expect(result.category).toBe("frontend");
      expect(result.suggestedAction).toContain("React");
    });

    test("classifies API errors correctly", () => {
      const issue = makeMockIssue({
        title: "500 Internal Server Error",
        culprit: "api/users/route.ts",
        metadata: {
          type: "HttpError",
          value: "500 Internal Server Error",
          filename: "api/users/route.ts",
        },
      });
      const result = formatForAgent(issue);
      expect(result.category).toBe("api");
      expect(result.suggestedAction).toContain("API");
    });

    test("classifies infra errors correctly", () => {
      const issue = makeMockIssue({
        title: "ECONNREFUSED: Connection refused",
        culprit: "node:net",
        metadata: {
          type: "SystemError",
          value: "ECONNREFUSED",
        },
      });
      const result = formatForAgent(issue);
      expect(result.category).toBe("infra");
      expect(result.suggestedAction).toContain("infrastructure");
    });

    test("defaults unknown errors", () => {
      const issue = makeMockIssue({
        title: "Something weird happened",
        culprit: "unknown",
        metadata: { type: "CustomError", value: "weird" },
      });
      const result = formatForAgent(issue);
      expect(result.category).toBe("unknown");
    });

    test("handles missing metadata gracefully", () => {
      const issue = makeMockIssue({
        metadata: {},
      });
      const result = formatForAgent(issue);
      expect(result.errorType).toBe("error"); // Falls back to level
      expect(result.location).toBe("app/components/UserList.tsx"); // Falls back to culprit
    });
  });
});
