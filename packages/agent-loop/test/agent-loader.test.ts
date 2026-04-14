import { describe, test, expect } from "bun:test";
import { parseAgentFile, loadAgent, listAgents } from "../src/agent-loader.js";
import { mkdtempSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

describe("parseAgentFile", () => {
  test("parses valid frontmatter with all fields", () => {
    const content = `---
name: backend
model: claude-sonnet-4-6
level: 2
maxTurns: 200
disallowedTools:
  - Write
  - Bash
---

You are Backend.`;

    const def = parseAgentFile(content, "backend.md");
    expect(def.name).toBe("backend");
    expect(def.model).toBe("claude-sonnet-4-6");
    expect(def.level).toBe(2);
    expect(def.maxTurns).toBe(200);
    expect(def.disallowedTools).toEqual(["Write", "Bash"]);
    expect(def.body).toBe("You are Backend.");
  });

  test("defaults maxTurns to 100 when omitted", () => {
    const content = `---
name: ops
model: claude-opus-4
level: 1
---

Ops agent.`;

    const def = parseAgentFile(content, "ops.md");
    expect(def.maxTurns).toBe(100);
  });

  test("defaults disallowedTools to empty array", () => {
    const content = `---
name: growth
model: claude-sonnet-4-6
level: 2
---

Growth agent.`;

    const def = parseAgentFile(content, "growth.md");
    expect(def.disallowedTools).toEqual([]);
  });

  test("parses comma-separated disallowedTools string", () => {
    const content = `---
name: writer
model: claude-sonnet-4-6
level: 2
disallowedTools: "Write, Bash, Edit"
---

Writer.`;

    const def = parseAgentFile(content, "writer.md");
    expect(def.disallowedTools).toEqual(["Write", "Bash", "Edit"]);
  });

  test("throws on missing name", () => {
    const content = `---
model: claude-sonnet-4-6
level: 2
---

No name.`;

    expect(() => parseAgentFile(content, "bad.md")).toThrow("missing required frontmatter field: name");
  });

  test("throws on missing model", () => {
    const content = `---
name: test
level: 2
---

No model.`;

    expect(() => parseAgentFile(content, "test.md")).toThrow("missing required frontmatter field: model");
  });

  test("throws on invalid level", () => {
    const content = `---
name: test
model: claude-sonnet-4-6
level: -1
---

Bad level.`;

    expect(() => parseAgentFile(content, "test.md")).toThrow("invalid level");
  });

  test("throws on invalid maxTurns", () => {
    const content = `---
name: test
model: claude-sonnet-4-6
level: 1
maxTurns: 0
---

Bad turns.`;

    expect(() => parseAgentFile(content, "test.md")).toThrow("invalid maxTurns");
  });
});

describe("loadAgent / listAgents", () => {
  const tmpDir = mkdtempSync(join(tmpdir(), "agent-loader-test-"));

  writeFileSync(
    join(tmpDir, "alpha.md"),
    `---
name: alpha
model: claude-sonnet-4-6
level: 2
maxTurns: 50
---

Alpha agent.`,
  );

  writeFileSync(
    join(tmpDir, "beta.md"),
    `---
name: beta
model: claude-opus-4
level: 1
---

Beta agent.`,
  );

  writeFileSync(join(tmpDir, "readme.txt"), "not an agent");

  test("loadAgent reads and parses a single agent", () => {
    const agent = loadAgent(tmpDir, "alpha");
    expect(agent.name).toBe("alpha");
    expect(agent.maxTurns).toBe(50);
  });

  test("loadAgent throws for nonexistent agent", () => {
    expect(() => loadAgent(tmpDir, "nonexistent")).toThrow();
  });

  test("listAgents returns only .md files without extension", () => {
    const names = listAgents(tmpDir);
    expect(names).toContain("alpha");
    expect(names).toContain("beta");
    expect(names).not.toContain("readme");
  });
});
