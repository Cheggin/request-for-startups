import { describe, test, expect } from "bun:test";
import {
  buildLoopDispatchPrompt,
  buildRuntimeLaunchCommand,
  buildSessionBootstrapPrompt,
  isRuntimeProcess,
  resolveAgentRuntime,
} from "../src/lib/runtime.js";

describe("resolveAgentRuntime", () => {
  test("defaults to claude when no override is present", () => {
    expect(resolveAgentRuntime("nonexistent-agent")).toBe("claude");
  });

  test("uses CLI override over config", () => {
    expect(resolveAgentRuntime("website", { override: "codex" })).toBe("codex");
    expect(resolveAgentRuntime("website", { override: "gemini" })).toBe("gemini");
  });
});

describe("runtime command builders", () => {
  test("builds the Claude launch command with model and system prompt", () => {
    const command = buildRuntimeLaunchCommand("claude", {
      model: "claude-opus-4-6",
      systemPrompt: "You are the website agent.",
    });

    expect(command).toContain("'claude'");
    expect(command).toContain("'--dangerously-skip-permissions'");
    expect(command).toContain("'--model'");
    expect(command).toContain("'claude-opus-4-6'");
    expect(command).toContain("'--append-system-prompt'");
  });

  test("builds the Codex launch command", () => {
    expect(buildRuntimeLaunchCommand("codex")).toBe("'codex' '--yolo'");
  });

  test("builds a Claude loop slash command", () => {
    expect(buildLoopDispatchPrompt("claude", "60s", "Do the work")).toBe(
      "/loop 60s Do the work"
    );
  });

  test("builds a non-Claude bootstrap message", () => {
    const prompt = buildSessionBootstrapPrompt("codex", {
      systemPrompt: "You are Website.\nUse the repo rules.",
      taskPrompt: "Build the marketing page.",
    });

    expect(prompt).toContain("Follow these session instructions");
    expect(prompt).toContain("You are Website. Use the repo rules.");
    expect(prompt).toContain("Build the marketing page.");
  });
});

describe("isRuntimeProcess", () => {
  test("recognizes supported runtimes", () => {
    expect(isRuntimeProcess("claude")).toBe(true);
    expect(isRuntimeProcess("codex")).toBe(true);
    expect(isRuntimeProcess("gemini")).toBe(true);
    expect(isRuntimeProcess("2.1.108")).toBe(true);
    expect(isRuntimeProcess("zsh")).toBe(false);
  });
});
