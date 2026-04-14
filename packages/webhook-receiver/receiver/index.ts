#!/usr/bin/env bun

/**
 * Universal Webhook Receiver
 *
 * Receives webhooks from any source (GitHub, Sentry, uptime monitors, Cubic, custom),
 * verifies signatures, parses payloads, and writes events to Convex as a generic event queue.
 *
 * Environment variables:
 *   CONVEX_URL              — Convex deployment URL
 *   GITHUB_WEBHOOK_SECRET   — secret for GitHub HMAC-SHA256 verification
 *   SENTRY_WEBHOOK_SECRET   — secret token for Sentry webhook verification
 *   UPTIME_WEBHOOK_SECRET   — secret token for uptime monitor verification
 *   CUSTOM_WEBHOOK_SECRET   — secret token for custom webhook verification
 */

// ── Signature Verification ──────────────────────────────────────────

export async function verifyHmacSha256(
  payload: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const computed =
    "sha256=" +
    Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  return computed === signature;
}

export function verifyTokenHeader(
  headerValue: string | null,
  secret: string
): boolean {
  if (!headerValue || !secret) return false;
  return headerValue === secret;
}

export interface SignatureVerifiers {
  github: (payload: string, signature: string | null) => Promise<boolean>;
  sentry: (token: string | null) => boolean;
  uptime: (token: string | null) => boolean;
  custom: (token: string | null) => boolean;
}

// ── Source-Specific Parsers ─────────────────────────────────────────

export interface ParsedEvent {
  eventType: string;
  eventId: string;
  metadata: {
    repo?: string;
    severity?: string;
    url?: string;
    title?: string;
    author?: string;
    prNumber?: number;
    file?: string;
    line?: number;
    monitor?: string;
    environment?: string;
  };
  agentTarget?: string;
}

export function parseGitHubEvent(
  githubEvent: string | null,
  payload: Record<string, unknown>
): ParsedEvent {
  const repo = (payload.repository as Record<string, unknown>)?.full_name as
    | string
    | undefined;

  if (githubEvent === "pull_request_review" || githubEvent === "pull_request_review_comment") {
    const review = (payload.review || payload.comment) as Record<string, unknown> | undefined;
    const pr = payload.pull_request as Record<string, unknown> | undefined;
    const user = review?.user as Record<string, unknown> | undefined;
    const commentId = review?.id as number | undefined;

    return {
      eventType: githubEvent === "pull_request_review" ? "pr_review" : "pr_review_comment",
      eventId: `github-${commentId || Date.now()}`,
      metadata: {
        repo,
        author: user?.login as string | undefined,
        prNumber: pr?.number as number | undefined,
        file: (review as Record<string, unknown>)?.path as string | undefined,
        line: ((review as Record<string, unknown>)?.line ||
          (review as Record<string, unknown>)?.original_line) as number | undefined,
        url: (review as Record<string, unknown>)?.html_url as string | undefined,
      },
      agentTarget: "backend",
    };
  }

  if (githubEvent === "issue_comment") {
    const comment = payload.comment as Record<string, unknown> | undefined;
    const issue = payload.issue as Record<string, unknown> | undefined;
    const user = comment?.user as Record<string, unknown> | undefined;

    return {
      eventType: "issue_comment",
      eventId: `github-${comment?.id || Date.now()}`,
      metadata: {
        repo,
        author: user?.login as string | undefined,
        prNumber: issue?.number as number | undefined,
        url: comment?.html_url as string | undefined,
      },
      agentTarget: "backend",
    };
  }

  if (githubEvent === "push") {
    const headCommit = payload.head_commit as Record<string, unknown> | undefined;
    const pusher = payload.pusher as Record<string, unknown> | undefined;

    return {
      eventType: "push",
      eventId: `github-${headCommit?.id || Date.now()}`,
      metadata: {
        repo,
        author: pusher?.name as string | undefined,
        url: headCommit?.url as string | undefined,
        title: headCommit?.message as string | undefined,
      },
      agentTarget: "backend",
    };
  }

  // Fallback for any other GitHub event
  return {
    eventType: githubEvent || "unknown",
    eventId: `github-${Date.now()}`,
    metadata: { repo },
    agentTarget: "backend",
  };
}

export function parseSentryEvent(
  payload: Record<string, unknown>
): ParsedEvent {
  const data = payload.data as Record<string, unknown> | undefined;
  const event = data?.event as Record<string, unknown> | undefined;
  const issue = data?.issue as Record<string, unknown> | undefined;

  const action = payload.action as string | undefined;
  const eventType =
    action === "created"
      ? "issue.created"
      : action === "triggered"
        ? "event.alert"
        : (action || "unknown");

  const issueId = issue?.id || event?.event_id || Date.now();
  const title = (issue?.title || event?.title) as string | undefined;
  const url = (issue?.web_url || event?.web_url) as string | undefined;

  const level = (issue?.level || event?.level || "error") as string;
  const severityMap: Record<string, string> = {
    fatal: "critical",
    error: "high",
    warning: "medium",
    info: "low",
  };

  return {
    eventType,
    eventId: `sentry-${issueId}`,
    metadata: {
      severity: severityMap[level] || "medium",
      title,
      url,
      environment: (event?.environment || issue?.project?.slug) as string | undefined,
    },
    agentTarget: "ops",
  };
}

