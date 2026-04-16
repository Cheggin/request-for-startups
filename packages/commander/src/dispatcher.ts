/**
 * Dispatcher — classifies tasks and assigns them to the right agent.
 *
 * Classification priority: labels > file paths > keywords > fallback (ops).
 * Uses fuzzy substring matching for keywords (case-insensitive).
 */

import type { Issue } from "@harness/github-state";
import type { Task, ClassificationResult, ClassificationSignal } from "./types.js";
import {
  AGENT_NAMES,
  LABEL_ROUTES,
  FILE_PATH_ROUTES,
  KEYWORD_ROUTES,
  type AgentName,
} from "./constants.js";

// ─── File Path Matching ─────────────────────────────────────────────────────

/**
 * Check if a file path matches a glob-like pattern.
 * Supports trailing /** for directory matches and leading * for extension matches.
 */
function matchesPattern(filePath: string, pattern: string): boolean {
  // Exact match
  if (filePath === pattern) return true;

  // Directory glob: "packages/api/**" matches "packages/api/src/foo.ts"
  if (pattern.endsWith("/**")) {
    const prefix = pattern.slice(0, -3);
    return filePath.startsWith(prefix);
  }

  // Extension glob: "*.css" matches "styles/main.css"
  if (pattern.startsWith("*.")) {
    const ext = pattern.slice(1);
    return filePath.endsWith(ext);
  }

  // Simple prefix match for patterns like "migrations/**"
  if (pattern.includes("**")) {
    const prefix = pattern.split("**")[0];
    return filePath.startsWith(prefix);
  }

  return filePath === pattern;
}

// ─── Keyword Matching (Fuzzy Substring) ─────────────────────────────────────

function fuzzyMatch(text: string, keyword: string): boolean {
  const lowerText = text.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  return lowerText.includes(lowerKeyword);
}

// ─── Classification ─────────────────────────────────────────────────────────

/**
 * Classify a task to determine which agent should handle it.
 *
 * Signal priority:
 * 1. Labels (confidence 0.95) — direct mapping from issue labels
 * 2. File paths (confidence 0.85) — glob match against known patterns
 * 3. Keywords (confidence scales with match count) — fuzzy substring in title/body
 * 4. Fallback to ops (confidence 0.2)
 */
export function classifyTask(task: Task): ClassificationResult {
  const signals: ClassificationSignal[] = [];
  const scores = new Map<AgentName, number>();

  // Initialize scores
  for (const agent of AGENT_NAMES) {
    scores.set(agent, 0);
  }

  // 1. Label signals (highest weight)
  for (const label of task.labels) {
    const agent = LABEL_ROUTES[label.toLowerCase()];
    if (agent) {
      signals.push({ type: "label", label });
      scores.set(agent, (scores.get(agent) ?? 0) + 3);
    }
  }

  // 2. File path signals
  for (const filePath of task.filePaths) {
    for (const agent of AGENT_NAMES) {
      const patterns = FILE_PATH_ROUTES[agent];
      for (const pattern of patterns) {
        if (matchesPattern(filePath, pattern)) {
          signals.push({ type: "file_path", pattern, path: filePath });
          scores.set(agent, (scores.get(agent) ?? 0) + 2);
          break; // One match per agent per file is enough
        }
      }
    }
  }

  // 3. Keyword signals (check title and body)
  for (const agent of AGENT_NAMES) {
    const keywords = KEYWORD_ROUTES[agent];
    for (const keyword of keywords) {
      if (fuzzyMatch(task.title, keyword)) {
        signals.push({ type: "keyword", keyword, matchedIn: "title" });
        scores.set(agent, (scores.get(agent) ?? 0) + 1.5);
      }
      if (task.body && fuzzyMatch(task.body, keyword)) {
        signals.push({ type: "keyword", keyword, matchedIn: "body" });
        scores.set(agent, (scores.get(agent) ?? 0) + 1);
      }
    }
  }

  // Find the winner
  let bestAgent: AgentName = "ops";
  let bestScore = 0;

  for (const [agent, score] of scores) {
    if (score > bestScore) {
      bestScore = score;
      bestAgent = agent;
    }
  }

  // Calculate confidence based on score magnitude and signal count
  let confidence: number;
  if (bestScore >= 3) {
    confidence = 0.95; // Label match or strong multi-signal
  } else if (bestScore >= 2) {
    confidence = 0.85; // File path match
  } else if (bestScore >= 1) {
    confidence = 0.6; // Single keyword
  } else {
    confidence = 0.2; // Fallback
  }

  // Filter signals to only those for the winning agent
  const relevantSignals = signals.filter((s) => {
    if (s.type === "label") return LABEL_ROUTES[s.label.toLowerCase()] === bestAgent;
    if (s.type === "file_path") {
      return FILE_PATH_ROUTES[bestAgent].some((p) => matchesPattern(s.path, p));
    }
    if (s.type === "keyword") {
      return KEYWORD_ROUTES[bestAgent].includes(s.keyword);
    }
    return false;
  });

  return {
    agent: bestAgent,
    confidence,
    signals: relevantSignals,
  };
}

// ─── Task Builders ──────────────────────────────────────────────────────────

/** Regex to extract file paths from issue body text. */
const FILE_PATH_RE = /(?:^|\s)((?:[\w@.-]+\/)+[\w.-]+\.\w+)/gm;

/** Regex to extract issue dependency references — captures #N after dependency keywords and adjacent #N refs. */
const DEPENDS_ON_RE = /(?:depends on|blocked by|requires|after)\s+#(\d+)(?:\s+and\s+#(\d+))?/gi;

/** Regex to capture all #N references on lines containing dependency keywords. */
const ISSUE_REF_RE = /#(\d+)/g;

/**
 * Build a Task from a GitHub Issue.
 */
export function buildTaskFromIssue(issue: Issue): Task {
  const labels = issue.labels.map((l) => l.name);
  const body = issue.body ?? "";

  // Extract file paths from body
  const filePaths: string[] = [];
  let match: RegExpExecArray | null;
  const fileRe = new RegExp(FILE_PATH_RE.source, FILE_PATH_RE.flags);
  while ((match = fileRe.exec(body)) !== null) {
    filePaths.push(match[1]);
  }

  // Extract dependency references — find lines with dependency keywords, then pull all #N refs
  const dependsOn: string[] = [];
  const depKeywordRe = /(?:depends on|blocked by|requires|after)\s+/gi;
  const lines = body.split("\n");
  for (const line of lines) {
    depKeywordRe.lastIndex = 0;
    if (depKeywordRe.test(line)) {
      const refRe = new RegExp(ISSUE_REF_RE.source, ISSUE_REF_RE.flags);
      let refMatch: RegExpExecArray | null;
      while ((refMatch = refRe.exec(line)) !== null) {
        if (!dependsOn.includes(refMatch[1])) {
          dependsOn.push(refMatch[1]);
        }
      }
    }
  }

  return {
    id: String(issue.number),
    title: issue.title,
    body,
    source: "github_issue",
    labels,
    filePaths,
    dependsOn,
    issue,
  };
}

/**
 * Build a Task from a direct prompt string (no GitHub Issue).
 */
export function buildTaskFromPrompt(prompt: string): Task {
  const id = `prompt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    title: prompt,
    body: prompt,
    source: "direct_prompt",
    labels: [],
    filePaths: [],
    dependsOn: [],
  };
}
