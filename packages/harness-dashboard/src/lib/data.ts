/**
 * Real data sources — NO MOCKS.
 *
 * Every function here talks to a real system:
 * - Agents: tmux panes (real Claude Code sessions)
 * - Startups: filesystem (.harness/founder-profile.yml in project dirs)
 * - Deployments: vercel CLI
 * - Costs: .harness/costs/ files
 *
 * If a source is unavailable, return empty — never fake it.
 */

import { execSync } from "child_process";
import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface RealAgent {
  name: string;
  status: "running" | "idle" | "stopped";
  paneId: string;
  lastOutput: string; // last few lines from tmux capture
  cwd: string;
  startup: string;
}

export interface RealStartup {
  id: string;
  name: string;
  type: string;
  idea: string;
  path: string;
  hasHarness: boolean;
  deployUrl?: string;
}

export interface RealDeployment {
  name: string;
  url: string;
  state: string;
  createdAt: string;
}

// ─── Agents: Read from tmux ────────────────────────────────────────────────

export function getRunningAgents(): RealAgent[] {
  try {
    // Use pipe delimiter to avoid conflicts with paths/names containing colons
    const raw = execSync(
      'tmux list-panes -a -F "#{session_name}|#{window_name}|#{pane_id}|#{pane_current_command}|#{pane_current_path}" 2>/dev/null',
      { encoding: "utf-8", timeout: 5000 }
    ).trim();

    if (!raw) return [];

    return raw.split("\n").filter(Boolean).map((line) => {
      const parts = line.split("|");
      const session = parts[0] || "";
      const windowName = parts[1] || "";
      const paneId = parts[2] || "";
      const command = parts[3] || "";
      const cwd = parts[4] || "";
      const name = windowName || session || "unknown";

      // Capture last few lines of output
      let lastOutput = "";
      try {
        lastOutput = execSync(
          `tmux capture-pane -t "${paneId}" -p -l 5 2>/dev/null`,
          { encoding: "utf-8", timeout: 3000 }
        ).trim();
      } catch {}

      // Determine status: Claude Code shows its version as the "command" (e.g. "2.1.108")
      // Also check for common signals in the pane output
      const isClaudeRunning =
        /^\d+\.\d+\.\d+$/.test(command) || // Claude Code version string
        command === "claude" ||
        command === "node" ||
        command === "bun" ||
        lastOutput.includes("Claude") ||
        lastOutput.includes("Embellishing") ||
        lastOutput.includes("Reading") ||
        lastOutput.includes("Writing") ||
        lastOutput.includes("Running") ||
        lastOutput.includes("bypass permissions");

      const status: RealAgent["status"] = isClaudeRunning ? "running" : "idle";

      // Project name from the working directory
      const startup = cwd?.split("/").pop() || "unknown";

      return {
        name,
        status,
        paneId,
        lastOutput,
        cwd: cwd || "",
        startup,
      };
    });
  } catch {
    return [];
  }
}

// ─── Startups: Scan project directories ────────────────────────────────────

const PROJECT_SCAN_DIRS = [
  "/Users/reagan/Documents/GitHub",
];

export function getStartups(): RealStartup[] {
  const startups: RealStartup[] = [];

  for (const scanDir of PROJECT_SCAN_DIRS) {
    if (!existsSync(scanDir)) continue;

    try {
      const dirs = readdirSync(scanDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);

      for (const dir of dirs) {
        const projectPath = join(scanDir, dir);
        const profilePath = join(projectPath, ".harness", "founder-profile.yml");

        if (existsSync(profilePath)) {
          const profile = parseSimpleYaml(readFileSync(profilePath, "utf-8"));
          startups.push({
            id: dir,
            name: profile.idea?.split(" ").slice(0, 3).join(" ") || dir,
            type: profile.type || "unknown",
            idea: profile.idea || "",
            path: projectPath,
            hasHarness: true,
            deployUrl: getVercelUrl(dir),
          });
        }
      }
    } catch {}
  }

  // Also check test-runs in the harness repo
  const testRunsDir = "/Users/reagan/Documents/GitHub/request-for-startups/test-runs";
  if (existsSync(testRunsDir)) {
    try {
      const dirs = readdirSync(testRunsDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);

      for (const dir of dirs) {
        const projectPath = join(testRunsDir, dir, "project");
        if (existsSync(projectPath)) {
          startups.push({
            id: dir,
            name: dir.replace("level-5-", "").replace(/-/g, " "),
            type: "test-run",
            idea: `Test run: ${dir}`,
            path: projectPath,
            hasHarness: false,
            deployUrl: getVercelUrlFromConfig(projectPath),
          });
        }
      }
    } catch {}
  }

  return startups;
}

// ─── Deployments: Read from Vercel CLI ─────────────────────────────────────

export function getDeployments(): RealDeployment[] {
  try {
    const raw = execSync("vercel ls --json 2>/dev/null", {
      encoding: "utf-8",
      timeout: 15000,
    });
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      return data.map((d: any) => ({
        name: d.name || "unknown",
        url: d.url || "",
        state: d.state || d.readyState || "unknown",
        createdAt: d.createdAt || d.created || "",
      }));
    }
    return [];
  } catch {
    return [];
  }
}

// ─── Costs: Read from .harness/costs/ ──────────────────────────────────────

export function getCosts(projectPath: string): { agent: string; cost: number }[] {
  const costsDir = join(projectPath, ".harness", "costs");
  if (!existsSync(costsDir)) return [];

  try {
    const files = readdirSync(costsDir).filter((f) => f.endsWith(".json"));
    return files.map((f) => {
      const data = JSON.parse(readFileSync(join(costsDir, f), "utf-8"));
      return {
        agent: data.agent || f.replace(".json", ""),
        cost: data.totalCost || data.cost || 0,
      };
    });
  } catch {
    return [];
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function parseSimpleYaml(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const idx = line.indexOf(":");
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      result[key] = val;
    }
  }
  return result;
}

function getVercelUrl(projectName: string): string | undefined {
  try {
    const raw = execSync(`vercel ls ${projectName} --json 2>/dev/null`, {
      encoding: "utf-8",
      timeout: 10000,
    });
    const data = JSON.parse(raw);
    if (Array.isArray(data) && data.length > 0) {
      return `https://${data[0].url}`;
    }
  } catch {}
  return undefined;
}

function getVercelUrlFromConfig(projectPath: string): string | undefined {
  const vercelJson = join(projectPath, ".vercel", "project.json");
  if (existsSync(vercelJson)) {
    try {
      const data = JSON.parse(readFileSync(vercelJson, "utf-8"));
      if (data.projectId) {
        return `https://${data.projectId}.vercel.app`;
      }
    } catch {}
  }
  return undefined;
}
