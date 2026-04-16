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
    rules: ["TDD: write tests first"],
  };
}

function makeDowngradeRec(): Recommendation {
  return {
    type: "downgrade_model",
    agent: "backend",
    description: "Downgrade model",
    confidence: 0.5,
    evidence: [],
    suggestedChange: { path: "model", from: "opus", to: "sonnet" },
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
    const result = await applyRecommendation(configPath, makeDowngradeRec(), false);
    expect(result).toBeNull();

    const raw = await readFile(configPath, "utf-8");
    const config = JSON.parse(raw);
    expect(config.model).toBeUndefined();
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
    const preview = await previewRecommendation(configPath, makeDowngradeRec());

    expect(preview.before).not.toContain('"model"');
    expect(preview.after).toContain('"model": "sonnet"');

    const raw = await readFile(configPath, "utf-8");
    expect(raw).not.toContain('"model"');
  });
});
