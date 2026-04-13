import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  verifySignature,
  isCubicAuthor,
  parseReviewComment,
  createHandler,
} from "./index.ts";

// ── Signature verification ─────────────────────────────────────────

describe("verifySignature", () => {
  const SECRET = "test-webhook-secret";

  async function sign(payload: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const hex = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `sha256=${hex}`;
  }

  it("accepts a valid signature", async () => {
    const payload = '{"action":"submitted"}';
    const sig = await sign(payload);
    expect(await verifySignature(payload, sig, SECRET)).toBe(true);
  });

  it("rejects an invalid signature", async () => {
    expect(await verifySignature("body", "sha256=deadbeef", SECRET)).toBe(false);
  });

  it("rejects null signature", async () => {
    expect(await verifySignature("body", null, SECRET)).toBe(false);
  });
});

// ── Cubic author filtering ─────────────────────────────────────────

describe("isCubicAuthor", () => {
  it("matches cubic-bot", () => {
    expect(isCubicAuthor("cubic-bot")).toBe(true);
  });

  it("matches cubic[bot] (GitHub app style)", () => {
    expect(isCubicAuthor("cubic[bot]")).toBe(true);
  });

  it("matches cubic-dev[bot]", () => {
    expect(isCubicAuthor("cubic-dev[bot]")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isCubicAuthor("Cubic-Bot")).toBe(true);
    expect(isCubicAuthor("CUBIC[BOT]")).toBe(true);
  });

  it("rejects human usernames", () => {
    expect(isCubicAuthor("reagan")).toBe(false);
    expect(isCubicAuthor("dependabot[bot]")).toBe(false);
  });
});

// ── Review comment parsing ─────────────────────────────────────────

describe("parseReviewComment", () => {
  it("extracts severity from body text", () => {
    const result = parseReviewComment(
      "**Critical**: Potential null reference at line 42"
    );
    expect(result.severity).toBe("critical");
  });

  it("extracts warning severity", () => {
    const result = parseReviewComment("Warning: unused import detected");
    expect(result.severity).toBe("warning");
  });

  it("defaults to medium when no severity keyword found", () => {
    const result = parseReviewComment("Consider renaming this variable");
    expect(result.severity).toBe("medium");
  });

  it("preserves the full message body", () => {
    const body = "**High**: Memory leak in useEffect cleanup";
    const result = parseReviewComment(body);
    expect(result.message).toBe(body);
    expect(result.severity).toBe("high");
  });
});

// ── Request handler (payload parsing) ──────────────────────────────

function makeRequest(
  body: string,
  headers: Record<string, string>
): Request {
  return new Request("http://localhost:8789/webhook", {
    method: "POST",
    headers,
    body,
  });
}

