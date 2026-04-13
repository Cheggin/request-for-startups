#!/usr/bin/env bun
/**
 * CLI: Run static validation on all SKILL.md files.
 */

import * as path from "path";
import { validateAllSkills, formatResults } from "./static-validator";

const projectRoot = path.resolve(import.meta.dir, "..", "..", "..");
const skillsDir = path.join(projectRoot, "skills");

console.error(`Scanning for SKILL.md files in: ${skillsDir}\n`);

const results = validateAllSkills(skillsDir);

if (results.length === 0) {
  console.error("No SKILL.md files found. Static validation skipped.");
  process.exit(0);
}

console.log(formatResults(results));

const hasErrors = results.some((r) => !r.valid);
process.exit(hasErrors ? 1 : 0);
