/**
 * Generates a product spec from a startup idea, research report, and tech stacks config.
 * Uses `claude -p --dangerously-skip-permissions` for Opus-level planning.
 */

import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { detectStartupType, getTemplate, type StartupType } from "./templates.js";

export interface GenerateSpecOptions {
  /** The startup idea description */
  idea: string;
  /** Path to the research report markdown file */
  researchReportPath: string;
  /** Path to the stacks.yml configuration file */
  stacksYmlPath: string;
  /** Override detected startup type */
  startupType?: StartupType;
  /** Output path for the product-spec.md (default: product-spec.md in cwd) */
  outputPath?: string;
}

export interface SpecSection {
  title: string;
  content: string;
}

export interface ProductSpec {
  raw: string;
  sections: SpecSection[];
}

/**
 * Build the prompt for Claude to generate a product spec.
 */
export function buildSpecPrompt(opts: {
  idea: string;
  researchReport: string;
  stacksYml: string;
  startupType: StartupType;
}): string {
  const template = getTemplate(opts.startupType);

  return `${template.systemPrompt}

You are generating a comprehensive product specification for a startup. The spec is the single source of truth that drives all downstream work: design, test generation, implementation, and QA.

## Startup Idea
${opts.idea}

## Research Report
${opts.researchReport}

## Tech Stack Configuration
${opts.stacksYml}

## Template Context (${template.label})
Default pages to consider: ${template.defaultPages.join(", ")}
Common data models: ${template.commonModels.join(", ")}
Common user flows: ${template.commonFlows.join(", ")}

## Output Requirements

Generate a structured product-spec.md with the following sections. Use the exact heading format shown:

### 1. Pages
For each page, provide:
- **Page name** and purpose
- **Priority**: P0 (MVP), P1 (launch), P2 (post-launch)
- **Key components** on the page

### 2. Features
For each feature, provide:
- **Feature name** and description
- **User story**: As a [role], I want [action] so that [benefit]
- **Priority**: P0 / P1 / P2
- **Category**: frontend / backend / fullstack
- **Size estimate**: S / M / L
- **Acceptance criteria** in Given/When/Then format. Each criterion must be specific and testable.
- **Dependencies**: list any features this depends on

### 3. Data Models
For each entity, provide:
- **Entity name**
- **Fields**: name, type (use Convex-compatible types: string, number, boolean, Id<"tableName">, array, object), required/optional
- **Relationships**: references to other entities
- **Constraints**: unique fields, validation rules

### 4. API Routes
For each endpoint, provide:
- **Route**: method + path (map to Next.js API routes or Convex functions)
- **Description**
- **Auth**: required / optional / none
- **Input schema**: field names and types
- **Output schema**: field names and types
- **Errors**: possible error codes

### 5. User Flows
For each flow, provide:
- **Flow name**
- **Steps**: numbered step-by-step with page transitions
- **Happy path** and **error states**
- Concrete enough to generate Playwright e2e tests

### 6. Dependency Map
A list showing which features depend on which other features, suitable for topological sorting.

## Rules
- Every page must have at least one feature. No orphan pages.
- Every data model must be referenced by at least one API route. No orphan models.
- Every feature must have at least one acceptance criterion.
- Acceptance criteria must be specific — "works correctly" is NOT acceptable.
- P0 features define the MVP. P1 is launch. P2 is post-launch.
- Data model types must be Convex-compatible.
- API routes must map to Next.js API routes or Convex functions.

Output ONLY the markdown spec. No preamble, no explanation outside the spec.`;
}

/**
 * Parse a product spec markdown string into sections.
 */
export function parseSpecSections(raw: string): SpecSection[] {
  const sections: SpecSection[] = [];
  const lines = raw.split("\n");
  let currentTitle = "";
  let currentContent: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^###?\s+\d*\.?\s*(.+)/);
    if (headingMatch) {
      if (currentTitle) {
        sections.push({
          title: currentTitle,
          content: currentContent.join("\n").trim(),
        });
      }
      currentTitle = headingMatch[1].trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  if (currentTitle) {
    sections.push({
      title: currentTitle,
      content: currentContent.join("\n").trim(),
    });
  }

  return sections;
}

/**
 * Validate a product spec for completeness.
 * Returns a list of validation warnings (empty = valid).
 */
export function validateSpec(sections: SpecSection[]): string[] {
  const warnings: string[] = [];

  const sectionNames = sections.map((s) => s.title.toLowerCase());

  const requiredSections = [
    "pages",
    "features",
    "data models",
    "api routes",
    "user flows",
    "dependency map",
  ];

  for (const required of requiredSections) {
    if (!sectionNames.some((name) => name.includes(required))) {
      warnings.push(`Missing required section: ${required}`);
    }
  }

  const featuresSection = sections.find((s) =>
    s.title.toLowerCase().includes("features")
  );
  if (featuresSection) {
    const hasGivenWhenThen =
      featuresSection.content.includes("Given") &&
      featuresSection.content.includes("When") &&
      featuresSection.content.includes("Then");
    if (!hasGivenWhenThen) {
      warnings.push(
        "Features section may be missing Given/When/Then acceptance criteria"
      );
    }
  }

  return warnings;
}

/**
 * Execute `claude -p --dangerously-skip-permissions` with the given prompt.
 */
export async function execClaude(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      "claude",
      ["-p", "--dangerously-skip-permissions"],
      { maxBuffer: 50 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error && (error as NodeJS.ErrnoException).code === "ENOENT") {
          reject(
            new Error(
              "claude CLI not found. Install it from https://docs.anthropic.com/claude-cli"
            )
          );
          return;
        }
        if (error) {
          reject(
            new Error(
              `claude CLI failed: ${stderr || error.message}`
            )
          );
          return;
        }
        resolve(stdout ?? "");
      }
    );
    child.stdin?.write(prompt);
    child.stdin?.end();
  });
}

/**
 * Generate a product spec from a startup idea, research report, and stacks config.
 */
export async function generateSpec(
  opts: GenerateSpecOptions
): Promise<ProductSpec> {
  const [researchReport, stacksYml] = await Promise.all([
    readFile(opts.researchReportPath, "utf-8"),
    readFile(opts.stacksYmlPath, "utf-8"),
  ]);

  const startupType = opts.startupType ?? detectStartupType(opts.idea);

  const prompt = buildSpecPrompt({
    idea: opts.idea,
    researchReport,
    stacksYml,
    startupType,
  });

  const raw = await execClaude(prompt);
  const sections = parseSpecSections(raw);
  const warnings = validateSpec(sections);

  if (warnings.length > 0) {
    console.warn("Spec validation warnings:");
    for (const w of warnings) {
      console.warn(`  - ${w}`);
    }
  }

  return { raw, sections };
}
