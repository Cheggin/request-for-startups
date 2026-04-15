/**
 * harness hook — manage Claude Code hooks.
 *
 * Subcommands:
 *   list          — show registered hooks from .claude/settings.json
 *   test <name>   — test a specific hook
 */

import { loadClaudeSettings } from "../lib/config.js";
import { heading, table, success, error, muted, info, warn } from "../lib/format.js";
import { execSync } from "child_process";
import { ROOT_DIR } from "../lib/constants.js";

export function run(args: string[]): void {
  const sub = args[0];
  switch (sub) {
    case "list":
      return hookList();
    case "test":
      return hookTest(args.slice(1));
    default:
      console.log(heading("harness hook"));
      console.log("  Usage:");
      console.log("    harness hook list          — show registered hooks");
      console.log("    harness hook test <name>   — test a specific hook");
      console.log();
  }
}

interface HookEntry {
  event: string;
  command: string;
  matcher?: string;
}

function extractHooks(): HookEntry[] {
  const settings = loadClaudeSettings();
  const hooks: HookEntry[] = [];

  // Claude settings.json stores hooks under "hooks" key
  const hooksConfig = settings.hooks as Record<string, unknown[]> | undefined;
  if (!hooksConfig) return hooks;

  for (const [event, entries] of Object.entries(hooksConfig)) {
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      const e = entry as Record<string, unknown>;
      hooks.push({
        event,
        command: String(e.command ?? e.script ?? "unknown"),
        matcher: e.matcher ? String(e.matcher) : undefined,
      });
    }
  }

  return hooks;
}

function hookList(): void {
  console.log(heading("harness hook list"));

  const hooks = extractHooks();

  if (hooks.length === 0) {
    console.log(muted("  No hooks registered in .claude/settings.json."));
    console.log(muted("  Our hooks are in packages/hooks/src/."));
    console.log();

    // Show available hook implementations
    console.log(info("  Available hook implementations:"));
    console.log("    gateguard          — block Edit without prior Read (PreToolUse)");
    console.log("    config-protection  — block modification of infra files (PreToolUse)");
    console.log("    budget-enforcer    — turn limit + wall-clock timeout (PostToolUse)");
    console.log("    inter-agent-signal — write .harness/signals/done or needs-approval");
    console.log();
    return;
  }

  // Group by event
  const grouped = new Map<string, HookEntry[]>();
  for (const hook of hooks) {
    const list = grouped.get(hook.event) ?? [];
    list.push(hook);
    grouped.set(hook.event, list);
  }

  for (const [event, entries] of grouped) {
    console.log(`  ${info(event)}:`);
    for (const entry of entries) {
      const matcher = entry.matcher ? ` [${entry.matcher}]` : "";
      console.log(`    ${entry.command}${muted(matcher)}`);
    }
    console.log();
  }
}

function hookTest(args: string[]): void {
  const name = args[0];
  if (!name) {
    console.log(error("  Usage: harness hook test <name>"));
    console.log(muted("  Available: gateguard, config-protection, budget-enforcer"));
    return;
  }

  console.log(heading(`harness hook test: ${name}`));

  // Map hook names to their test scripts
  const hookTests: Record<string, string> = {
    gateguard: "packages/hooks/src/run-gateguard.ts",
    "config-protection": "packages/hooks/src/run-config-protection.ts",
    "budget-enforcer": "packages/hooks/src/run-budget-enforcer.ts",
  };

  const testScript = hookTests[name];
  if (!testScript) {
    console.log(error(`  Unknown hook: ${name}`));
    console.log(muted(`  Available: ${Object.keys(hookTests).join(", ")}`));
    return;
  }

  // Run the hook's test
  console.log(info(`  Testing ${name} hook...`));

  try {
    // Test with a mock tool call
    const mockInput = JSON.stringify({
      tool_name: name === "gateguard" ? "Edit" : "Write",
      tool_input: { file_path: "tsconfig.json", content: "test" },
    });

    execSync(
      `cd ${ROOT_DIR} && echo '${mockInput}' | bun run ${testScript}`,
      { stdio: "inherit", timeout: 10000 }
    );
    console.log(success("  Hook test passed."));
  } catch {
    console.log(warn("  Hook triggered (blocked or errored) — this may be expected behavior."));
  }
}
