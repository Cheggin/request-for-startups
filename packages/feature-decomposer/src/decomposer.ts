/**
 * Parses a product-spec.md file, extracts features, generates feature checklist
 * files, and creates GitHub Issues via the github-state package.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { createIssue, searchIssues, updateIssue } from "../../github-state/src/index.js";
import type { CreateIssueOptions } from "../../github-state/src/index.js";
import { topologicalSort, type FeatureNode } from "./dependency-graph.js";

export interface ParsedFeature {
  name: string;
  description: string;
  userStory: string;
  priority: "P0" | "P1" | "P2";
  category: "frontend" | "backend" | "fullstack";
  size: "S" | "M" | "L";
  acceptanceCriteria: string[];
  dependencies: string[];
}

export interface DecomposeOptions {
  /** Path to the product-spec.md file */
  specPath: string;
  /** Directory to write feature checklist files into */
  featuresDir: string;
  /** Whether to create GitHub Issues */
  createIssues?: boolean;
  /** Milestone mapping for GitHub */
  milestones?: Record<string, number>;
}

export interface DecomposeResult {
  features: ParsedFeature[];
  orderedFeatures: ParsedFeature[];
  files: string[];
  issueNumbers: number[];
}

/**
 * Parse the features section from a product spec markdown string.
 */
