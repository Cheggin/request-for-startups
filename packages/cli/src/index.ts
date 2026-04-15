#!/usr/bin/env bun
/**
 * harness — single entry point for the entire startup harness.
 *
 * Usage: harness <command> [subcommand] [args...]
 *
 * No heavy CLI framework. process.argv parsing like gstack.
 * Fast startup, minimal dependencies, comprehensive commands.
 */

import { COLORS } from "./lib/constants.js";

const { reset, bold, dim, cyan, yellow, green, gray } = COLORS;

// ─── Arg Parsing ────────────────────────────────────────────────────────────

const rawArgs = process.argv.slice(2);
const command = rawArgs[0];
const commandArgs = rawArgs.slice(1);

// ─── Help ───────────────────────────────────────────────────────────────────

function printHelp(): void {
  console.log(`
${bold}${cyan}harness${reset} — single entry point for the startup harness

${bold}Core:${reset}
  ${green}init${reset}                              Run full startup-init flow
  ${green}resume${reset}                            Resume from where we left off
  ${green}status${reset}                            Comprehensive overview

${bold}Agents:${reset}
  ${green}agent list${reset}                        All agents with status
  ${green}agent spawn${reset} <name> [--runtime <runtime>] [prompt]
                                                   Spawn agent in tmux pane
  ${green}agent kill${reset} <name>                 Kill agent pane
  ${green}agent logs${reset} <name>                 Read agent output

${bold}Teams:${reset}
  ${green}team start${reset} <n> <prompt>           Spawn n coordinated agents
  ${green}team grid${reset}                         Create the shared 2x4 agent grid
  ${green}team status${reset}                       Show team members
  ${green}team stop${reset}                         Stop all team members

${bold}Loops:${reset}
  ${green}loop list${reset}                         List all loops
  ${green}loop start${reset} <name>                 Start one loop
  ${green}loop grid${reset}                         Create the shared 2x4 loop grid
  ${green}loop stop${reset} <name>                  Stop one loop
  ${green}loop start-all${reset}                    Start all loops
  ${green}loop stop-all${reset}                     Stop all loops

${bold}Features:${reset}
  ${green}feature list${reset} [--done|--todo|...]  List with counts
  ${green}feature new${reset} <name>                Create feature
  ${green}feature status${reset} <name>             Detailed view
  ${green}feature assign${reset} <name> <agent>     Assign to agent

${bold}Skills:${reset}
  ${green}skill list${reset} [--category <cat>]     List by category
  ${green}skill run${reset} <name>                  Invoke skill
  ${green}skill eval${reset} <name>                 Eval one skill
  ${green}skill eval-all${reset}                    Eval all skills

${bold}Stack:${reset}
  ${green}stack show${reset}                        Current tech stack
  ${green}stack extend${reset} <tool>               Add tool from catalog
  ${green}stack catalog${reset}                     Available tools

${bold}Hooks:${reset}
  ${green}hook list${reset}                         Registered hooks
  ${green}hook test${reset} <name>                  Test a hook

${bold}Evals:${reset}
  ${green}eval static${reset}                       Tier 1: static validation
  ${green}eval e2e${reset}                          Tier 2: E2E tests
  ${green}eval judge${reset}                        Tier 3: LLM judge
  ${green}eval all${reset}                          Run all tiers

${bold}Deploy:${reset}
  ${green}deploy staging${reset}                    Deploy to staging
  ${green}deploy production${reset}                 Deploy to production
  ${green}deploy status${reset}                     Check deployment status

${bold}Updates:${reset}
  ${green}update post${reset}                       Post investor update
  ${green}update history${reset}                    Show recent updates

${dim}Version 0.2.0 — bun run packages/cli/src/index.ts${reset}
`);
}

// ─── Version ────────────────────────────────────────────────────────────────

function printVersion(): void {
  console.log("harness v0.2.0");
}

// ─── Command Routing ────────────────────────────────────────────────────────

async function main(): Promise<void> {
  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "version" || command === "--version" || command === "-v") {
    printVersion();
    return;
  }

  // Dynamic imports to keep startup fast — only load the command that's needed
  switch (command) {
    case "init": {
      const mod = await import("./commands/init.js");
      mod.run(commandArgs);
      break;
    }
    case "resume": {
      const mod = await import("./commands/resume.js");
      mod.run(commandArgs);
      break;
    }
    case "status": {
      const mod = await import("./commands/status.js");
      mod.run(commandArgs);
      break;
    }
    case "agent": {
      const mod = await import("./commands/agent.js");
      mod.run(commandArgs);
      break;
    }
    case "team": {
      const mod = await import("./commands/team.js");
      mod.run(commandArgs);
      break;
    }
    case "loop": {
      const mod = await import("./commands/loop.js");
      mod.run(commandArgs);
      break;
    }
    case "feature": {
      const mod = await import("./commands/feature.js");
      mod.run(commandArgs);
      break;
    }
    case "skill": {
      const mod = await import("./commands/skill.js");
      mod.run(commandArgs);
      break;
    }
    case "stack": {
      const mod = await import("./commands/stack.js");
      mod.run(commandArgs);
      break;
    }
    case "hook": {
      const mod = await import("./commands/hook.js");
      mod.run(commandArgs);
      break;
    }
    case "eval": {
      const mod = await import("./commands/eval.js");
      mod.run(commandArgs);
      break;
    }
    case "deploy": {
      const mod = await import("./commands/deploy.js");
      mod.run(commandArgs);
      break;
    }
    case "update": {
      const mod = await import("./commands/update.js");
      mod.run(commandArgs);
      break;
    }
    default:
      console.log(`${yellow}Unknown command: ${command}${reset}`);
      console.log(`${dim}Run 'harness help' for available commands.${reset}`);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(`${COLORS.red}Fatal error: ${err.message}${COLORS.reset}`);
  process.exit(1);
});
