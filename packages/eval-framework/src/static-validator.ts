/**
 * Static validator for SKILL.md files.
 *
 * Parses YAML frontmatter and validates:
 * - Frontmatter exists and has required fields (name, description, category)
 * - All tool names referenced exist in a known tool registry
 * - No broken cross-references to other skills
 * - Checklist items are properly formatted
 */

import * as fs from "fs";
import * as path from "path";

// --- Constants ---

const REQUIRED_FRONTMATTER_FIELDS = ["name", "description", "category"] as const;

/**
 * Known tool registry. Tools that can be referenced in allowed-tools
 * or mentioned in skill body. Extensible via addKnownTools().
 */
const DEFAULT_KNOWN_TOOLS = new Set([
  "Bash",
  "Read",
  "Write",
  "Edit",
  "Grep",
  "Glob",
  "Agent",
  "AskUserQuestion",
  "WebSearch",
  "WebFetch",
  "TodoRead",
  "TodoWrite",
  "Skill",
  "Monitor",
  "ToolSearch",
  "NotebookEdit",
]);

// --- Interfaces ---

export interface Frontmatter {
  name?: string;
  description?: string;
  category?: string;
  version?: string;
  "allowed-tools"?: string[];
  "preamble-tier"?: number;
  [key: string]: unknown;
}

export interface ValidationIssue {
  severity: "error" | "warning";
  rule: string;
  message: string;
  line?: number;
}

export interface ValidationResult {
  file: string;
  valid: boolean;
  issues: ValidationIssue[];
  frontmatter: Frontmatter | null;
}

// --- Frontmatter parsing ---

/**
 * Extract YAML frontmatter from a markdown string.
 * Returns null if no frontmatter block is found.
 *
 * Parses a simplified YAML subset (key: value, key: |, lists).
 * Does not depend on external YAML libraries.
 */
export function parseFrontmatter(content: string): Frontmatter | null {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const yaml = match[1];
  const result: Frontmatter = {};
  let currentKey: string | null = null;
  let multilineValue = "";
  let inMultiline = false;

  for (const line of yaml.split("\n")) {
    // Multiline scalar (folded with |)
    if (inMultiline) {
      if (line.match(/^\s{2,}/) || line.trim() === "") {
        multilineValue += (multilineValue ? "\n" : "") + line.trimStart();
        continue;
      } else {
        // End of multiline
        if (currentKey) result[currentKey] = multilineValue.trim();
        inMultiline = false;
        multilineValue = "";
        currentKey = null;
      }
    }

    // List item (  - value)
    if (line.match(/^\s+-\s+/) && currentKey) {
      const item = line.replace(/^\s+-\s+/, "").trim();
      if (!Array.isArray(result[currentKey])) {
        result[currentKey] = [];
      }
      (result[currentKey] as string[]).push(item);
      continue;
    }

    // Key: value
    const kvMatch = line.match(/^([a-zA-Z_-]+):\s*(.*)/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      const value = kvMatch[2].trim();

      if (value === "|" || value === ">") {
        inMultiline = true;
        multilineValue = "";
      } else if (value === "") {
        // Could be start of a list or multiline
        result[currentKey] = "";
      } else {
        // Strip surrounding quotes
        result[currentKey] = value.replace(/^["']|["']$/g, "");
      }
    }
  }

  // Flush any trailing multiline
  if (inMultiline && currentKey) {
    result[currentKey] = multilineValue.trim();
  }

  return result;
}

/**
 * Get the line number where frontmatter ends (the closing ---).
 */
function getFrontmatterEndLine(content: string): number {
  const lines = content.split("\n");
  let inFrontmatter = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      if (inFrontmatter) return i + 1;
      inFrontmatter = true;
    }
  }
  return 0;
}

// --- Validation rules ---

/**
 * Validate that required frontmatter fields are present.
 */
