import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  verifyHmacSha256,
  verifyTokenHeader,
  parseGitHubEvent,
  parseSentryEvent,
  parseUptimeEvent,
  parseCustomEvent,
  createHandler,
} from "./index.ts";

// ── HMAC-SHA256 Signature Verification ──────────────────────────────

describe("verifyHmacSha256", () => {
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
    expect(await verifyHmacSha256(payload, sig, SECRET)).toBe(true);
  });

  it("rejects an invalid signature", async () => {
    expect(await verifyHmacSha256("body", "sha256=deadbeef", SECRET)).toBe(
      false
    );
  });

  it("rejects null signature", async () => {
    expect(await verifyHmacSha256("body", null, SECRET)).toBe(false);
  });
});

// ── Token Header Verification ───────────────────────────────────────

describe("verifyTokenHeader", () => {
  it("accepts matching token", () => {
    expect(verifyTokenHeader("my-secret-token", "my-secret-token")).toBe(true);
  });

  it("rejects mismatched token", () => {
    expect(verifyTokenHeader("wrong-token", "my-secret-token")).toBe(false);
  });

  it("rejects null header", () => {
    expect(verifyTokenHeader(null, "my-secret-token")).toBe(false);
  });

  it("rejects empty secret", () => {
    expect(verifyTokenHeader("some-token", "")).toBe(false);
  });
});

// ── GitHub Event Parsing ────────────────────────────────────────────

describe("parseGitHubEvent", () => {
  it("parses pull_request_review", () => {
    const payload = {
      review: {
        id: 100,
        body: "Looks good",
        user: { login: "reviewer" },
        html_url: "https://github.com/owner/repo/pull/1#pullrequestreview-100",
      },
      pull_request: { number: 1 },
      repository: { full_name: "owner/repo" },
    };

    const result = parseGitHubEvent("pull_request_review", payload);
    expect(result.eventType).toBe("pr_review");
    expect(result.eventId).toBe("github-100");
    expect(result.metadata.repo).toBe("owner/repo");
    expect(result.metadata.author).toBe("reviewer");
    expect(result.metadata.prNumber).toBe(1);
    expect(result.agentTarget).toBe("backend");
  });

  it("parses pull_request_review_comment with file and line", () => {
    const payload = {
      comment: {
        id: 200,
        body: "Fix this",
        path: "src/app.tsx",
        line: 42,
        original_line: 40,
        user: { login: "bot" },
        html_url: "https://github.com/owner/repo/pull/1#discussion_r200",
      },
      pull_request: { number: 1 },
      repository: { full_name: "owner/repo" },
    };

    const result = parseGitHubEvent("pull_request_review_comment", payload);
    expect(result.eventType).toBe("pr_review_comment");
    expect(result.eventId).toBe("github-200");
    expect(result.metadata.file).toBe("src/app.tsx");
    expect(result.metadata.line).toBe(42);
  });

  it("parses issue_comment", () => {
    const payload = {
      comment: {
        id: 300,
        body: "Please fix",
        user: { login: "commenter" },
        html_url: "https://github.com/owner/repo/issues/5#issuecomment-300",
      },
      issue: { number: 5 },
      repository: { full_name: "owner/repo" },
    };

    const result = parseGitHubEvent("issue_comment", payload);
    expect(result.eventType).toBe("issue_comment");
    expect(result.eventId).toBe("github-300");
    expect(result.metadata.prNumber).toBe(5);
  });

  it("parses push event", () => {
    const payload = {
      head_commit: {
        id: "abc123",
        message: "feat: add feature",
        url: "https://github.com/owner/repo/commit/abc123",
      },
      pusher: { name: "developer" },
      repository: { full_name: "owner/repo" },
    };

    const result = parseGitHubEvent("push", payload);
    expect(result.eventType).toBe("push");
    expect(result.eventId).toBe("github-abc123");
    expect(result.metadata.author).toBe("developer");
    expect(result.metadata.title).toBe("feat: add feature");
  });

  it("handles unknown GitHub event types gracefully", () => {
    const payload = {
      repository: { full_name: "owner/repo" },
    };

    const result = parseGitHubEvent("deployment", payload);
    expect(result.eventType).toBe("deployment");
    expect(result.metadata.repo).toBe("owner/repo");
  });
});

// ── Sentry Event Parsing ────────────────────────────────────────────

