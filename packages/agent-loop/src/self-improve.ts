/**
 * Self-improvement engine — extracts learnings from agent transcripts,
 * proposes skill updates, and gates changes by confidence + simplification.
 *
 * Karpathy principle: equal performance + simpler = always keep.
 */

import { readFileSync, existsSync } from "fs";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ExtractedLearning {
  /** What was discovered */
  insight: string;
  /** Category: pattern, gotcha, workflow, optimization */
  type: "pattern" | "gotcha" | "workflow" | "optimization";
  /** Files involved */
  relatedFiles: string[];
  /** Confidence 0-1 */
  confidence: number;
  /** Keywords for future retrieval */
  triggers: string[];
}

export interface SkillUpdateProposal {
  /** Path to the skill file */
  skillPath: string;
  /** Section to update (or "new" for append) */
  section: string;
  /** The proposed content change */
  proposedContent: string;
  /** Why this change improves the skill */
  rationale: string;
  /** Confidence 0-1 */
  confidence: number;
  /** Whether this simplifies the skill (fewer steps, fewer words, fewer conditions) */
  isSimplification: boolean;
}

export interface TranscriptAnalysis {
  learnings: ExtractedLearning[];
  totalTurns: number;
  successfulActions: number;
  failedActions: number;
  retriedActions: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

/** Minimum confidence to allow a skill update */
export const SKILL_UPDATE_CONFIDENCE_THRESHOLD = 0.7;

/** Patterns that indicate a reusable learning in transcript text */
export const LEARNING_SIGNAL_PATTERNS = [
  /(?:discovered|found|realized|learned)\s+that\s+(.+)/i,
  /(?:the\s+fix|solution|workaround)\s+(?:was|is)\s+(.+)/i,
  /(?:key\s+insight|takeaway|lesson):\s*(.+)/i,
  /(?:this\s+happens\s+because|root\s+cause):\s*(.+)/i,
  /(?:next\s+time|in\s+the\s+future),?\s+(.+)/i,
  /(?:gotcha|caveat|warning):\s*(.+)/i,
] as const;

/** Patterns that indicate failed or retried actions */
export const FAILURE_PATTERNS = [
  /(?:failed|error|exception|crashed|broke|regression)/i,
  /(?:retry|retrying|retried|attempt\s+\d+)/i,
  /(?:revert|reverted|rolling\s+back|backed\s+out)/i,
] as const;

/** Patterns indicating successful outcomes */
export const SUCCESS_PATTERNS = [
  /(?:tests?\s+pass|all\s+green|verified|confirmed)/i,
  /(?:completed|done|finished|resolved|fixed)/i,
  /(?:deployed|merged|shipped)/i,
] as const;

// ─── Core Functions ─────────────────────────────────────────────────────────

/**
 * Analyze an agent's transcript for reusable patterns.
 *
 * Scans the transcript text for learning signals, failures, successes,
 * and retry patterns. Extracts structured learnings that can be persisted
 * to the knowledge wiki.
 */
export function extractLearnings(transcript: string): TranscriptAnalysis {
  const lines = transcript.split("\n");
  const learnings: ExtractedLearning[] = [];
  let successfulActions = 0;
  let failedActions = 0;
  let retriedActions = 0;

  for (const line of lines) {
    // Count outcomes
    for (const pattern of SUCCESS_PATTERNS) {
      if (pattern.test(line)) {
        successfulActions++;
        break;
      }
    }

    for (const pattern of FAILURE_PATTERNS) {
      if (pattern.test(line)) {
        if (/retry|retrying|retried|attempt/i.test(line)) {
          retriedActions++;
        } else {
          failedActions++;
        }
        break;
      }
    }

    // Extract learnings
    for (const pattern of LEARNING_SIGNAL_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        const insight = match[1].trim();
        if (insight.length < 10) continue; // Skip trivial matches

        // Classify the learning type (use full line for context)
        const type = classifyLearningType(line);

        // Extract file references from surrounding context
        const relatedFiles = extractFileReferences(transcript, line);

        // Confidence based on specificity
        const confidence = computeLearningConfidence(insight, relatedFiles);

        // Generate triggers for future retrieval
        const triggers = generateTriggers(insight);

        learnings.push({
          insight,
          type,
          relatedFiles,
          confidence,
          triggers,
        });
        break; // One learning per line
      }
    }
  }

  // Deduplicate by insight similarity
  const deduplicated = deduplicateLearnings(learnings);