function validateRequiredFields(
  frontmatter: Frontmatter,
  issues: ValidationIssue[],
): void {
  for (const field of REQUIRED_FRONTMATTER_FIELDS) {
    const value = frontmatter[field];
    if (value === undefined || value === null || value === "") {
      issues.push({
        severity: "error",
        rule: "required-field",
        message: `Missing required frontmatter field: "${field}"`,
      });
    }
  }
}

/**
 * Validate that the name field follows naming conventions.
 */
function validateName(
  frontmatter: Frontmatter,
  issues: ValidationIssue[],
): void {
  const name = frontmatter.name;
  if (typeof name !== "string") return;

  if (name.length > 64) {
    issues.push({
      severity: "error",
      rule: "name-length",
      message: `Skill name exceeds 64 characters: "${name}" (${name.length} chars)`,
    });
  }

  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    issues.push({
      severity: "warning",
      rule: "name-format",
      message: `Skill name should be lowercase alphanumeric with hyphens: "${name}"`,
    });
  }

  if (/--/.test(name)) {
    issues.push({
      severity: "warning",
      rule: "name-consecutive-hyphens",
      message: `Skill name contains consecutive hyphens: "${name}"`,
    });
  }
}

/**
 * Validate that allowed-tools references exist in the known tool registry.
 */
function validateTools(
  frontmatter: Frontmatter,
  knownTools: Set<string>,
  issues: ValidationIssue[],
): void {
  const tools = frontmatter["allowed-tools"];
  if (!Array.isArray(tools)) return;

  for (const tool of tools) {
    if (!knownTools.has(tool)) {
      issues.push({
        severity: "error",
        rule: "unknown-tool",
        message: `Unknown tool in allowed-tools: "${tool}". Known tools: ${[...knownTools].sort().join(", ")}`,
      });
    }
  }
}

/**
 * Validate checklist items are properly formatted.
 * Expected format: - [ ] or - [x] followed by text
 */
function validateChecklists(
  content: string,
  issues: ValidationIssue[],
): void {
  const lines = content.split("\n");
  const fmEnd = getFrontmatterEndLine(content);

  for (let i = fmEnd; i < lines.length; i++) {
    const line = lines[i];

    // Match lines that look like checklist items but may be malformed
    if (line.match(/^\s*-\s*\[/) && !line.match(/^\s*-\s*\[(x|\s)\]\s+\S/)) {
      issues.push({
        severity: "warning",
        rule: "checklist-format",
        message: `Malformed checklist item at line ${i + 1}: "${line.trim()}"`,
        line: i + 1,
      });
    }
  }
}

/**
 * Validate cross-references to other skills.
 * Looks for patterns like `/skill-name` or `skill:name` in the body.
 */
function validateCrossReferences(
  content: string,
  availableSkills: Set<string>,
  issues: ValidationIssue[],
): void {
  if (availableSkills.size === 0) return;

  const lines = content.split("\n");
  const fmEnd = getFrontmatterEndLine(content);

  for (let i = fmEnd; i < lines.length; i++) {
    const line = lines[i];

    // Match /skill-name references (slash-command style)
    const slashRefs = line.matchAll(/(?:^|\s)\/([a-z][a-z0-9-]+)/g);
    for (const match of slashRefs) {
      const ref = match[1];
      // Only flag if we have a skills registry and the ref looks like a skill name
      if (
        ref.length > 2 &&
        ref.length <= 64 &&
        !availableSkills.has(ref)
      ) {
        issues.push({
          severity: "warning",
          rule: "cross-reference",
          message: `Possible broken cross-reference to skill "/${ref}" at line ${i + 1}`,
          line: i + 1,
        });
      }
    }
  }
}

// --- Main validation function ---

export interface ValidateOptions {
  /** Additional tools to consider valid beyond the default set */
  extraTools?: string[];
  /** Set of known skill names for cross-reference validation */
  availableSkills?: Set<string>;
  /** Whether to skip cross-reference validation */
  skipCrossRefs?: boolean;
}

/**
 * Validate a SKILL.md file's content.
 */
export function validateSkillContent(
  content: string,
  filePath: string,
  options: ValidateOptions = {},
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const knownTools = new Set(DEFAULT_KNOWN_TOOLS);
  if (options.extraTools) {
    for (const t of options.extraTools) knownTools.add(t);
  }

  // Parse frontmatter
  const frontmatter = parseFrontmatter(content);

  if (!frontmatter) {
    issues.push({
      severity: "error",
      rule: "frontmatter-missing",
      message: "No YAML frontmatter found. SKILL.md must start with --- delimited YAML.",
    });

    return {
      file: filePath,
      valid: false,
      issues,
      frontmatter: null,
    };
  }

  // Run validation rules
  validateRequiredFields(frontmatter, issues);
  validateName(frontmatter, issues);
  validateTools(frontmatter, knownTools, issues);
  validateChecklists(content, issues);

  if (!options.skipCrossRefs) {
    validateCrossReferences(
      content,
      options.availableSkills ?? new Set(),
      issues,
    );
  }

  // Check for empty body (only frontmatter, no content)
  const bodyMatch = content.match(/^---[\s\S]*?---\r?\n([\s\S]*)$/);
  const body = bodyMatch ? bodyMatch[1].trim() : "";
  if (body.length === 0) {
    issues.push({
      severity: "warning",
      rule: "empty-body",
      message: "SKILL.md has no content after frontmatter.",
    });
  }

  const hasErrors = issues.some((i) => i.severity === "error");

  return {
    file: filePath,
    valid: !hasErrors,
    issues,
    frontmatter,
  };
}

/**
 * Validate a SKILL.md file from disk.
 */
export function validateSkillFile(
  filePath: string,
  options: ValidateOptions = {},
): ValidationResult {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return validateSkillContent(content, filePath, options);
  } catch (err: any) {
    return {
      file: filePath,
      valid: false,
      issues: [
        {
          severity: "error",
          rule: "file-read",
          message: `Cannot read file: ${err.message}`,
        },
      ],
      frontmatter: null,
    };
  }
}

