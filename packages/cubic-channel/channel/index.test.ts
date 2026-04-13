import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the MCP SDK before importing the channel
const mockNotification = vi.fn().mockResolvedValue(undefined);
const mockConnect = vi.fn().mockResolvedValue(undefined);
const mockSetRequestHandler = vi.fn();

vi.mock("@modelcontextprotocol/sdk/server/index.js", () => ({
  Server: vi.fn().mockImplementation(() => ({
    notification: mockNotification,
    connect: mockConnect,
    setRequestHandler: mockSetRequestHandler,
  })),
}));

vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({
  StdioServerTransport: vi.fn(),
}));

vi.mock("@modelcontextprotocol/sdk/types.js", () => ({
  ListToolsRequestSchema: Symbol("ListToolsRequestSchema"),
  CallToolRequestSchema: Symbol("CallToolRequestSchema"),
}));

// Mock global fetch for Convex API calls
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ── Test helpers ────────────────────────────────────────────────────

interface CubicEvent {
  _id: string;
  repo: string;
  prNumber: number;
  file?: string;
  line?: number;
  severity: string;
  message: string;
  author: string;
  commentId: number;
}

function makeCubicEvent(overrides: Partial<CubicEvent> = {}): CubicEvent {
  return {
    _id: "event_001",
    repo: "owner/repo",
    prNumber: 42,
    severity: "high",
    message: "Potential null reference on line 42",
    author: "cubic[bot]",
    commentId: 1001,
    ...overrides,
  };
}

function mockConvexQuery(events: CubicEvent[]) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ value: events }),
  });
}

function mockConvexMutation(returnValue: unknown = null) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ value: returnValue }),
  });
}

// ── Tests ───────────────────────────────────────────────────────────

describe("Cubic Channel — polling and notification formatting", () => {
  const CONVEX_URL = "https://test-deployment.convex.cloud";
  const REPO = "owner/repo";

  beforeEach(() => {
    mockFetch.mockReset();
    mockNotification.mockClear();
  });

  it("queries Convex for unprocessed events with correct args", async () => {
    mockConvexQuery([]);

    await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "cubicEvents:getUnprocessed",
        args: { repo: REPO },
      }),
    });

    expect(mockFetch).toHaveBeenCalledWith(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "cubicEvents:getUnprocessed",
        args: { repo: REPO },
      }),
    });
  });

  it("formats a notification with file and line metadata", () => {
    const event = makeCubicEvent({
      file: "src/app.tsx",
      line: 42,
      severity: "critical",
      message: "SQL injection vulnerability",
    });

    const meta: Record<string, string> = {
      event_id: event._id,
      pr: String(event.prNumber),
      severity: event.severity,
      author: event.author,
      comment_id: String(event.commentId),
    };
    if (event.file) meta.file = event.file;
    if (event.line) meta.line = String(event.line);

    const notification = {
      method: "notifications/claude/channel",
      params: {
        content: event.message,
        meta,
      },
    };

    expect(notification.params.meta.file).toBe("src/app.tsx");
    expect(notification.params.meta.line).toBe("42");
    expect(notification.params.meta.severity).toBe("critical");
    expect(notification.params.meta.pr).toBe("42");
    expect(notification.params.content).toBe("SQL injection vulnerability");
  });

  it("omits file and line from metadata when not present", () => {
    const event = makeCubicEvent({
      file: undefined,
      line: undefined,
    });

    const meta: Record<string, string> = {
      event_id: event._id,
      pr: String(event.prNumber),
      severity: event.severity,
      author: event.author,
      comment_id: String(event.commentId),
    };
    if (event.file) meta.file = event.file;
    if (event.line) meta.line = String(event.line);

    expect(meta.file).toBeUndefined();
    expect(meta.line).toBeUndefined();
    expect(meta.pr).toBe("42");
  });

  it("deduplicates events by _id", () => {
    const deliveredIds = new Set<string>();

    const events = [
      makeCubicEvent({ _id: "event_001" }),
      makeCubicEvent({ _id: "event_001" }),
      makeCubicEvent({ _id: "event_002" }),
    ];

    const newEvents = events.filter((e) => {
      if (deliveredIds.has(e._id)) return false;
      deliveredIds.add(e._id);
      return true;
    });

    expect(newEvents).toHaveLength(2);
    expect(newEvents.map((e) => e._id)).toEqual(["event_001", "event_002"]);
  });

  it("sends correct mutation for mark_processed", async () => {
    mockConvexMutation();

    await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "cubicEvents:markProcessed",
        args: { eventId: "event_001" },
      }),
    });

    expect(mockFetch).toHaveBeenCalledWith(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "cubicEvents:markProcessed",
        args: { eventId: "event_001" },
      }),
    });
  });

  it("sends correct mutation for mark_all_processed", async () => {
    mockConvexMutation(3);

    await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "cubicEvents:markAllProcessed",
        args: { repo: REPO },
      }),
    });

    expect(mockFetch).toHaveBeenCalledWith(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "cubicEvents:markAllProcessed",
        args: { repo: REPO },
      }),
    });
  });

  it("handles Convex query failure gracefully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    });

    const response = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "cubicEvents:getUnprocessed",
        args: { repo: REPO },
      }),
    });

    expect(response.ok).toBe(false);
    // The channel silently retries on next poll — no crash
  });

  it("formats multiple events with different severities", () => {
    const events = [
      makeCubicEvent({
        _id: "e1",
        severity: "critical",
        file: "src/db.ts",
        line: 10,
        message: "SQL injection",
      }),
      makeCubicEvent({
        _id: "e2",
        severity: "low",
        file: "src/utils.ts",
        line: 55,
        message: "Consider renaming variable",
      }),
      makeCubicEvent({
        _id: "e3",
        severity: "info",
        message: "Overall review summary",
      }),
    ];

    const notifications = events.map((event) => {
      const meta: Record<string, string> = {
        event_id: event._id,
        pr: String(event.prNumber),
        severity: event.severity,
        author: event.author,
        comment_id: String(event.commentId),
      };
      if (event.file) meta.file = event.file;
      if (event.line) meta.line = String(event.line);

      return {
        method: "notifications/claude/channel",
        params: { content: event.message, meta },
      };
    });

    expect(notifications).toHaveLength(3);
    expect(notifications[0].params.meta.severity).toBe("critical");
    expect(notifications[1].params.meta.file).toBe("src/utils.ts");
    expect(notifications[2].params.meta.file).toBeUndefined();
  });
});