describe("parseSentryEvent", () => {
  it("parses issue.created event", () => {
    const payload = {
      action: "created",
      data: {
        issue: {
          id: "12345",
          title: "TypeError: Cannot read property of undefined",
          level: "error",
          web_url: "https://sentry.io/issues/12345",
          project: { slug: "my-app" },
        },
      },
    };

    const result = parseSentryEvent(payload);
    expect(result.eventType).toBe("issue.created");
    expect(result.eventId).toBe("sentry-12345");
    expect(result.metadata.severity).toBe("high");
    expect(result.metadata.title).toBe(
      "TypeError: Cannot read property of undefined"
    );
    expect(result.agentTarget).toBe("ops");
  });

  it("parses event.alert (triggered) event", () => {
    const payload = {
      action: "triggered",
      data: {
        event: {
          event_id: "evt-789",
          title: "High error rate",
          level: "fatal",
          environment: "production",
          web_url: "https://sentry.io/events/evt-789",
        },
      },
    };

    const result = parseSentryEvent(payload);
    expect(result.eventType).toBe("event.alert");
    expect(result.eventId).toBe("sentry-evt-789");
    expect(result.metadata.severity).toBe("critical");
    expect(result.metadata.environment).toBe("production");
  });

  it("defaults severity to medium for warning level", () => {
    const payload = {
      action: "created",
      data: {
        issue: { id: "456", level: "warning", title: "Deprecation warning" },
      },
    };

    const result = parseSentryEvent(payload);
    expect(result.metadata.severity).toBe("medium");
  });
});

// ── Uptime Event Parsing ────────────────────────────────────────────

describe("parseUptimeEvent", () => {
  it("parses down status", () => {
    const payload = {
      status: "down",
      monitor: "api-server",
      url: "https://api.example.com",
    };

    const result = parseUptimeEvent(payload);
    expect(result.eventType).toBe("down");
    expect(result.metadata.monitor).toBe("api-server");
    expect(result.metadata.severity).toBe("critical");
    expect(result.metadata.title).toBe("api-server is DOWN");
    expect(result.agentTarget).toBe("ops");
  });

  it("parses up status", () => {
    const payload = {
      status: "up",
      monitor: "api-server",
      url: "https://api.example.com",
    };

    const result = parseUptimeEvent(payload);
    expect(result.eventType).toBe("up");
    expect(result.metadata.severity).toBe("low");
    expect(result.metadata.title).toBe("api-server is UP");
  });

  it("handles monitor as object with name", () => {
    const payload = {
      status: "failure",
      monitor: { name: "web-app" },
    };

    const result = parseUptimeEvent(payload);
    expect(result.eventType).toBe("down");
    expect(result.metadata.monitor).toBe("web-app");
  });

  it("handles alert state as down", () => {
    const payload = {
      state: "alert",
      name: "database",
    };

    const result = parseUptimeEvent(payload);
    expect(result.eventType).toBe("down");
    expect(result.metadata.monitor).toBe("database");
  });
});

// ── Custom Event Parsing ────────────────────────────────────────────

describe("parseCustomEvent", () => {
  it("passes through custom fields", () => {
    const payload = {
      eventType: "deployment",
      eventId: "deploy-123",
      metadata: { repo: "owner/repo", severity: "low" },
      agentTarget: "ops",
    };

    const result = parseCustomEvent(payload);
    expect(result.eventType).toBe("deployment");
    expect(result.eventId).toBe("custom-deploy-123");
    expect(result.metadata.repo).toBe("owner/repo");
    expect(result.agentTarget).toBe("ops");
  });

  it("defaults when fields are missing", () => {
    const payload = {};

    const result = parseCustomEvent(payload);
    expect(result.eventType).toBe("custom");
    expect(result.eventId).toMatch(/^custom-/);
    expect(result.agentTarget).toBeUndefined();
  });
});

// ── Request Handler (routing + integration) ─────────────────────────

