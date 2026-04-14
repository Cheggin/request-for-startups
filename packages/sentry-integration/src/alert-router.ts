import type { AgentError } from "./queries.js";

/**
 * Agent targets for error routing.
 */
export type AgentTarget = "website" | "backend" | "ops";

/**
 * Routed alert with agent assignment.
 */
export interface RoutedAlert {
  error: AgentError;
  targetAgent: AgentTarget;
  priority: "low" | "medium" | "high" | "critical";
  instruction: string;
}

/**
 * Determine priority based on occurrence count and age.
 */
function determinePriority(error: AgentError): "low" | "medium" | "high" | "critical" {
  const occurrences = error.occurrences;
  const lastSeenMs = new Date(error.lastSeen).getTime();
  const ageMinutes = (Date.now() - lastSeenMs) / (1000 * 60);

  // Critical: high volume AND recent
  if (occurrences >= 100 && ageMinutes < 30) return "critical";
  // High: either high volume or very recent
  if (occurrences >= 50 || ageMinutes < 10) return "high";
  // Medium: moderate volume
  if (occurrences >= 10) return "medium";
  return "low";
}

/**
 * Map error category to agent target.
 */
function categoryToAgent(category: AgentError["category"]): AgentTarget {
  switch (category) {
    case "frontend":
      return "website";
    case "api":
      return "backend";
    case "infra":
      return "ops";
    default:
      return "backend"; // Default unclassified errors to backend
  }
}

/**
 * Build an actionable instruction for the target agent.
 */
function buildInstruction(error: AgentError, target: AgentTarget, priority: string): string {
  const urgency = priority === "critical"
    ? "URGENT: "
    : priority === "high"
      ? "HIGH PRIORITY: "
      : "";

  switch (target) {
    case "website":
      return (
        `${urgency}Frontend error detected: "${error.title}" ` +
        `at ${error.location}. ${error.occurrences} occurrences since ${error.firstSeen}. ` +
        `Check the component for React rendering issues, hydration mismatches, or DOM errors. ` +
        `${error.stackTrace.length > 0 ? `Stack trace starts at: ${error.stackTrace[0]}` : ""}`
      );

    case "backend":
      return (
        `${urgency}API error detected: "${error.title}" ` +
        `at ${error.location}. ${error.occurrences} occurrences since ${error.firstSeen}. ` +
        `Check the endpoint handler for request validation, authentication, and upstream service issues. ` +
        `${error.stackTrace.length > 0 ? `Stack trace starts at: ${error.stackTrace[0]}` : ""}`
      );

    case "ops":
      return (
        `${urgency}Infrastructure error detected: "${error.title}" ` +
        `at ${error.location}. ${error.occurrences} occurrences since ${error.firstSeen}. ` +
        `Check deployment status, resource limits (CPU/memory), and network connectivity. ` +
        `${error.stackTrace.length > 0 ? `Stack trace starts at: ${error.stackTrace[0]}` : ""}`
      );
  }
}

/**
 * Route a single error to the appropriate agent.
 */
export function routeError(error: AgentError): RoutedAlert {
  const targetAgent = categoryToAgent(error.category);
  const priority = determinePriority(error);
  const instruction = buildInstruction(error, targetAgent, priority);

  return { error, targetAgent, priority, instruction };
}

/**
 * Route a batch of errors to their respective agents.
 * Returns a map of agent target to their assigned alerts, sorted by priority.
 */
export function routeErrors(
  errors: AgentError[]
): Record<AgentTarget, RoutedAlert[]> {
  const result: Record<AgentTarget, RoutedAlert[]> = {
    website: [],
    backend: [],
    ops: [],
  };

  for (const error of errors) {
    const routed = routeError(error);
    result[routed.targetAgent].push(routed);
  }

  // Sort each agent's alerts by priority (critical first)
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  for (const agent of Object.keys(result) as AgentTarget[]) {
    result[agent].sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );
  }

  return result;
}
