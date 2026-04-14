import { describe, expect, test } from "bun:test";
import { parseFeature, loadFeatures } from "../src/commands/feature";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "../../..");

describe("parseFeature", () => {
  test("parses feature with all fields", () => {
    const content = `# my-feature

**Status:** \u{1F534} Not started
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Checklist

- [ ] Research
- [ ] Write tests
- [x] Implementation
- [ ] Deploy`;

    const result = parseFeature(content, "my-feature.md");
    expect(result.name).toBe("my-feature");
    expect(result.status).toBe("Not started");
    expect(result.agent).toBe("unassigned");
    expect(result.category).toBe("coding");
    expect(result.totalItems).toBe(4);
    expect(result.doneItems).toBe(1);
  });

  test("handles feature with no checklist items", () => {
    const content = `# empty-feature

**Status:** \u{1F7E1} In progress
**Agent:** backend

## Description

No checklist yet.`;

    const result = parseFeature(content, "empty-feature.md");
    expect(result.name).toBe("empty-feature");
    expect(result.totalItems).toBe(0);
    expect(result.doneItems).toBe(0);
  });

  test("counts all done items correctly", () => {
    const content = `# done-feature

**Status:** \u{1F7E2} Complete

- [x] Step 1
- [x] Step 2
- [x] Step 3`;

    const result = parseFeature(content, "done-feature.md");
    expect(result.totalItems).toBe(3);
    expect(result.doneItems).toBe(3);
  });
});

describe("loadFeatures", () => {
  test("loads features from project root", async () => {
    const features = await loadFeatures(ROOT);
    expect(features.length).toBeGreaterThan(0);

    const cli = features.find((f) => f.name === "cli-harness-manager");
    expect(cli).toBeDefined();
  });

  test("handles nonexistent directory", async () => {
    const features = await loadFeatures("/tmp/nonexistent-harness-test");
    expect(features).toEqual([]);
  });
});