describe("createHandler", () => {
  const writeToConvex = vi.fn().mockResolvedValue(undefined);

  const handler = createHandler({
    verifiers: {
      github: async () => true,
      sentry: () => true,
      uptime: () => true,
      custom: () => true,
    },
    writeToConvex,
  });

  beforeEach(() => {
    writeToConvex.mockClear();
  });

  // ── Health check ────────────────────────────────────────────────

  it("responds to GET /health", async () => {
    const req = new Request("http://localhost:8790/health", { method: "GET" });
    const res = await handler(req);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("ok");
  });

  // ── Method rejection ────────────────────────────────────────────

  it("rejects non-POST methods", async () => {
    const req = new Request("http://localhost:8790/webhook/github", {
      method: "PUT",
    });
    const res = await handler(req);
    expect(res.status).toBe(405);
  });

  // ── Path validation ─────────────────────────────────────────────

  it("returns 404 for missing source in path", async () => {
    const req = new Request("http://localhost:8790/webhook", {
      method: "POST",
      body: "{}",
    });
    const res = await handler(req);
    expect(res.status).toBe(404);
  });

  // ── Signature rejection ─────────────────────────────────────────

  it("rejects requests with invalid signature", async () => {
    const rejectHandler = createHandler({
      verifiers: {
        github: async () => false,
        sentry: () => false,
        uptime: () => false,
        custom: () => false,
      },
      writeToConvex,
    });

    const req = new Request("http://localhost:8790/webhook/github", {
      method: "POST",
      body: '{"action":"submitted"}',
      headers: { "x-hub-signature-256": "sha256=bad" },
    });
    const res = await rejectHandler(req);
    expect(res.status).toBe(401);
  });

  // ── Invalid JSON ────────────────────────────────────────────────

  it("returns 400 for malformed JSON body", async () => {
    const req = new Request("http://localhost:8790/webhook/github", {
      method: "POST",
      body: "not valid json {{{",
      headers: { "x-github-event": "push" },
    });
    const res = await handler(req);
    expect(res.status).toBe(400);
  });

  // ── GitHub routing ──────────────────────────────────────────────

  it("routes GitHub push event to Convex", async () => {
    const payload = {
      head_commit: { id: "abc123", message: "fix: bug", url: "https://github.com/o/r/commit/abc123" },
      pusher: { name: "dev" },
      repository: { full_name: "owner/repo" },
    };

    const req = new Request("http://localhost:8790/webhook/github", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "x-github-event": "push" },
    });
    const res = await handler(req);
    const body = await res.json();

    expect(body.status).toBe("queued");
    expect(body.eventId).toBe("github-abc123");
    expect(writeToConvex).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "github",
        eventType: "push",
        eventId: "github-abc123",
        agentTarget: "backend",
      })
    );
  });

  // ── Sentry routing ─────────────────────────────────────────────

  it("routes Sentry issue to Convex", async () => {
    const payload = {
      action: "created",
      data: {
        issue: {
          id: "99",
          title: "NullPointerException",
          level: "error",
        },
      },
    };

    const req = new Request("http://localhost:8790/webhook/sentry", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "sentry-hook-signature": "valid" },
    });
    const res = await handler(req);
    const body = await res.json();

    expect(body.status).toBe("queued");
    expect(writeToConvex).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "sentry",
        eventType: "issue.created",
        agentTarget: "ops",
      })
    );
  });

  // ── Uptime routing ─────────────────────────────────────────────

  it("routes uptime down event to Convex", async () => {
    const payload = {
      status: "down",
      monitor: "web-app",
      url: "https://example.com",
    };

    const req = new Request("http://localhost:8790/webhook/uptime", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "x-webhook-secret": "valid" },
    });
    const res = await handler(req);
    const body = await res.json();

    expect(body.status).toBe("queued");
    expect(writeToConvex).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "uptime",
        eventType: "down",
        agentTarget: "ops",
      })
    );
  });

  // ── Custom routing ─────────────────────────────────────────────

  it("routes custom event to Convex", async () => {
    const payload = {
      eventType: "deploy",
      eventId: "d-1",
      metadata: { repo: "owner/repo" },
      agentTarget: "ops",
    };

    const req = new Request("http://localhost:8790/webhook/custom", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "x-webhook-secret": "valid" },
    });
    const res = await handler(req);
    const body = await res.json();

    expect(body.status).toBe("queued");
    expect(writeToConvex).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "custom",
        eventType: "deploy",
        eventId: "custom-d-1",
        agentTarget: "ops",
      })
    );
  });

  // ── Unknown source falls through to custom verifier ─────────────

  it("handles unknown source with custom verifier", async () => {
    const payload = { eventType: "alert", eventId: "a-1" };

    const req = new Request("http://localhost:8790/webhook/pagerduty", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "x-webhook-secret": "valid" },
    });
    const res = await handler(req);
    const body = await res.json();

    expect(body.status).toBe("queued");
    expect(writeToConvex).toHaveBeenCalledWith(
      expect.objectContaining({ source: "pagerduty" })
    );
  });

  // ── Deduplication (via eventId) ─────────────────────────────────

  it("generates consistent eventIds for deduplication", async () => {
    const payload = {
      head_commit: { id: "same-commit", message: "test", url: "https://example.com" },
      pusher: { name: "dev" },
      repository: { full_name: "owner/repo" },
    };

    const req1 = new Request("http://localhost:8790/webhook/github", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "x-github-event": "push" },
    });
    const req2 = new Request("http://localhost:8790/webhook/github", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "x-github-event": "push" },
    });

    await handler(req1);
    await handler(req2);

    // Both calls should produce the same eventId for Convex dedup
    const call1 = writeToConvex.mock.calls[0][0];
    const call2 = writeToConvex.mock.calls[1][0];
    expect(call1.eventId).toBe(call2.eventId);
    expect(call1.eventId).toBe("github-same-commit");
  });

  // ── Source normalization ────────────────────────────────────────

  it("normalizes source to lowercase", async () => {
    const payload = { eventType: "test" };

    const req = new Request("http://localhost:8790/webhook/GitHub", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "x-webhook-secret": "valid" },
    });
    // Note: "GitHub" in the URL will be lowercased, but the verifier used
    // will be custom (default), not github. This tests source normalization.
    // The handler lowercases the source from the URL.
    const res = await handler(req);
    const body = await res.json();
    expect(body.status).toBe("queued");
    expect(writeToConvex).toHaveBeenCalledWith(
      expect.objectContaining({ source: "github" })
    );
  });
});
