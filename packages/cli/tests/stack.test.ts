import { describe, expect, test } from "bun:test";
import { parseStacksYaml, TOOL_CATALOG } from "../src/commands/stack";

describe("parseStacksYaml", () => {
  test("parses simple yaml", () => {
    const content = `website:
  framework: nextjs
  bundler: turbopack

backend:
  database: convex`;

    const entries = parseStacksYaml(content);
    expect(entries.length).toBe(5);
    expect(entries[0]).toEqual({ key: "website", value: "", indent: 0 });
    expect(entries[1]).toEqual({ key: "framework", value: "nextjs", indent: 2 });
    expect(entries[2]).toEqual({ key: "bundler", value: "turbopack", indent: 2 });
    expect(entries[3]).toEqual({ key: "backend", value: "", indent: 0 });
    expect(entries[4]).toEqual({ key: "database", value: "convex", indent: 2 });
  });

  test("skips comments and blank lines", () => {
    const content = `# Header comment
website:
  # inline note
  framework: nextjs

  bundler: turbopack`;

    const entries = parseStacksYaml(content);
    expect(entries.length).toBe(3);
    expect(entries[0].key).toBe("website");
    expect(entries[1].key).toBe("framework");
    expect(entries[2].key).toBe("bundler");
  });

  test("strips inline comments from values", () => {
    const content = `backend:
  authentication: null # deferred until later`;

    const entries = parseStacksYaml(content);
    expect(entries[1].value).toBe("null");
  });
});

describe("TOOL_CATALOG", () => {
  test("has entries for common tools", () => {
    expect(TOOL_CATALOG["postgres"]).toBeDefined();
    expect(TOOL_CATALOG["sentry"]).toBeDefined();
    expect(TOOL_CATALOG["shadcn-ui"]).toBeDefined();
    expect(TOOL_CATALOG["clerk"]).toBeDefined();
  });

  test("all entries have required fields", () => {
    for (const [name, info] of Object.entries(TOOL_CATALOG)) {
      expect(info.category).toBeTruthy();
      expect(info.key).toBeTruthy();
      expect(info.description).toBeTruthy();
    }
  });
});
