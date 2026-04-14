import { describe, it, expect } from "vitest";
import { checkConfigProtection } from "../src/config-protection.js";

describe("config-protection", () => {
  it("should BLOCK Edit to .harness/ files", () => {
    const result = checkConfigProtection({
      tool_name: "Edit",
      tool_input: { file_path: ".harness/settings.json", old_string: "a", new_string: "b" },
    });
    expect(result.decision).toBe("DENY");
    expect(result.message).toContain(".harness/settings.json");
  });

  it("should BLOCK Write to tsconfig.json", () => {
    const result = checkConfigProtection({
      tool_name: "Write",
      tool_input: { file_path: "tsconfig.json", content: "{}" },
    });
    expect(result.decision).toBe("DENY");
    expect(result.message).toContain("tsconfig.json");
  });

  it("should BLOCK Edit to .github/workflows/ files", () => {
    const result = checkConfigProtection({
      tool_name: "Edit",
      tool_input: { file_path: ".github/workflows/ci.yml", old_string: "a", new_string: "b" },
    });
    expect(result.decision).toBe("DENY");
    expect(result.message).toContain(".github/workflows/ci.yml");
  });

  it("should BLOCK Edit to vitest.config.ts", () => {
    const result = checkConfigProtection({
      tool_name: "Edit",
      tool_input: { file_path: "vitest.config.ts", old_string: "a", new_string: "b" },
    });
    expect(result.decision).toBe("DENY");
    expect(result.message).toContain("vitest.config.ts");
  });

  it("should BLOCK Edit to playwright.config.ts", () => {
    const result = checkConfigProtection({
      tool_name: "Edit",
      tool_input: { file_path: "playwright.config.ts", old_string: "a", new_string: "b" },
    });
    expect(result.decision).toBe("DENY");
    expect(result.message).toContain("playwright.config.ts");
  });

  it("should BLOCK Edit to .eslintrc", () => {
    const result = checkConfigProtection({
      tool_name: "Edit",
      tool_input: { file_path: ".eslintrc", old_string: "a", new_string: "b" },
    });
    expect(result.decision).toBe("DENY");
    expect(result.message).toContain(".eslintrc");
  });

  it("should BLOCK Edit to biome.json", () => {
    const result = checkConfigProtection({
      tool_name: "Edit",
      tool_input: { file_path: "biome.json", old_string: "a", new_string: "b" },
    });
    expect(result.decision).toBe("DENY");
    expect(result.message).toContain("biome.json");
  });

  it("should BLOCK Edit to nested .harness/ paths", () => {
    const result = checkConfigProtection({
      tool_name: "Edit",
      tool_input: { file_path: ".harness/agents/planner.json", old_string: "a", new_string: "b" },
    });
    expect(result.decision).toBe("DENY");
  });

  it("should ALLOW Edit to normal source files", () => {
    const result = checkConfigProtection({
      tool_name: "Edit",
      tool_input: { file_path: "src/index.ts", old_string: "a", new_string: "b" },
    });
    expect(result).toEqual({ decision: "ALLOW" });
  });

  it("should ALLOW Edit to regular JS files", () => {
    const result = checkConfigProtection({
      tool_name: "Edit",
      tool_input: { file_path: "lib/utils.js", old_string: "a", new_string: "b" },
    });
    expect(result).toEqual({ decision: "ALLOW" });
  });

  it("should return clear error message with which file is protected", () => {
    const result = checkConfigProtection({
      tool_name: "Write",
      tool_input: { file_path: ".github/workflows/deploy.yml", content: "name: deploy" },
    });
    expect(result.decision).toBe("DENY");
    expect(result.message).toContain(".github/workflows/deploy.yml");
    expect(result.message).toContain("protected");
  });

  it("should ALLOW non-Edit/Write tool calls", () => {
    const result = checkConfigProtection({
      tool_name: "Read",
      tool_input: { file_path: "tsconfig.json" },
    });
    expect(result).toEqual({ decision: "ALLOW" });
  });
});