  return {
    learnings: deduplicated,
    totalTurns: lines.length,
    successfulActions,
    failedActions,
    retriedActions,
  };
}

/**
 * Propose an update to a skill file based on a discovered improvement.
 *
 * Reads the current skill, determines where the improvement fits,
 * and produces a structured proposal.
 */
export function proposeSkillUpdate(
  skillPath: string,
  improvement: string,
): SkillUpdateProposal {
  let currentContent = "";
  if (existsSync(skillPath)) {
    currentContent = readFileSync(skillPath, "utf-8");
  }

  // Determine which section the improvement targets
  const section = identifyTargetSection(currentContent, improvement);

  // Check if the improvement simplifies the skill
  const isSimplification = checkIsSimplification(currentContent, improvement);

  // Compute confidence based on specificity and evidence
  const confidence = computeLearningConfidence(improvement, []);

  return {
    skillPath,
    section,
    proposedContent: improvement,
    rationale: `Improvement discovered during agent execution: ${improvement.slice(0, 200)}`,
    confidence,
    isSimplification,
  };
}

/**
 * Decide whether a skill update should be applied.
 *
 * Gates on:
 * 1. Confidence must exceed threshold (0.7)
 * 2. Change must be a simplification (equal perf + simpler = keep)
 * 3. Change must not contradict existing skill content
 *
 * From autoresearch: equal performance + simpler = always keep.
 */
export function shouldUpdateSkill(
  currentSkill: string,
  proposedChange: string,
  confidence: number,
): boolean {
  // Gate 1: Confidence threshold
  if (confidence < SKILL_UPDATE_CONFIDENCE_THRESHOLD) {
    return false;
  }

  // Gate 2: Must be a simplification or clear improvement
  if (!checkIsSimplification(currentSkill, proposedChange)) {
    return false;
  }

  // Gate 3: Must not contradict existing content
  if (detectContradiction(currentSkill, proposedChange)) {
    return false;
  }

  return true;
}

// ─── Internal Helpers ───────────────────────────────────────────────────────

function classifyLearningType(
  insight: string,
): ExtractedLearning["type"] {
  const lower = insight.toLowerCase();

  if (
    lower.includes("gotcha") ||
    lower.includes("caveat") ||
    lower.includes("warning") ||
    lower.includes("careful") ||
    lower.includes("trap")
  ) {
    return "gotcha";
  }

  if (
    lower.includes("step") ||
    lower.includes("first") ||
    lower.includes("then") ||
    lower.includes("workflow") ||
    lower.includes("process")
  ) {
    return "workflow";
  }

  if (
    lower.includes("faster") ||
    lower.includes("simpler") ||
    lower.includes("better") ||
    lower.includes("optimize") ||
    lower.includes("reduce")
  ) {
    return "optimization";
  }

  return "pattern";
}

function extractFileReferences(transcript: string, contextLine: string): string[] {
  const lineIndex = transcript.indexOf(contextLine);
  const start = Math.max(0, lineIndex - 500);
  const end = Math.min(transcript.length, lineIndex + 500);
  const context = transcript.slice(start, end);

  const filePattern = /(?:[\w./\\-]+\.(?:ts|js|tsx|jsx|md|json|yaml|yml))/g;
  const matches = context.match(filePattern) ?? [];
  return [...new Set(matches)].slice(0, 10);
}

function computeLearningConfidence(
  insight: string,
  relatedFiles: string[],
): number {
  let confidence = 0.3; // Base

  // Specificity boosts
  if (insight.length > 50) confidence += 0.1;
  if (insight.length > 100) confidence += 0.1;
  if (relatedFiles.length > 0) confidence += 0.15;
  if (relatedFiles.length > 2) confidence += 0.1;

  // Concrete references boost
  if (/line\s+\d+|:\d+/.test(insight)) confidence += 0.1;
  if (/`[^`]+`/.test(insight)) confidence += 0.05;

  return Math.min(1.0, confidence);
}

function generateTriggers(insight: string): string[] {
  const words = insight
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3);

  // Take unique meaningful words
  const unique = [...new Set(words)];
  return unique.slice(0, 8);
}

function deduplicateLearnings(learnings: ExtractedLearning[]): ExtractedLearning[] {
  const seen = new Set<string>();
  const result: ExtractedLearning[] = [];

  for (const learning of learnings) {
    const key = learning.insight.toLowerCase().slice(0, 80);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(learning);
    }
  }

  return result;
}

function identifyTargetSection(currentContent: string, improvement: string): string {
  const lower = improvement.toLowerCase();

  // Check for section-like references
  const sectionPatterns: Array<[RegExp, string]> = [
    [/anti.?pattern/i, "Anti-Patterns"],
    [/workflow|step|process/i, "Workflow"],
    [/when\s+to\s+use|trigger/i, "When to Use"],
    [/constraint|limitation/i, "Constraints"],
    [/example/i, "Examples"],
  ];

  for (const [pattern, section] of sectionPatterns) {
    if (pattern.test(lower)) {
      // Verify section exists in current content
      if (currentContent.includes(`## ${section}`) || currentContent.includes(`### ${section}`)) {
        return section;
      }
    }
  }

  return "new";
}