export function parseFeatures(specContent: string): ParsedFeature[] {
  const features: ParsedFeature[] = [];

  // Find the Features section
  const featuresMatch = specContent.match(
    /###?\s+\d*\.?\s*Features\s*\n([\s\S]*?)(?=\n###?\s+\d*\.?\s*[A-Z]|\n## |\n# |$)/i
  );

  if (!featuresMatch) return features;

  const featuresBlock = featuresMatch[1];

  // Split by feature headings (#### or **Feature name**)
  const featureBlocks = featuresBlock.split(
    /\n(?=####\s|\*\*[A-Z])/
  );

  for (const block of featureBlocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const feature = parseFeatureBlock(trimmed);
    if (feature) features.push(feature);
  }

  return features;
}

/**
 * Parse a single feature block into a ParsedFeature.
 */
export function parseFeatureBlock(block: string): ParsedFeature | null {
  // Extract name from heading
  const nameMatch = block.match(/^(?:####\s+|\*\*)(.+?)(?:\*\*)?$/m);
  if (!nameMatch) return null;

  const name = nameMatch[1].replace(/\*\*/g, "").trim();

  // Strip bold markers for easier parsing
  const clean = block.replace(/\*\*/g, "");

  // Extract description
  const descMatch = clean.match(
    /(?:description|desc)[:\s]*(.+)/i
  );
  const description = descMatch ? descMatch[1].trim() : "";

  // Extract user story
  const storyMatch = clean.match(
    /(?:user story|story)[:\s]*(As a .+)/i
  );
  const userStory = storyMatch ? storyMatch[1].trim() : "";

  // Extract priority
  const priorityMatch = clean.match(/(?:priority)[:\s]*(P[012])/i);
  const priority = (priorityMatch ? priorityMatch[1] : "P1") as
    | "P0"
    | "P1"
    | "P2";

  // Extract category
  const categoryMatch = clean.match(
    /(?:category)[:\s]*(frontend|backend|fullstack)/i
  );
  const category = (
    categoryMatch ? categoryMatch[1].toLowerCase() : "fullstack"
  ) as "frontend" | "backend" | "fullstack";

  // Extract size
  const sizeMatch = clean.match(/(?:size(?:\s+estimate)?)[:\s]*(S|M|L)/i);
  const size = (sizeMatch ? sizeMatch[1].toUpperCase() : "M") as
    | "S"
    | "M"
    | "L";

  // Extract acceptance criteria
  const acceptanceCriteria: string[] = [];
  const acSection = clean.match(
    /(?:acceptance criteria|criteria)[:\s]*\n([\s\S]*?)(?=\n-\s*(?:dependencies|depends on)|$)/i
  );
  if (acSection) {
    const lines = acSection[1].split("\n");
    for (const line of lines) {
      const trimmedLine = line.replace(/^\s*[-*]\s*/, "").trim();
      if (trimmedLine && trimmedLine.length > 5) {
        acceptanceCriteria.push(trimmedLine);
      }
    }
  }

  // Extract dependencies
  const dependencies: string[] = [];
  const depMatch = clean.match(
    /(?:dependencies|depends on)[:\s]*(.+)/i
  );
  if (depMatch) {
    const depStr = depMatch[1].trim();
    if (depStr.toLowerCase() !== "none" && depStr !== "-") {
      const deps = depStr.split(/[,;]/).map((d) => d.trim()).filter(Boolean);
      dependencies.push(...deps);
    }
  }

  return {
    name,
    description,
    userStory,
    priority,
    category,
    size,
    acceptanceCriteria,
    dependencies,
  };
}

/**
 * Convert a feature name to kebab-case for file naming.
 */
export function toKebabCase(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Generate a markdown checklist file for a feature.
 */
export function generateFeatureChecklist(
  feature: ParsedFeature,
  orderedIndex: number,
  totalFeatures: number
): string {
  const lines: string[] = [];

  lines.push(`# ${feature.name}`);
  lines.push("");
  lines.push(`**Priority:** ${feature.priority}`);
  lines.push(`**Category:** ${feature.category}`);
  lines.push(`**Size:** ${feature.size}`);
  lines.push(`**Order:** ${orderedIndex + 1} of ${totalFeatures}`);
  lines.push("");

  if (feature.description) {
    lines.push("## Description");
    lines.push("");
    lines.push(feature.description);
    lines.push("");
  }

  if (feature.userStory) {
    lines.push("## User Story");
    lines.push("");
    lines.push(feature.userStory);
    lines.push("");
  }

  if (feature.dependencies.length > 0) {
    lines.push("## Dependencies");
    lines.push("");
    for (const dep of feature.dependencies) {
      lines.push(`- ${dep}`);
    }
    lines.push("");
  }

  lines.push("## Checklist");
  lines.push("");

  // Generate granular checklist items from acceptance criteria
  if (feature.acceptanceCriteria.length > 0) {
    for (const criterion of feature.acceptanceCriteria) {
      lines.push(`- [ ] ${criterion}`);
    }
  } else {
    // Fallback: generate basic checklist items based on category
    if (
      feature.category === "backend" ||
      feature.category === "fullstack"
    ) {
      lines.push("- [ ] Define data model / schema");
      lines.push("- [ ] Implement API route / Convex function");
      lines.push("- [ ] Add input validation");
      lines.push("- [ ] Write unit tests");
    }
    if (
      feature.category === "frontend" ||
      feature.category === "fullstack"
    ) {
      lines.push("- [ ] Build UI component");
      lines.push("- [ ] Connect to API / data layer");
      lines.push("- [ ] Handle loading and error states");
      lines.push("- [ ] Write component tests");
    }
  }

  lines.push("");
  lines.push("## Acceptance Criteria");
  lines.push("");
  if (feature.acceptanceCriteria.length > 0) {
    for (const criterion of feature.acceptanceCriteria) {
      lines.push(`- ${criterion}`);
    }
  } else {
    lines.push("- No acceptance criteria defined in spec");
  }

  lines.push("");
  return lines.join("\n");
}

/**
 * Build the GitHub Issue body for a feature.
 */
export function buildIssueBody(
  feature: ParsedFeature,
  orderedIndex: number,
  totalFeatures: number
): string {
  const lines: string[] = [];

  lines.push(`## ${feature.name}`);
  lines.push("");
  lines.push(`**Priority:** ${feature.priority} | **Category:** ${feature.category} | **Size:** ${feature.size} | **Order:** ${orderedIndex + 1}/${totalFeatures}`);
  lines.push("");

  if (feature.description) {
    lines.push(feature.description);
    lines.push("");
  }

  if (feature.userStory) {
    lines.push(`> ${feature.userStory}`);
    lines.push("");
  }

  if (feature.dependencies.length > 0) {
    lines.push("### Dependencies");
    for (const dep of feature.dependencies) {
      lines.push(`- ${dep}`);
    }
    lines.push("");
  }

  lines.push("### Acceptance Criteria");
  lines.push("");
  if (feature.acceptanceCriteria.length > 0) {
    for (const criterion of feature.acceptanceCriteria) {
      lines.push(`- [ ] ${criterion}`);
    }
  } else {
    lines.push("- [ ] Feature implemented and functional");
  }

  lines.push("");
  return lines.join("\n");
}

/**
 * Build issue labels from a feature's metadata.
 */
export function buildIssueLabels(feature: ParsedFeature): string[] {
  const labels: string[] = [];
  labels.push(feature.priority.toLowerCase());
  labels.push(feature.category);
  labels.push(`size-${feature.size.toLowerCase()}`);
  labels.push("feature");
  return labels;
}

/**
 * Decompose a product spec into individual features, generate files and optionally issues.
 */
export async function decompose(
  opts: DecomposeOptions
): Promise<DecomposeResult> {
  const specContent = await readFile(opts.specPath, "utf-8");
  const features = parseFeatures(specContent);

  if (features.length === 0) {
    throw new Error(
      "No features found in spec. Ensure the spec has a '## Features' or '### Features' section."
    );
  }

  // Build FeatureNode array for dependency ordering
  const featureNodes: FeatureNode[] = features.map((f) => ({
    name: f.name,
    dependencies: f.dependencies,
    priority: f.priority,
    category: f.category,
    size: f.size,
  }));

  const orderedNodes = topologicalSort(featureNodes);

  // Map ordered nodes back to ParsedFeatures
  const featureMap = new Map<string, ParsedFeature>();
  for (const f of features) {
    featureMap.set(f.name, f);
  }
  const orderedFeatures = orderedNodes.map((n) => featureMap.get(n.name)!);

  // Create features directory
  await mkdir(opts.featuresDir, { recursive: true });

  // Generate feature checklist files
  const files: string[] = [];
  for (let i = 0; i < orderedFeatures.length; i++) {
    const feature = orderedFeatures[i];
    const fileName = `${toKebabCase(feature.name)}.md`;
    const filePath = join(opts.featuresDir, fileName);
    const content = generateFeatureChecklist(
      feature,
      i,
      orderedFeatures.length
    );
    await writeFile(filePath, content, "utf-8");
    files.push(filePath);
  }

  // Create GitHub Issues if requested
  const issueNumbers: number[] = [];
  if (opts.createIssues) {
    // Search for existing issues to support idempotency
    const existingIssues = await searchIssues({
      labels: ["feature"],
      state: "all",
      limit: 500,
    });
    const existingTitles = new Map<string, number>();
    for (const issue of existingIssues) {
      existingTitles.set(issue.title, issue.number);
    }

    for (let i = 0; i < orderedFeatures.length; i++) {
      const feature = orderedFeatures[i];
      const issueTitle = `[${feature.priority}] ${feature.name}`;
      const body = buildIssueBody(feature, i, orderedFeatures.length);
      const labels = buildIssueLabels(feature);

      // Check if issue already exists (idempotency)
      const existingNumber = existingTitles.get(issueTitle);
      if (existingNumber) {
        await updateIssue(existingNumber, { body, addLabels: labels });
        issueNumbers.push(existingNumber);
      } else {
        const issue = await createIssue({
          title: issueTitle,
          body,
          labels,
        });
        issueNumbers.push(issue.number);
      }
    }
  }

  return {
    features,
    orderedFeatures,
    files,
    issueNumbers,
  };
}