describe("createHandler", () => {
  const writeToConvex = vi.fn().mockResolvedValue(undefined);

  const handler = createHandler({
    verifySignature: async () => true,
    isCubicAuthor: (author: string) =>
      author.toLowerCase().includes("cubic"),
    parseReviewComment,
    writeToConvex,
  });

  beforeEach(() => {
    writeToConvex.mockClear();
  });

  // ── Health check ───────────────────────────────────────────────

  it("responds to GET /health", async () => {
    const req = new Request("http://localhost:8789/health", { method: "GET" });
    const res = await handler(req);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("ok");
  });

  // ── Signature rejection ────────────────────────────────────────

  it("rejects requests with invalid signature", async () => {
    const rejectHandler = createHandler({
      verifySignature: async () => false,
      isCubicAuthor: () => true,
      parseReviewComment,
      writeToConvex,
    });

    const req = makeRequest('{"action":"submitted"}', {
      "x-github-event": "pull_request_review",
      "x-hub-signature-256": "sha256=bad",
    });
    const res = await rejectHandler(req);
    expect(res.status).toBe(401);
  });

  // ── pull_request_review ────────────────────────────────────────

  it("queues a pull_request_review from Cubic", async () => {
    const payload = {
      action: "submitted",
      review: {
        id: 100,
        body: "**Critical**: SQL injection vulnerability",
        user: { login: "cubic[bot]" },
      },
      pull_request: { number: 42 },
      repository: { full_name: "owner/repo" },
    };

    const req = makeRequest(JSON.stringify(payload), {
      "x-github-event": "pull_request_review",
      "x-hub-signature-256": "sha256=valid",
    });
    const res = await handler(req);

    expect(await res.text()).toBe("queued");
    expect(writeToConvex).toHaveBeenCalledWith({
      repo: "owner/repo",
      prNumber: 42,
      file: undefined,
      line: undefined,
      severity: "critical",
      message: "**Critical**: SQL injection vulnerability",
      author: "cubic[bot]",
      commentId: 100,
    });
  });

  it("ignores pull_request_review from non-Cubic authors", async () => {
    const payload = {
      action: "submitted",
      review: {
        id: 101,
        body: "LGTM",
        user: { login: "human-reviewer" },
      },
      pull_request: { number: 42 },
      repository: { full_name: "owner/repo" },
    };

    const req = makeRequest(JSON.stringify(payload), {
      "x-github-event": "pull_request_review",
      "x-hub-signature-256": "sha256=valid",
    });
    const res = await handler(req);

    expect(await res.text()).toBe("ignored: not cubic");
    expect(writeToConvex).not.toHaveBeenCalled();
  });

  // ── pull_request_review_comment ────────────────────────────────

  it("queues a pull_request_review_comment with file and line", async () => {
    const payload = {
      action: "created",
      comment: {
        id: 200,
        body: "**High**: Potential null reference",
        path: "src/app.tsx",
        line: 42,
        original_line: 40,
        user: { login: "cubic-bot" },
      },
      pull_request: { number: 7 },
      repository: { full_name: "owner/repo" },
    };

    const req = makeRequest(JSON.stringify(payload), {
      "x-github-event": "pull_request_review_comment",
      "x-hub-signature-256": "sha256=valid",
    });
    const res = await handler(req);

    expect(await res.text()).toBe("queued");
    expect(writeToConvex).toHaveBeenCalledWith({
      repo: "owner/repo",
      prNumber: 7,
      file: "src/app.tsx",
      line: 42,
      severity: "high",
      message: "**High**: Potential null reference",
      author: "cubic-bot",
      commentId: 200,
    });
  });

  it("falls back to original_line when line is null", async () => {
    const payload = {
      action: "created",
      comment: {
        id: 201,
        body: "Low: consider renaming",
        path: "src/utils.ts",
        line: null,
        original_line: 15,
        user: { login: "cubic-dev[bot]" },
      },
      pull_request: { number: 3 },
      repository: { full_name: "owner/repo" },
    };

    const req = makeRequest(JSON.stringify(payload), {
      "x-github-event": "pull_request_review_comment",
      "x-hub-signature-256": "sha256=valid",
    });
    await handler(req);

    expect(writeToConvex).toHaveBeenCalledWith(
      expect.objectContaining({ line: 15 })
    );
  });

  // ── issue_comment (on a PR) ────────────────────────────────────

  it("queues an issue_comment on a PR from Cubic", async () => {
    const payload = {
      action: "created",
      issue: {
        number: 10,
        pull_request: {
          url: "https://api.github.com/repos/owner/repo/pulls/10",
        },
      },
      comment: {
        id: 300,
        body: "Error: missing error handling in catch block",
        user: { login: "cubic[bot]" },
      },
      repository: { full_name: "owner/repo" },
    };

    const req = makeRequest(JSON.stringify(payload), {
      "x-github-event": "issue_comment",
      "x-hub-signature-256": "sha256=valid",
    });
    const res = await handler(req);

    expect(await res.text()).toBe("queued");
    expect(writeToConvex).toHaveBeenCalledWith({
      repo: "owner/repo",
      prNumber: 10,
      severity: "error",
      message: "Error: missing error handling in catch block",
      author: "cubic[bot]",
      commentId: 300,
    });
  });

  it("ignores issue_comment not on a PR", async () => {
    const payload = {
      action: "created",
      issue: { number: 5 },
      comment: {
        id: 301,
        body: "Some comment",
        user: { login: "cubic[bot]" },
      },
      repository: { full_name: "owner/repo" },
    };

    const req = makeRequest(JSON.stringify(payload), {
      "x-github-event": "issue_comment",
      "x-hub-signature-256": "sha256=valid",
    });
    const res = await handler(req);

    expect(await res.text()).toBe("ignored: not a PR comment");
    expect(writeToConvex).not.toHaveBeenCalled();
  });

  // ── Unhandled events ───────────────────────────────────────────

  it("ignores unhandled event types", async () => {
    const req = makeRequest('{"action":"opened"}', {
      "x-github-event": "push",
      "x-hub-signature-256": "sha256=valid",
    });
    const res = await handler(req);
    expect(await res.text()).toBe("ignored: unhandled event");
  });

  it("rejects non-POST methods", async () => {
    const req = new Request("http://localhost:8789/webhook", {
      method: "PUT",
    });
    const res = await handler(req);
    expect(res.status).toBe(405);
  });
});
