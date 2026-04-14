import { readFile, writeFile } from "node:fs/promises";
import type { AgentConfig, Recommendation } from "./types.js";

/**
 * Applies a recommendation to an agent config file.
 * Requires explicit confirmation — never auto-applies without review.
 *
 * Returns the updated config, or null if the apply was rejected.
 */
export async function applyRecommendation(
  agentConfigPath: string,
  recommendation: Recommendation,
  confirmed: boolean
): Promise<AgentConfig | null> {
  if (!confirmed) {
    return null;
  }

  const raw = await readFile(agentConfigPath, "utf-8");
  const config: AgentConfig = JSON.parse(raw);

  const updated = applyChange(config, recommendation);

  await writeFile(agentConfigPath, JSON.stringify(updated, null, 2) + "\n", "utf-8");

  return updated;
}

/**
 * Generates a preview diff of what the recommendation would change.
 * Does not modify the file.
 */
export async function previewRecommendation(
  agentConfigPath: string,
  recommendation: Recommendation
): Promise<{ before: string; after: string }> {
  const raw = await readFile(agentConfigPath, "utf-8");
  const config: AgentConfig = JSON.parse(raw);

  const updated = applyChange(config, recommendation);

  return {
    before: JSON.stringify(config, null, 2),
    after: JSON.stringify(updated, null, 2),
  };
}

/**
 * Applies the change described in a recommendation to a config object.
 */
function applyChange(config: AgentConfig, recommendation: Recommendation): AgentConfig {
  const updated = structuredClone(config);
  const change = recommendation.suggestedChange;

  switch (recommendation.type) {
    case "lower_max_turns":
    case "raise_max_turns": {
      if (!updated.hooks || typeof updated.hooks !== "object") {
        updated.hooks = {};
      }
      const hooks = updated.hooks as Record<string, Record<string, unknown>>;
      if (!hooks["budget-enforcer"]) {
        hooks["budget-enforcer"] = {};
      }
      hooks["budget-enforcer"].turnLimit = change.to;
      break;
    }

    case "add_hooks": {
      if (!updated.hooks || typeof updated.hooks !== "object") {
        updated.hooks = {};
      }
      const hooks = updated.hooks as Record<string, Record<string, unknown>>;
      hooks["error-validator"] = {
        event: "preExec",
        description: "Validate execution before proceeding (auto-added by config-optimizer)",
        action: "validate_and_warn",
      };
      break;
    }

    case "upgrade_model":
    case "downgrade_model": {
      updated.model = change.to as string;
      break;
    }
  }

  return updated;
}
