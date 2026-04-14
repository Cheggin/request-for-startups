import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/gh.js", () => ({
  execGh: vi.fn(),
  execGhJson: vi.fn(),
}));

import { execGh, execGhJson } from "../src/gh.js";
import {
  postAuditComment,
  postPickupComment,
  postCompletionComment,
  postVerificationComment,
  getIssueComments,
  getRecentAuditComments,
} from "../src/audit-trail.js";

const mockExecGh = vi.mocked(execGh);
const mockExecGhJson = vi.mocked(execGhJson);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("postAuditComment", () => {
  it("posts a structured markdown comment", async () => {
    mockExecGh.mockResolvedValue({ stdout: "", stderr: "", exitCode: 0 });

    await postAuditComment(42, {
      agentId: "backend-agent",
      action: "Task Pickup",
      details: "Starting work.",
    });

    expect(mockExecGh).toHaveBeenCalledOnce();
    const args = mockExecGh.mock.calls[0][0];
    expect(args[0]).toBe("issue");
    expect(args[1]).toBe("comment");
    expect(args[2]).toBe("42");
    expect(args[3]).toBe("--body");

    const body = args[4];
    expect(body).toContain("## Audit: Task Pickup");
    expect(body).toContain("backend-agent");
    expect(body).toContain("Starting work.");
  });

  it("includes files changed section", async () => {
    mockExecGh.mockResolvedValue({ stdout: "", stderr: "", exitCode: 0 });

    await postAuditComment(42, {
      agentId: "agent-1",
      action: "Completed",
      filesChanged: ["src/auth.ts", "src/login.ts"],
    });

    const body = mockExecGh.mock.calls[0][0][4];
    expect(body).toContain("### Files Changed");
    expect(body).toContain("`src/auth.ts`");
    expect(body).toContain("`src/login.ts`");
  });

  it("includes test results and deploy status", async () => {
    mockExecGh.mockResolvedValue({ stdout: "", stderr: "", exitCode: 0 });

    await postAuditComment(42, {
      agentId: "agent-1",
      action: "Verified",
      testResults: "12 passed, 0 failed",
      deployStatus: "Deployed to staging",
    });

    const body = mockExecGh.mock.calls[0][0][4];
    expect(body).toContain("### Test Results");
    expect(body).toContain("12 passed, 0 failed");
    expect(body).toContain("### Deploy Status");
    expect(body).toContain("Deployed to staging");
  });
});

describe("postPickupComment", () => {
  it("posts pickup comment with agent ID", async () => {
    mockExecGh.mockResolvedValue({ stdout: "", stderr: "", exitCode: 0 });
    await postPickupComment(10, "website-agent");

    const body = mockExecGh.mock.calls[0][0][4];
    expect(body).toContain("Task Pickup");
    expect(body).toContain("website-agent");
  });
});

describe("postCompletionComment", () => {
  it("posts completion with files and tests", async () => {
    mockExecGh.mockResolvedValue({ stdout: "", stderr: "", exitCode: 0 });
    await postCompletionComment(10, "agent-1", ["src/app.ts"], ["tests/app.test.ts"]);

    const body = mockExecGh.mock.calls[0][0][4];
    expect(body).toContain("Task Completed");
    expect(body).toContain("`src/app.ts`");
    expect(body).toContain("### Tests Written");
    expect(body).toContain("`tests/app.test.ts`");
  });
});

describe("postVerificationComment", () => {
  it("posts verification with test results and deploy", async () => {
    mockExecGh.mockResolvedValue({ stdout: "", stderr: "", exitCode: 0 });
    await postVerificationComment(10, "agent-1", "All passed", "Deployed");

    const body = mockExecGh.mock.calls[0][0][4];
    expect(body).toContain("Verification Passed");
    expect(body).toContain("All passed");
    expect(body).toContain("Deployed");
  });
});

describe("getIssueComments", () => {
  it("fetches comments via gh issue view", async () => {
    const mockComments = [
      { id: "1", body: "## Audit: Pickup", author: { login: "bot" }, createdAt: "2026-04-13T00:00:00Z" },
    ];
    mockExecGhJson.mockResolvedValue(mockComments);

    const comments = await getIssueComments(42);
    expect(comments).toHaveLength(1);
    const args = mockExecGhJson.mock.calls[0][0];
    expect(args).toContain("view");
    expect(args).toContain("--json");
    expect(args).toContain("comments");
  });
});

describe("getRecentAuditComments", () => {
  it("filters to audit comments only", async () => {
    const mockComments = [
      { id: "1", body: "## Audit: Pickup\nDetails", author: { login: "bot" }, createdAt: "2026-04-13T00:00:00Z" },
      { id: "2", body: "Regular comment", author: { login: "user" }, createdAt: "2026-04-13T01:00:00Z" },
      { id: "3", body: "## Audit: Completed\nDone", author: { login: "bot" }, createdAt: "2026-04-13T02:00:00Z" },
    ];
    mockExecGhJson.mockResolvedValue(mockComments);

    const auditComments = await getRecentAuditComments(42);
    expect(auditComments).toHaveLength(2);
    expect(auditComments[0].body).toContain("Pickup");
    expect(auditComments[1].body).toContain("Completed");
  });

  it("respects limit", async () => {
    const mockComments = Array.from({ length: 20 }, (_, i) => ({
      id: String(i),
      body: `## Audit: Action ${i}`,
      author: { login: "bot" },
      createdAt: `2026-04-13T${String(i).padStart(2, "0")}:00:00Z`,
    }));
    mockExecGhJson.mockResolvedValue(mockComments);

    const auditComments = await getRecentAuditComments(42, 5);
    expect(auditComments).toHaveLength(5);
  });
});
