import { describe, expect, test } from "bun:test";
import { buildAgentSystemPrompt, buildClaudeCommand } from "./claude.js";

describe("claude helpers", () => {
  test("buildClaudeCommand quotes cwd and prompt arguments", () => {
    const command = buildClaudeCommand({
      model: "claude-opus-4-6",
      cwd: "/tmp/request-for-startups it's",
      systemPrompt: "line 1\nline 2",
    });

    expect(command).toContain("cd '/tmp/request-for-startups it'\"'\"'s'");
    expect(command).toContain("'claude'");
    expect(command).toContain("'--append-system-prompt'");
    expect(command).toContain("'line 1\nline 2'");
  });

  test("buildAgentSystemPrompt includes agent-specific instructions", () => {
    const prompt = buildAgentSystemPrompt("website");

    expect(prompt).toContain("You are Website.");
    expect(prompt).toContain("/startup-harness:");
  });
});