export function parseUptimeEvent(
  payload: Record<string, unknown>
): ParsedEvent {
  const status = (payload.status || payload.state) as string | undefined;
  const monitor = (payload.monitor || payload.name || payload.check) as
    | string
    | Record<string, unknown>
    | undefined;
  const monitorName =
    typeof monitor === "string" ? monitor : (monitor?.name as string | undefined);

  const isDown =
    status === "down" || status === "failure" || status === "alert";

  return {
    eventType: isDown ? "down" : "up",
    eventId: `uptime-${monitorName || "unknown"}-${Date.now()}`,
    metadata: {
      monitor: monitorName,
      severity: isDown ? "critical" : "low",
      url: payload.url as string | undefined,
      title: `${monitorName || "Monitor"} is ${isDown ? "DOWN" : "UP"}`,
    },
    agentTarget: "ops",
  };
}

export function parseCustomEvent(
  payload: Record<string, unknown>
): ParsedEvent {
  return {
    eventType: (payload.eventType as string) || "custom",
    eventId: `custom-${(payload.eventId as string) || Date.now()}`,
    metadata: (payload.metadata as ParsedEvent["metadata"]) || {},
    agentTarget: (payload.agentTarget as string) || undefined,
  };
}

// ── Handler Factory ─────────────────────────────────────────────────

export function createHandler(deps: {
  verifiers: SignatureVerifiers;
  writeToConvex: (event: {
    source: string;
    eventType: string;
    eventId: string;
    payload: string;
    metadata?: ParsedEvent["metadata"];
    agentTarget?: string;
    timestamp: number;
  }) => Promise<void>;
}) {
  return async (req: Request): Promise<Response> => {
    const url = new URL(req.url);

    // Health check
    if (req.method === "GET" && url.pathname === "/health") {
      return new Response("ok");
    }

    if (req.method !== "POST") {
      return new Response("method not allowed", { status: 405 });
    }

    // Extract source from path: /webhook/:source
    const pathMatch = url.pathname.match(/^\/webhook\/([a-zA-Z0-9_-]+)$/);
    if (!pathMatch) {
      return new Response("not found: use /webhook/:source", { status: 404 });
    }

    const source = pathMatch[1].toLowerCase();
    const body = await req.text();

    // Verify signature per source
    let verified = false;
    switch (source) {
      case "github":
        verified = await deps.verifiers.github(
          body,
          req.headers.get("x-hub-signature-256")
        );
        break;
      case "sentry":
        verified = deps.verifiers.sentry(
          req.headers.get("sentry-hook-signature")
        );
        break;
      case "uptime":
        verified = deps.verifiers.uptime(
          req.headers.get("x-webhook-secret")
        );
        break;
      case "custom":
        verified = deps.verifiers.custom(
          req.headers.get("x-webhook-secret")
        );
        break;
      default:
        // Unknown sources pass through with custom secret header
        verified = deps.verifiers.custom(
          req.headers.get("x-webhook-secret")
        );
        break;
    }

    if (!verified) {
      return new Response("invalid signature", { status: 401 });
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(body);
    } catch {
      return new Response("invalid JSON", { status: 400 });
    }

    // Parse per source
    let parsed: ParsedEvent;
    switch (source) {
      case "github":
        parsed = parseGitHubEvent(
          req.headers.get("x-github-event"),
          payload
        );
        break;
      case "sentry":
        parsed = parseSentryEvent(payload);
        break;
      case "uptime":
        parsed = parseUptimeEvent(payload);
        break;
      case "custom":
      default:
        parsed = parseCustomEvent(payload);
        break;
    }

    await deps.writeToConvex({
      source,
      eventType: parsed.eventType,
      eventId: parsed.eventId,
      payload: JSON.stringify(payload),
      metadata: parsed.metadata,
      agentTarget: parsed.agentTarget,
      timestamp: Date.now(),
    });

    return new Response(JSON.stringify({ status: "queued", eventId: parsed.eventId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
}

// ── Server startup (only when run directly) ─────────────────────────

const isMainModule =
  typeof Bun !== "undefined" && Bun.main === import.meta.path;

if (isMainModule) {
  const CONVEX_URL = process.env.CONVEX_URL;
  const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || "";
  const SENTRY_WEBHOOK_SECRET = process.env.SENTRY_WEBHOOK_SECRET || "";
  const UPTIME_WEBHOOK_SECRET = process.env.UPTIME_WEBHOOK_SECRET || "";
  const CUSTOM_WEBHOOK_SECRET = process.env.CUSTOM_WEBHOOK_SECRET || "";

  if (!CONVEX_URL) throw new Error("CONVEX_URL is required");

  async function writeToConvex(event: {
    source: string;
    eventType: string;
    eventId: string;
    payload: string;
    metadata?: ParsedEvent["metadata"];
    agentTarget?: string;
    timestamp: number;
  }): Promise<void> {
    const response = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "events:addEvent",
        args: event,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Convex mutation failed: ${response.status} ${text}`);
    }
  }

  const PORT = parseInt(process.env.PORT || "8790", 10);

  const handler = createHandler({
    verifiers: {
      github: (payload, signature) =>
        verifyHmacSha256(payload, signature, GITHUB_WEBHOOK_SECRET),
      sentry: (token) => verifyTokenHeader(token, SENTRY_WEBHOOK_SECRET),
      uptime: (token) => verifyTokenHeader(token, UPTIME_WEBHOOK_SECRET),
      custom: (token) => verifyTokenHeader(token, CUSTOM_WEBHOOK_SECRET),
    },
    writeToConvex,
  });

  Bun.serve({
    port: PORT,
    hostname: "0.0.0.0",
    fetch: handler,
  });

  console.log(`Universal webhook receiver listening on port ${PORT}`);
}
