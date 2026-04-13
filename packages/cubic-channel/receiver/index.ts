#!/usr/bin/env bun

/**
 * Railway Webhook Receiver
 *
 * Receives GitHub webhook payloads, verifies signatures,
 * filters for Cubic-authored review comments, and writes
 * them to Convex as queued events.
 *
 * Deploy to the user's Railway account during onboarding.
 *
 * Environment variables:
 *   GITHUB_WEBHOOK_SECRET  — secret for verifying webhook signatures
 *   CONVEX_URL             — Convex deployment URL (e.g. https://xxx.convex.cloud)
 */

export const CUBIC_BOT_NAMES = ["cubic-bot", "cubic[bot]", "cubic-dev[bot]"];

export async function verifySignature(
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

export function isCubicAuthor(author: string): boolean {
  const lower = author.toLowerCase();
  return CUBIC_BOT_NAMES.some((name) => lower.includes(name));
}

export function parseReviewComment(body: string): {
  file: string | undefined;
  line: number | undefined;
  severity: string;
  message: string;
} {
  const severityMatch = body.match(
    /\b(critical|high|medium|low|info|warning|error)\b/i
  );
  const severity = severityMatch ? severityMatch[1].toLowerCase() : "medium";

  return {
    file: undefined,
    line: undefined,
    severity,
    message: body,
  };
}

export function createHandler(deps: {
  verifySignature: (payload: string, signature: string | null) => Promise<boolean>;
  isCubicAuthor: typeof isCubicAuthor;
  parseReviewComment: typeof parseReviewComment;
  writeToConvex: (event: {
    repo: string;
    prNumber: number;
    file?: string;
    line?: number;
    severity: string;
    message: string;
    author: string;
    commentId: number;
  }) => Promise<void>;
}) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "GET" && new URL(req.url).pathname === "/health") {
      return new Response("ok");
    }

    if (req.method !== "POST") {
      return new Response("method not allowed", { status: 405 });
    }

    const body = await req.text();
    const signature = req.headers.get("x-hub-signature-256");

    const valid = await deps.verifySignature(body, signature);
    if (!valid) {
      return new Response("invalid signature", { status: 401 });
    }

    const event = req.headers.get("x-github-event");
    const payload = JSON.parse(body);

    if (event === "pull_request_review") {
      const review = payload.review;
      if (!review || !deps.isCubicAuthor(review.user?.login || "")) {
        return new Response("ignored: not cubic");
      }

      const parsed = deps.parseReviewComment(review.body || "");
      await deps.writeToConvex({
        repo: payload.repository.full_name,
        prNumber: payload.pull_request.number,
        file: parsed.file,
        line: parsed.line,
        severity: parsed.severity,
        message: parsed.message,
        author: review.user.login,
        commentId: review.id,
      });

      return new Response("queued");
    }

    if (event === "pull_request_review_comment") {
      const comment = payload.comment;
      if (!comment || !deps.isCubicAuthor(comment.user?.login || "")) {
        return new Response("ignored: not cubic");
      }

      await deps.writeToConvex({
        repo: payload.repository.full_name,
        prNumber: payload.pull_request.number,
        file: comment.path,
        line: comment.line || comment.original_line,
        severity: deps.parseReviewComment(comment.body || "").severity,
        message: comment.body || "",
        author: comment.user.login,
        commentId: comment.id,
      });

      return new Response("queued");
    }

    if (event === "issue_comment") {
      const comment = payload.comment;
      if (!comment || !deps.isCubicAuthor(comment.user?.login || "")) {
        return new Response("ignored: not cubic");
      }

      if (!payload.issue?.pull_request) {
        return new Response("ignored: not a PR comment");
      }

      const prNumber =
        payload.issue.number ||
        parseInt(payload.issue.pull_request.url.split("/").pop() || "0", 10);

      await deps.writeToConvex({
        repo: payload.repository.full_name,
        prNumber,
        severity: deps.parseReviewComment(comment.body || "").severity,
        message: comment.body || "",
        author: comment.user.login,
        commentId: comment.id,
      });

      return new Response("queued");
    }

    return new Response("ignored: unhandled event");
  };
}

// ── Server startup (only when run directly) ─────────────────────────

const isMainModule =
  typeof Bun !== "undefined" && Bun.main === import.meta.path;

if (isMainModule) {
  const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;
  const CONVEX_URL = process.env.CONVEX_URL;

  if (!GITHUB_WEBHOOK_SECRET)
    throw new Error("GITHUB_WEBHOOK_SECRET is required");
  if (!CONVEX_URL) throw new Error("CONVEX_URL is required");

  async function writeToConvex(event: {
    repo: string;
    prNumber: number;
    file?: string;
    line?: number;
    severity: string;
    message: string;
    author: string;
    commentId: number;
  }): Promise<void> {
    const response = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "cubicEvents:addEvent",
        args: event,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Convex mutation failed: ${response.status} ${text}`);
    }
  }

  const PORT = parseInt(process.env.PORT || "8789", 10);

  const handler = createHandler({
    verifySignature: (payload, signature) =>
      verifySignature(payload, signature, GITHUB_WEBHOOK_SECRET),
    isCubicAuthor,
    parseReviewComment,
    writeToConvex,
  });

  Bun.serve({
    port: PORT,
    hostname: "0.0.0.0",
    fetch: handler,
  });

  console.log(`Cubic webhook receiver listening on port ${PORT}`);
}
