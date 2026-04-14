/**
 * Research brief generator (OMC si-researcher pattern).
 * Reads prior research, reads ledger, avoids repeating failures,
 * produces structured brief with ranked ideas.
 */
import { listPages, queryPages } from "./wiki";
import { readHistory } from "./ledger";
import type { Category, ConfidenceLevel } from "./constants";
import type { ExperimentRecord } from "./ledger";
import type { PageSummary } from "./wiki";

export interface BriefIdea {
  title: string;
  source: string;
  evidence: string;
  confidence: ConfidenceLevel;
  estimated_impact: string;
}

export interface ResearchBrief {
  category: Category;
  goal: string;
  prior_findings_summary: string;
  ideas: BriefIdea[];
}

export interface GenerateBriefInput {
  category: Category;
  goal: string;
  history?: ExperimentRecord[];
}

function summarizePages(pages: PageSummary[]): string {
  if (pages.length === 0) return "No prior research found in this category.";
  const lines: string[] = [];
  lines.push("Found " + pages.length + " prior research page(s):");
  for (const page of pages.slice(0, 10)) {
    const tags = page.tags.length > 0 ? " [" + page.tags.join(", ") + "]" : "";
    lines.push("- " + page.title + tags + " (confidence: " + page.confidence + ")");
  }
  if (pages.length > 10) lines.push("... and " + (pages.length - 10) + " more");
  return lines.join("\n");
}

function summarizeExperiments(records: ExperimentRecord[]): string {
  if (records.length === 0) return "No prior experiments in ledger.";
  const wins = records.filter((r) => r.status === "keep");
  const losses = records.filter((r) => r.status === "discard");
  const crashes = records.filter((r) => r.status === "crash");
  const lines: string[] = [];
  lines.push("Ledger: " + records.length + " total experiment(s) (" + wins.length + " kept, " + losses.length + " discarded, " + crashes.length + " crashed)");
  if (wins.length > 0) {
    lines.push("\nSuccessful experiments:");
    for (const w of wins.slice(0, 5)) lines.push("  + " + w.experiment_description + " (" + w.metric + ": " + w.result + ")");
  }
  if (losses.length > 0) {
    lines.push("\nFailed experiments (avoid repeating):");
    for (const l of losses.slice(0, 5)) lines.push("  - " + l.experiment_description + " (" + l.metric + ": " + l.result + ")");
  }
  if (crashes.length > 0) {
    lines.push("\nCrashed experiments:");
    for (const c of crashes.slice(0, 3)) lines.push("  x " + c.experiment_description);
  }
  return lines.join("\n");
}

function identifyGaps(pages: PageSummary[], records: ExperimentRecord[], category: Category): string[] {
  const gaps: string[] = [];
  if (pages.length === 0) gaps.push("No prior research exists -- broad exploration recommended");
  const lowConfPages = pages.filter((p) => p.confidence < 0.4);
  if (lowConfPages.length > 0) gaps.push(lowConfPages.length + " page(s) have low confidence -- may need validation");
  const categoryRecords = records.filter((r) => r.category === category);
  if (categoryRecords.filter((r) => r.status === "discard").slice(-3).length >= 3) {
    gaps.push("Multiple recent failures -- consider shifting approach or exploring adjacent categories");
  }
  if (categoryRecords.length === 0) gaps.push("No experiments have been run in this category yet");
  return gaps;
}

export function generateBrief(projectRoot: string, input: GenerateBriefInput): ResearchBrief {
  const { category, goal } = input;
  const pages = listPages(projectRoot, category);
  const pagesSummary = summarizePages(pages);
  const allHistory = input.history ?? readHistory(projectRoot);
  const categoryHistory = allHistory.filter((r) => r.category === category);
  const experimentsSummary = summarizeExperiments(categoryHistory);
  const gaps = identifyGaps(pages, allHistory, category);
  const priorFindings = [
    pagesSummary, "",
    experimentsSummary, "",
    gaps.length > 0 ? "Knowledge gaps:\n" + gaps.map((g) => "- " + g).join("\n") : "No obvious gaps identified.",
  ].join("\n");

  const relatedResults = queryPages(projectRoot, goal);
  const crossCategoryFindings = relatedResults.filter((r) => r.page.category !== category).slice(0, 5);

  const ideas: BriefIdea[] = [];
  if (pages.length === 0) {
    ideas.push({
      title: "Initial " + category + " research survey",
      source: "gap-analysis",
      evidence: "No prior research in " + category + ". Broad survey needed to establish baseline knowledge.",
      confidence: "high",
      estimated_impact: "foundational -- enables all future work in this category",
    });
  }
  for (const finding of crossCategoryFindings) {
    ideas.push({
      title: "Apply " + finding.page.category + " insight: " + finding.page.title,
      source: "cross-reference from " + finding.page.category + "/" + finding.page.slug,
      evidence: finding.snippets.length > 0 ? finding.snippets[0] : "Related page with confidence " + finding.page.confidence,
      confidence: finding.page.confidence >= 0.7 ? "medium" : "low",
      estimated_impact: "unknown -- requires investigation",
    });
  }
  const lowConf = pages.filter((p) => p.confidence < 0.4);
  for (const page of lowConf.slice(0, 2)) {
    ideas.push({
      title: "Validate: " + page.title,
      source: category + "/" + page.slug,
      evidence: "Page has confidence " + page.confidence + " -- needs validation or update",
      confidence: "medium",
      estimated_impact: "improves knowledge reliability",
    });
  }
  const failures = categoryHistory.filter((r) => r.status === "discard" || r.status === "crash");
  if (failures.length > 0) {
    ideas.push({
      title: "Differentiated approach (avoid prior failures)",
      source: "ledger-analysis",
      evidence: failures.length + " prior failure(s): " + failures.slice(0, 3).map((f) => f.experiment_description).join("; "),
      confidence: "high",
      estimated_impact: "prevents wasted effort by avoiding documented failure modes",
    });
  }
  const confidenceOrder: Record<ConfidenceLevel, number> = { high: 0, medium: 1, low: 2 };
  ideas.sort((a, b) => confidenceOrder[a.confidence] - confidenceOrder[b.confidence]);
  return { category, goal, prior_findings_summary: priorFindings, ideas };
}
