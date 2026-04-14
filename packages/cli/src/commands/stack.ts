/**
 * harness stack — manage the tech stack.
 *
 * Subcommands:
 *   show              — current stack from stacks.yml
 *   extend <tool>     — add tool from catalog, install deps, configure
 *   catalog           — show all available tools from tool-catalog.yml
 */

import { loadStacks, loadToolCatalog } from "../lib/config.js";
import { heading, subheading, table, success, error, muted, info, warn } from "../lib/format.js";
import { execSync } from "child_process";
import { ROOT_DIR } from "../lib/constants.js";

export function run(args: string[]): void {
  const sub = args[0];
  switch (sub) {
    case "show":
      return stackShow();
    case "extend":
      return stackExtend(args.slice(1));
    case "catalog":
      return stackCatalog();
    default:
      console.log(heading("harness stack"));
      console.log("  Usage:");
      console.log("    harness stack show           — current tech stack");
      console.log("    harness stack extend <tool>   — add tool from catalog");
      console.log("    harness stack catalog         — show available tools");
      console.log();
  }
}

function stackShow(): void {
  console.log(heading("harness stack show"));

  const stacks = loadStacks();
  if (Object.keys(stacks).length === 0) {
    console.log(muted("  No stacks.yml found. Run 'harness init' first."));
    return;
  }

  for (const [section, config] of Object.entries(stacks)) {
    console.log(`  ${subheading(section)}:`);
    if (typeof config === "object" && config !== null) {
      for (const [key, value] of Object.entries(config as Record<string, unknown>)) {
        const display = value === null ? muted("not set") : String(value);
        console.log(`    ${key}: ${display}`);
      }
    } else {
      console.log(`    ${String(config)}`);
    }
    console.log();
  }
}

function stackExtend(args: string[]): void {
  const toolName = args[0];
  if (!toolName) {
    console.log(error("  Usage: harness stack extend <tool>"));
    console.log(muted("  Run 'harness stack catalog' to see available tools."));
    return;
  }

  const catalog = loadToolCatalog();

  // Search for the tool across all categories
  let found: Record<string, unknown> | null = null;
  let foundCategory = "";
  let foundName = "";

  for (const [category, tools] of Object.entries(catalog)) {
    if (typeof tools === "object" && tools !== null) {
      for (const [name, config] of Object.entries(tools as Record<string, unknown>)) {
        if (name === toolName || name.includes(toolName)) {
          found = config as Record<string, unknown>;
          foundCategory = category;
          foundName = name;
          break;
        }
      }
    }
    if (found) break;
  }

  if (!found) {
    console.log(error(`  Tool '${toolName}' not found in catalog.`));
    console.log(muted("  Run 'harness stack catalog' to see available tools."));
    return;
  }

  console.log(heading(`harness stack extend: ${foundName}`));
  console.log(`  Category:    ${foundCategory}`);
  console.log(`  Description: ${found.description ?? "N/A"}`);
  console.log(`  Package:     ${found.package ?? muted("N/A (SaaS)")}`);
  console.log();

  // Show required env vars
  const envVars = found.env_vars as string[] | undefined;
  if (envVars && envVars.length > 0) {
    console.log(warn("  Required environment variables:"));
    for (const v of envVars) {
      console.log(`    - ${v}`);
    }
    console.log();
  }

  // Run setup command if available
  const setup = found.setup as string | undefined;
  if (setup) {
    console.log(info(`  Running: ${setup}`));
    try {
      execSync(`cd ${ROOT_DIR} && ${setup}`, { stdio: "inherit", timeout: 60000 });
      console.log(success("  Setup complete."));
    } catch {
      console.log(error("  Setup failed. Run manually: " + setup));
    }
  }

  // Show docs link
  if (found.docs) {
    console.log(muted(`  Docs: ${found.docs}`));
  }
}

function stackCatalog(): void {
  console.log(heading("harness stack catalog"));

  const catalog = loadToolCatalog();
  if (Object.keys(catalog).length === 0) {
    console.log(muted("  No tool-catalog.yml found."));
    return;
  }

  for (const [category, tools] of Object.entries(catalog)) {
    if (typeof tools !== "object" || tools === null) continue;

    console.log(`  ${info(category)}:`);
    for (const [name, config] of Object.entries(tools as Record<string, unknown>)) {
      const c = config as Record<string, unknown>;
      const desc = (c.description as string) ?? "";
      const pkg = (c.package as string) ?? "SaaS";
      console.log(`    ${name.padEnd(18)} ${desc.slice(0, 50).padEnd(52)} [${pkg}]`);
    }
    console.log();
  }
}