/**
 * Discover and validate all SKILL.md files under a directory.
 */
export function validateAllSkills(
  rootDir: string,
  options: ValidateOptions = {},
): ValidationResult[] {
  const results: ValidationResult[] = [];
  const skillFiles: string[] = [];

  // Recursively find SKILL.md files
  function walk(dir: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
        walk(full);
      } else if (entry.isFile() && entry.name === "SKILL.md") {
        skillFiles.push(full);
      }
    }
  }

  walk(rootDir);

  // Build available skills set from discovered files
  const availableSkills = new Set<string>();
  for (const file of skillFiles) {
    try {
      const content = fs.readFileSync(file, "utf-8");
      const fm = parseFrontmatter(content);
      if (fm?.name) availableSkills.add(fm.name);
    } catch {
      // skip
    }
  }

  // Validate each file
  for (const file of skillFiles) {
    results.push(
      validateSkillFile(file, { ...options, availableSkills }),
    );
  }

  return results;
}

/**
 * Format validation results for terminal output.
 */
export function formatResults(results: ValidationResult[]): string {
  const lines: string[] = [];
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const r of results) {
    const errors = r.issues.filter((i) => i.severity === "error");
    const warnings = r.issues.filter((i) => i.severity === "warning");
    totalErrors += errors.length;
    totalWarnings += warnings.length;

    const status = r.valid ? "PASS" : "FAIL";
    lines.push(`  ${status}  ${r.file}`);

    for (const issue of r.issues) {
      const prefix = issue.severity === "error" ? "ERR " : "WARN";
      const loc = issue.line ? `:${issue.line}` : "";
      lines.push(`       ${prefix}  [${issue.rule}${loc}] ${issue.message}`);
    }
  }

  lines.push("");
  lines.push(
    `${results.length} files, ${totalErrors} errors, ${totalWarnings} warnings`,
  );

  return lines.join("\n");
}
