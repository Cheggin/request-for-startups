#!/usr/bin/env bun
/**
 * Branch Enforcer Hook — blocks `git push` to main/master.
 *
 * Agents must push to feature branches only. This prevents accidental
 * direct pushes to the primary branch during automated agent workflows.
 *
 * Hook type: PreToolUse (Bash)
 * Reads stdin as JSON { tool_name, tool_input: { command } }.
 * Exits with code 2 to block the tool call.
 */

const PROTECTED_BRANCHES = ["main", "master"];

/**
 * Parse a git push command and extract the target branch.
 * Handles: git push, git push origin main, git push -u origin feat/x,
 * git push --force origin main, etc.
 */
function extractPushTarget(command: string): string | null {
  // Normalize: collapse whitespace, strip leading/trailing
  const normalized = command.trim().replace(/\s+/g, " ");

  // Match git push commands (may be chained with && or ;)
  const segments = normalized.split(/&&|;/).map((s) => s.trim());

  for (const segment of segments) {
    // Match: git push [flags...] [remote] [refspec]
    const pushMatch = segment.match(/\bgit\s+push\b(.*)$/);
    if (!pushMatch) continue;

    const pushArgs = pushMatch[1].trim();

    // Strip known flags to isolate positional args
    const stripped = pushArgs
      .replace(/--force-with-lease(=\S+)?/g, "")
      .replace(/--(force|no-verify|set-upstream|tags|delete|dry-run|verbose|quiet)/g, "")
      .replace(/-[funtdvq]/g, "")
      .replace(/--push-option=\S+/g, "")
      .replace(/-o\s+\S+/g, "")
      .trim();

    const positional = stripped.split(/\s+/).filter(Boolean);

    if (positional.length === 0) {
      // Bare `git push` — pushes current branch, need to check current branch
      return getCurrentBranch();
    }

    if (positional.length === 1) {
      // `git push origin` — pushes current branch to remote
      return getCurrentBranch();
    }

    if (positional.length >= 2) {
      // `git push origin main` or `git push origin feat:main`
      const refspec = positional[1];
      // Handle refspec format src:dst
      if (refspec.includes(":")) {
        const dst = refspec.split(":")[1];
        return dst || null;
      }
      return refspec;
    }
  }

  return null;
}

/**
 * Get the current git branch name from HEAD.
 */
function getCurrentBranch(): string | null {
  try {
    const proc = Bun.spawnSync(["git", "rev-parse", "--abbrev-ref", "HEAD"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const branch = proc.stdout.toString().trim();
    return branch || null;
  } catch {
    return null;
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────

const chunks: string[] = [];
process.stdin.on("data", (chunk) => chunks.push(chunk.toString()));
process.stdin.on("end", () => {
  try {
    const raw = chunks.join("");
    const input = JSON.parse(raw) as {
      tool_name: string;
      tool_input: Record<string, unknown>;
    };

    const command = (input.tool_input?.command as string) || "";

    // CEO/commander and unset agent (human session) can push to main
    const agent = process.env.HARNESS_AGENT || "";
    const CEO_EXEMPT = ["", "ceo", "commander", "ceo-monitor"];
    if (CEO_EXEMPT.includes(agent)) {
      console.log(raw);
      return;
    }

    // Only inspect commands that contain git push
    if (!command.includes("git push")) {
      console.log(raw);
      return;
    }

    const targetBranch = extractPushTarget(command);

    if (targetBranch && PROTECTED_BRANCHES.includes(targetBranch)) {
      const agentName = process.env.HARNESS_AGENT || "unknown";
      console.error(
        `[BranchEnforcer] Blocked: ${agentName} attempted to push to protected branch '${targetBranch}'. Agents must push to feature branches only.`
      );
      process.exit(2);
    }

    // Also block force-push patterns targeting protected branches
    if (
      PROTECTED_BRANCHES.some(
        (b) =>
          command.includes(`push --force origin ${b}`) ||
          command.includes(`push -f origin ${b}`) ||
          command.includes(`push --force-with-lease origin ${b}`)
      )
    ) {
      const agentName = process.env.HARNESS_AGENT || "unknown";
      console.error(
        `[BranchEnforcer] Blocked: ${agentName} attempted force-push to a protected branch. This is never allowed.`
      );
      process.exit(2);
    }

    console.log(raw);
  } catch {
    console.log(chunks.join(""));
  }
});