/**
 * Check if a proposed change simplifies the skill.
 * Simplification = fewer steps, fewer words, fewer conditions, or
 * consolidation of redundant content.
 */
export function checkIsSimplification(
  currentContent: string,
  proposedChange: string,
): boolean {
  // If no current content, any addition is not a simplification
  if (!currentContent.trim()) {
    return false;
  }

  const currentWords = currentContent.split(/\s+/).length;
  const proposedWords = proposedChange.split(/\s+/).length;

  // Shorter is simpler
  if (proposedWords < currentWords) {
    return true;
  }

  // Fewer steps (numbered lists)
  const currentSteps = (currentContent.match(/^\d+\.\s/gm) ?? []).length;
  const proposedSteps = (proposedChange.match(/^\d+\.\s/gm) ?? []).length;
  if (proposedSteps > 0 && proposedSteps < currentSteps) {
    return true;
  }

  // Fewer conditions (if/when statements in natural language)
  const currentConditions = (currentContent.match(/\b(?:if|when|unless|except)\b/gi) ?? []).length;
  const proposedConditions = (proposedChange.match(/\b(?:if|when|unless|except)\b/gi) ?? []).length;
  if (proposedConditions < currentConditions && currentConditions > 2) {
    return true;
  }

  return false;
}

/**
 * Detect if proposed change contradicts existing skill content.
 * Looks for direct negation patterns.
 */
function detectContradiction(currentContent: string, proposedChange: string): boolean {
  // Extract "do not" / "never" / "always" directives from current
  const currentDirectives = extractDirectives(currentContent);
  const proposedDirectives = extractDirectives(proposedChange);

  for (const current of currentDirectives) {
    for (const proposed of proposedDirectives) {
      // Check if one says "do X" and the other says "do not X"
      if (areContradictory(current, proposed)) {
        return true;
      }
    }
  }

  return false;
}

function extractDirectives(content: string): string[] {
  const patterns = [
    /(?:never|do\s+not|don't|must\s+not|should\s+not)\s+(.+?)(?:\.|$)/gim,
    /(?:always|must|should)\s+(.+?)(?:\.|$)/gim,
  ];

  const directives: string[] = [];
  for (const pattern of patterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      directives.push(match[0].trim().toLowerCase());
    }
  }
  return directives;
}

function areContradictory(a: string, b: string): boolean {
  const negationPrefixes = ["never", "do not", "don't", "must not", "should not"];
  const affirmativePrefixes = ["always", "must", "should"];

  const aIsNegative = negationPrefixes.some((p) => a.startsWith(p));
  const bIsNegative = negationPrefixes.some((p) => b.startsWith(p));

  if (aIsNegative === bIsNegative) return false;

  // Strip the prefix and compare the action
  const stripPrefix = (s: string): string => {
    for (const p of [...negationPrefixes, ...affirmativePrefixes]) {
      if (s.startsWith(p)) {
        return s.slice(p.length).trim();
      }
    }
    return s;
  };

  const aAction = stripPrefix(a);
  const bAction = stripPrefix(b);

  // Fuzzy match: substring check or significant word overlap
  if (aAction.includes(bAction) || bAction.includes(aAction)) {
    return true;
  }

  // Word overlap check: if the core verb+object overlap, it is contradictory
  const aWords = aAction.split(/\s+/).filter((w) => w.length > 3);
  const bWords = bAction.split(/\s+/).filter((w) => w.length > 3);
  if (aWords.length === 0 || bWords.length === 0) return false;

  const overlap = aWords.filter((w) => bWords.includes(w));
  const overlapRatio = overlap.length / Math.min(aWords.length, bWords.length);
  return overlapRatio >= 0.5;
}
