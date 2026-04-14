#!/usr/bin/env bun
/**
 * harness CLI — manage agents, features, skills, and stack.
 *
 * No heavy CLI framework. process.argv parsing, switch/case routing.
 * Karpathy: simplest thing that works.
 */

import { runAgent } from "./commands/agent";
import { runFeature } from "./commands/feature";
import { runSkill } from "./commands/skill";
import { runStack } from "./commands/stack";
import { runStatus } from "./commands/status";

// ---------------------------------------------------------------------------
// Argv parser
// ---------------------------------------------------------------------------

export interface ParsedArgs {
  group: string;
  command: string;
  positional: string[];
  flags: Record<string, string | boolean>;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2); // skip bun/node + script path

  const group = args[0] ?? "";
  const command = args[1] ?? "";
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }

  return { group, command, positional, flags };
}

// ---------------------------------------------------------------------------
// Project root resolution
// ---------------------------------------------------------------------------

export function resolveRoot(): string {
  // Walk up from cwd looking for SOUL.md (project marker)
  let dir = process.cwd();
  while (dir !== "/") {
    if (Bun.file(`${dir}/SOUL.md`).size) return dir;
    dir = dir.substring(0, dir.lastIndexOf("/")) || "/";
  }
  // Fallback: cwd
  return process.cwd();
}

// ---------------------------------------------------------------------------
// Usage
// ---------------------------------------------------------------------------

function printUsage(): void {
  console.log(`harness — CLI for the startup harness

Usage: harness <group> <command> [args] [flags]

Groups:
  agent    Manage agent definitions and running sessions
  feature  Manage feature checklists
  skill    Browse and run skills
  stack    View and extend the tech stack
  status   Overview of the entire harness

Run 'harness <group>' for group-specific help.`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv);

  if (!parsed.group || parsed.group === "help" || parsed.flags["help"]) {
    printUsage();
    process.exit(0);
  }

  const root = resolveRoot();

  switch (parsed.group) {
    case "agent":
      await runAgent(parsed, root);
      break;
    case "feature":
      await runFeature(parsed, root);
      break;
    case "skill":
      await runSkill(parsed, root);
      break;
    case "stack":
      await runStack(parsed, root);
      break;
    case "status":
      await runStatus(parsed, root);
      break;
    default:
      console.error(`Unknown group: ${parsed.group}`);
      printUsage();
      process.exit(1);
  }
}

// Only run main when this file is the entry point (not when imported by tests)
if (import.meta.main) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}
