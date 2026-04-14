import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { applyRecommendation, previewRecommendation } from "./apply.js";
import type { AgentConfig, Recommendation } from "./types.js";

function makeConfig(): AgentConfig {
  return {
    name: "backend",
    description: "Backend agent",
    category: "coding",
    hooks: {
      "budget-enforcer": {
        turnLimit: 200,
        wallClockTimeout: "45m",
        action: "warn_then_stop",
      },
    },
    rules: ["TDD: write tests first"],
  };
}

function makeLowerTurnsRec(): Recommendation {
  return {
    type: "lower_max_turns",
    agent: "backend",
    description: "Suggest lowering maxTurns",
    confidence: 0.9,
    evidence: ["Avg turns: 30", "MaxTurns: 200"],
    suggestedChange: {
      path: "hooks.budget-enforcer.turnLimit",
      from: 200,
      to: 45,
    },
  };
}

describe("applyRecommendation", () => {
  let tmpDir: string;
  let configPath: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "config-opt-apply-"));
    configPath = join(tmpDir, "backend.json");
    await writeFile(configPath, JSON.stringify(makeConfig(), null, 2));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("returns null when not confirmed", async () => {
    const result = await applyRecommendation(configPath, makeLowerTurnsRec(), false);
    expect(result).toBeNull();

    // File should be unchanged
    const raw = await readFile(configPath, "utf-8");
    const config = JSON.parse(raw);
    expect((config.hooks as Record<string, Record<string, unknown>>)["budget-enforcer"].turnLimit).toBe(200);
  });

  it("applies lower_max_turns when confirmed", async () => {
    const result = await applyRecommendation(configPath, makeLowerTurnsRec(), true);
    expect(result).not.toBeNull();

    const raw = await readFile(configPath, "utf-8");
    const config = JSON.parse(raw);
    expect((config.hooks as Record<string, Record<string, unknown>>)["budget-enforcer"].turnLimit).toBe(45);
  });

  it("applies raise_max_turns", async () => {
    const rec: Recommendation = {
      type: "raise_max_turns",
      agent: "backend",
      description: "Raise maxTurns",
      confidence: 0.8,
      evidence: [],
      suggestedChange: { path: "hooks.budget-enforcer.turnLimit", from: 200, to: 300 },
    };

    const result = await applyRecommendation(configPath, rec, true);
    expect(result).not.toBeNull();
    expect(
      ((result!.hooks as Record<string, Record<string, unknown>>)["budget-enforcer"]).turnLimit
    ).toBe(300);
  });

  it("applies add_hooks recommendation", async () => {
    const rec: Recommendation = {
      type: "add_hooks",
      agent: "backend",
      description: "Add validation hooks",
      confidence: 0.7,
      evidence: [],
      suggestedChange: { path: "hooks", action: "add_validation_hook" },
    };

    const result = await applyRecommendation(configPath, rec, true);
    expect(result).not.toBeNull();
    expect(
      (result!.hooks as Record<string, Record<string, unknown>>)["error-validator"]
    ).toBeDefined();
  });

  it("applies model downgrade", async () => {
    const rec: Recommendation = {
      type: "downgrade_model",
      agent: "backend",
      description: "Downgrade model",
      confidence: 0.5,
      evidence: [],
      suggestedChange: { path: "model", from: "opus", to: "sonnet" },
    };

    const result = await applyRecommendation(configPath, rec, true);
    expect(result).not.toBeNull();
    expect(result!.model).toBe("sonnet");
  });

  it("applies model upgrade", async () => {
    const rec: Recommendation = {
      type: "upgrade_model",
      agent: "backend",
      description: "Upgrade model",
      confidence: 0.7,
      evidence: [],
      suggestedChange: { path: "model", from: "haiku", to: "sonnet" },
    };

    const result = await applyRecommendation(configPath, rec, true);
    expect(result).not.toBeNull();
    expect(result!.model).toBe("sonnet");
  });

  it("creates hooks object if missing", async () => {
    const noHooksConfig: AgentConfig = { name: "minimal" };
    await writeFile(configPath, JSON.stringify(noHooksConfig, null, 2));

    const result = await applyRecommendation(configPath, makeLowerTurnsRec(), true);
    expect(result).not.toBeNull();
    expect(
      ((result!.hooks as Record<string, Record<string, unknown>>)["budget-enforcer"]).turnLimit
    ).toBe(45);
  });
});

describe("previewRecommendation", () => {
  let tmpDir: string;
  let configPath: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "config-opt-preview-"));
    configPath = join(tmpDir, "backend.json");
    await writeFile(configPath, JSON.stringify(makeConfig(), null, 2));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("returns before and after without modifying file", async () => {
    const preview = await previewRecommendation(configPath, makeLowerTurnsRec());

    expect(preview.before).toContain('"turnLimit": 200');
    expect(preview.after).toContain('"turnLimit": 45');

    // File should be unchanged
    const raw = await readFile(configPath, "utf-8");
    expect(raw).toContain('"turnLimit": 200');
  });
});
