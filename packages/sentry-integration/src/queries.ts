/**
 * Raw Sentry error shape (subset of fields we use).
 */
export interface SentryIssue {
  id: string;
  title: string;
  culprit: string;
  level: string;
  status: string;
  firstSeen: string;
  lastSeen: string;
  count: string;
  platform: string;
  metadata: {
    type?: string;
    value?: string;
    filename?: string;
    function?: string;
  };
  shortId: string;
  project: {
    slug: string;
    name: string;
  };
}

export interface SentryEvent {
  eventID: string;
  title: string;
  message: string;
  dateCreated: string;
  context: Record<string, unknown>;
  entries: {
    type: string;
    data: {
      values?: {
        type: string;
        value: string;
        stacktrace?: {
          frames: {
            filename: string;
            function: string;
            lineNo: number;
            colNo: number;
            context: [number, string][];
          }[];
        };
      }[];
    };
  }[];
  tags: { key: string; value: string }[];
}

/**
 * Agent-friendly error summary.
 */
export interface AgentError {
  issueId: string;
  title: string;
  errorType: string;
  errorMessage: string;
  location: string;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  stackTrace: string[];
  suggestedAction: string;
  category: "frontend" | "api" | "infra" | "unknown";
}

const SENTRY_API_BASE = "https://sentry.io/api/0";

/**
 * Build auth headers for Sentry API.
 */
function authHeaders(): Record<string, string> {
  const token = process.env.SENTRY_AUTH_TOKEN;
  if (!token) throw new Error("SENTRY_AUTH_TOKEN is not set");
  return { Authorization: `Bearer ${token}` };
}

/**
 * Get recent errors for a project. Returns formatted issues for agent consumption.
 */
export async function getRecentErrors(
  projectSlug: string,
  timeRange: "1h" | "24h" | "7d" | "30d" = "24h",
  orgSlug?: string
): Promise<AgentError[]> {
  const org = orgSlug ?? process.env.SENTRY_ORG;
  if (!org) throw new Error("SENTRY_ORG is not set and orgSlug not provided");

  const hoursMap = { "1h": 1, "24h": 24, "7d": 168, "30d": 720 };
  const hours = hoursMap[timeRange];
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const url = `${SENTRY_API_BASE}/projects/${org}/${projectSlug}/issues/?query=is:unresolved&sort=date&start=${since}`;
  const response = await fetch(url, { headers: authHeaders() });

  if (!response.ok) {
    throw new Error(`Sentry API error: ${response.status} ${response.statusText}`);
  }

  const issues: SentryIssue[] = await response.json();

  return issues.map((issue) => formatForAgent(issue));
}

/**
 * Get full details for a specific error issue, including stack trace.
 */
export async function getErrorDetails(
  issueId: string,
  orgSlug?: string
): Promise<AgentError> {
  const org = orgSlug ?? process.env.SENTRY_ORG;
  if (!org) throw new Error("SENTRY_ORG is not set and orgSlug not provided");

  // Get the issue
  const issueUrl = `${SENTRY_API_BASE}/issues/${issueId}/`;
  const issueResponse = await fetch(issueUrl, { headers: authHeaders() });
  if (!issueResponse.ok) {
    throw new Error(`Sentry API error: ${issueResponse.status}`);
  }
  const issue: SentryIssue = await issueResponse.json();

  // Get the latest event for stack trace
  const eventsUrl = `${SENTRY_API_BASE}/issues/${issueId}/events/latest/`;
  const eventsResponse = await fetch(eventsUrl, { headers: authHeaders() });
  let stackFrames: string[] = [];

  if (eventsResponse.ok) {
    const event: SentryEvent = await eventsResponse.json();
    stackFrames = extractStackTrace(event);
  }

  const formatted = formatForAgent(issue);
  formatted.stackTrace = stackFrames;
  return formatted;
}

/**
 * Extract a clean stack trace from a Sentry event.
 */
function extractStackTrace(event: SentryEvent): string[] {
  const frames: string[] = [];

  for (const entry of event.entries) {
    if (entry.type === "exception" && entry.data.values) {
      for (const exception of entry.data.values) {
        if (exception.stacktrace) {
          // Frames are in reverse order (most recent last)
          const reversedFrames = [...exception.stacktrace.frames].reverse();
          for (const frame of reversedFrames.slice(0, 10)) {
            const location = [
              frame.filename,
              frame.lineNo ? `:${frame.lineNo}` : "",
              frame.colNo ? `:${frame.colNo}` : "",
            ].join("");
            frames.push(`  at ${frame.function || "(anonymous)"} (${location})`);
          }
        }
      }
    }
  }

  return frames;
}

/**
 * Classify an error into a category for agent routing.
 */
function classifyError(issue: SentryIssue): "frontend" | "api" | "infra" | "unknown" {
  const title = issue.title.toLowerCase();
  const culprit = issue.culprit.toLowerCase();
  const errorType = (issue.metadata.type || "").toLowerCase();

  // Frontend patterns
  const frontendPatterns = [
    "react", "dom", "css", "hydration", "render",
    "typeerror: cannot read prop", "referenceerror",
    "syntaxerror", "chunk", "webpack", "next/",
    "useeffect", "usestate", "component",
  ];
  if (frontendPatterns.some((p) => title.includes(p) || culprit.includes(p) || errorType.includes(p))) {
    return "frontend";
  }

  // API patterns
  const apiPatterns = [
    "500", "502", "503", "504", "timeout", "auth",
    "unauthorized", "forbidden", "api/", "endpoint",
    "fetch", "axios", "request failed",
  ];
  if (apiPatterns.some((p) => title.includes(p) || culprit.includes(p))) {
    return "api";
  }

  // Infra patterns
  const infraPatterns = [
    "deploy", "oom", "out of memory", "econnrefused",
    "enotfound", "dns", "certificate", "ssl", "tls",
    "network", "socket", "container", "docker",
  ];
  if (infraPatterns.some((p) => title.includes(p) || culprit.includes(p))) {
    return "infra";
  }

  return "unknown";
}

/**
 * Transform raw Sentry data into an actionable agent instruction.
 * Following the Archon pattern: never send raw stack traces to agents.
 * Instead, provide structured, actionable summaries.
 */
export function formatForAgent(issue: SentryIssue): AgentError {
  const category = classifyError(issue);
  const errorType = issue.metadata.type || issue.level;
  const errorMessage = issue.metadata.value || issue.title;
  const location = issue.metadata.filename
    ? `${issue.metadata.filename}${issue.metadata.function ? ` in ${issue.metadata.function}()` : ""}`
    : issue.culprit;

  let suggestedAction = "";
  switch (category) {
    case "frontend":
      suggestedAction = `Investigate React/DOM error in ${location}. Check component rendering, state management, and hydration.`;
      break;
    case "api":
      suggestedAction = `Investigate API error: ${errorMessage}. Check endpoint handler, request validation, and upstream service health.`;
      break;
    case "infra":
      suggestedAction = `Investigate infrastructure issue: ${errorMessage}. Check deployment status, resource limits, and network connectivity.`;
      break;
    default:
      suggestedAction = `Investigate error: ${errorMessage} at ${location}.`;
  }

  return {
    issueId: issue.id,
    title: issue.title,
    errorType,
    errorMessage,
    location,
    occurrences: parseInt(issue.count, 10) || 0,
    firstSeen: issue.firstSeen,
    lastSeen: issue.lastSeen,
    stackTrace: [],
    suggestedAction,
    category,
  };
}
