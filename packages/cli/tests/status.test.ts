import { describe, expect, test } from "bun:test";
import { loadAgents } from "../src/commands/agent";
import { loadFeatures } from "../src/commands/feature";
import { loadSkills } from "../src/commands/skill";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "../../..");

describe("status data loading", () => {
  test("all data sources load without error", async () => {
    const [agents, features, skills] = await Promise.all([
      loadAgents(ROOT),
      loadFeatures(ROOT),
      loadSkills(ROOT),
    ]);

    expect(agents.length).toBeGreaterThan(0);
    expect(features.length).toBeGreaterThan(0);
    expect(skills.length).toBeGreaterThan(0);
  });

  test("agents have consistent structure", async () => {
    const agents = await loadAgents(ROOT);
    for (const a of agents) {
      expect(typeof a.name).toBe("string");
      expect(typeof a.model).toBe("string");
      expect(typeof a.level).toBe("number");
      expect(Array.isArray(a.disallowedTools)).toBe(true);
    }
  });

  test("features have consistent structure", async () => {
    const features = await loadFeatures(ROOT);
    for (const f of features) {
      expect(typeof f.name).toBe("string");
      expect(typeof f.status).toBe("string");
      expect(typeof f.totalItems).toBe("number");
      expect(typeof f.doneItems).toBe("number");
      expect(f.doneItems).toBeLessThanOrEqual(f.totalItems);
    }
  });
});
