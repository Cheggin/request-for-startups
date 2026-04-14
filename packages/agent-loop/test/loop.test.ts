import { describe, test, expect } from "bun:test";
import { buildSystemPrompt } from "../src/loop.js";
import type { AgentDefinition } from "../src/types.js";

const mockAgent: AgentDefinition = {
  name: "backend",
  model: "claude-sonnet-4-6",
  level: 2,
  disallowedTools: ["Write"],
  maxTurns: 200,
  body: "You are Backend. Build APIs.",
};

describe("buildSystemPrompt", () => {
  test("includes agent metadata", () => {
    const prompt = buildSystemPrompt(mockAgent, "", "Mode prompt.", "Build the API");
    expect(prompt).toContain("# Agent: backend");
    expect(prompt).toContain("claude-sonnet-4-6");
    expect(prompt).toContain("Level: 2");
    expect(prompt).toContain("Max turns: 200");
  });

  test("includes disallowed tools", () => {
    const prompt = buildSystemPrompt(mockAgent, "", "Mode.", "Task.");
    expect(prompt).toContain("Disallowed tools: Write");
  });

  test("omits disallowed tools section when empty", () => {
    const agentNoDisallowed = { ...mockAgent, disallowedTools: [] };
    const prompt = buildSystemPrompt(agentNoDisallowed, "", "Mode.", "Task.");
    expect(prompt).not.toContain("Disallowed tools");
  });

  test("includes mode prompt", () => {
    const prompt = buildSystemPrompt(mockAgent, "", "You are in BUILD mode.", "Task.");
    expect(prompt).toContain("## Current Mode");
    expect(prompt).toContain("You are in BUILD mode.");
  });

  test("includes task", () => {
    const prompt = buildSystemPrompt(mockAgent, "", "Mode.", "Build the user API");
    expect(prompt).toContain("## Task");
    expect(prompt).toContain("Build the user API");
  });

  test("includes agent body", () => {
    const prompt = buildSystemPrompt(mockAgent, "", "Mode.", "Task.");
    expect(prompt).toContain("## Agent Instructions");
    expect(prompt).toContain("You are Backend. Build APIs.");
  });

  test("includes skills when provided", () => {
    const skills = '<Skill name="test">Test skill content.</Skill>';
    const prompt = buildSystemPrompt(mockAgent, skills, "Mode.", "Task.");
    expect(prompt).toContain("## Loaded Skills");
    expect(prompt).toContain("Test skill content.");
  });

  test("omits skills section when empty", () => {
    const prompt = buildSystemPrompt(mockAgent, "", "Mode.", "Task.");
    expect(prompt).not.toContain("## Loaded Skills");
  });
});
