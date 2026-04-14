import { describe, expect, test } from "bun:test";
import { parseAgentFrontmatter, loadAgents } from "../src/commands/agent";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "../../..");

describe("parseAgentFrontmatter", () => {
  test("parses valid frontmatter", () => {
    const content = `---
name: commander
description: Orchestrator agent
model: claude-opus-4-6
level: 4
disallowedTools: Write, Edit
maxTurns: 300
---

<Agent_Prompt>body here</Agent_Prompt>`;

    const result = parseAgentFrontmatter(content, "commander.md");
    expect(result.name).toBe("commander");
    expect(result.description).toBe("Orchestrator agent");
    expect(result.model).toBe("claude-opus-4-6");
    expect(result.level).toBe(4);
    expect(result.disallowedTools).toEqual(["Write", "Edit"]);
    expect(result.maxTurns).toBe(300);
  });

  test("parses frontmatter without disallowedTools", () => {
    const content = `---
name: backend
description: Backend developer
model: claude-sonnet-4-6
level: 2
maxTurns: 200
---

body`;

    const result = parseAgentFrontmatter(content, "backend.md");
    expect(result.name).toBe("backend");
    expect(result.disallowedTools).toEqual([]);
    expect(result.maxTurns).toBe(200);
  });

  test("handles missing frontmatter gracefully", () => {
    const content = "# Just a markdown file\nNo frontmatter here.";
    const result = parseAgentFrontmatter(content, "orphan.md");
    expect(result.name).toBe("orphan");
    expect(result.model).toBe("unknown");
    expect(result.level).toBe(0);
  });
});

describe("loadAgents", () => {
  test("loads agents from project root", async () => {
    const agents = await loadAgents(ROOT);
    expect(agents.length).toBeGreaterThan(0);

    const commander = agents.find((a) => a.name === "commander");
    expect(commander).toBeDefined();
    expect(commander!.model).toBe("claude-opus-4-6");
    expect(commander!.level).toBe(4);
  });

  test("agents are sorted by level descending", async () => {
    const agents = await loadAgents(ROOT);
    for (let i = 1; i < agents.length; i++) {
      expect(agents[i - 1].level).toBeGreaterThanOrEqual(agents[i].level);
    }
  });

  test("handles nonexistent directory", async () => {
    const agents = await loadAgents("/tmp/nonexistent-harness-test");
    expect(agents).toEqual([]);
  });
});
