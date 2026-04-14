import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/gh.js", () => ({
  execGh: vi.fn(),
  execGhJson: vi.fn(),
}));

import { execGhJson } from "../src/gh.js";
import { rebuildContext, formatHandoffMarkdown } from "../src/context-rebuild.js";

const mockExecGhJson = vi.mocked(execGhJson);

beforeEach(() => {
  vi.clearAllMocks();
});

function makeIssue(overrides: Record<string, any> = {}) {
  return {
    number: 1,
    title: "Test Issue",
    body: "## Acceptance Criteria\n- Must pass tests\n- Must deploy",
    state: "OPEN",
    labels: [{ name: "feature" }, { name: "backend" }],
    assignees: [{ login: "agent-1" }],
    url: "https://github.com/org/repo/issues/1",
    createdAt: "2026-04-13T00:00:00Z",
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("rebuildContext", () => {
  it("rebuilds context from open issues", async () => {
    const issues = [
      makeIssue({ number: 1, title: "Login flow", labels: [{ name: "backend" }, { name: "feature" }] }),
      makeIssue({ number: 2, title: "Dashboard", labels: [{ name: "website" }, { name: "in progress" }] }),
      makeIssue({ number: 3, title: "Deploy scripts", labels: [{ name: "ops" }, { name: "chore" }] }),
    ];

    // First call: searchIssues
    mockExecGhJson.mockResolvedValueOnce(issues);
    // Subsequent calls: getRecentAuditComments for each issue (3x)
    mockExecGhJson.mockResolvedValue([]);

    const doc = await rebuildContext();

    expect(doc.totalOpen).toBe(3);
    expect(doc.sections).toHaveLength(4); // 4 columns
    expect(doc.generatedAt).toBeTruthy();
  });

  it("categorizes issues into correct columns by label", async () => {
    const issues = [
      makeIssue({ number: 1, labels: [{ name: "in progress" }] }),
      makeIssue({ number: 2, labels: [{ name: "review" }] }),
      makeIssue({ number: 3, labels: [{ name: "done" }] }),
      makeIssue({ number: 4, labels: [{ name: "feature" }] }), // no column label -> Backlog
    ];

    mockExecGhJson.mockResolvedValueOnce(issues);
    mockExecGhJson.mockResolvedValue([]);

    const doc = await rebuildContext();

    const backlog = doc.sections.find((s) => s.column === "Backlog");
    const inProgress = doc.sections.find((s) => s.column === "In Progress");
    const inReview = doc.sections.find((s) => s.column === "In Review");
    const done = doc.sections.find((s) => s.column === "Done");

    expect(backlog!.issues).toHaveLength(1);
    expect(inProgress!.issues).toHaveLength(1);
    expect(inReview!.issues).toHaveLength(1);
    expect(done!.issues).toHaveLength(1);
  });

  it("detects stale issues in progress", async () => {
    const staleDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(); // 48h ago
    const issues = [
      makeIssue({
        number: 99,
        labels: [{ name: "in progress" }],
        updatedAt: staleDate,
      }),
    ];

    mockExecGhJson.mockResolvedValueOnce(issues);
    mockExecGhJson.mockResolvedValue([]);

    const doc = await rebuildContext(24);

    expect(doc.staleIssues).toContain(99);
    const inProgress = doc.sections.find((s) => s.column === "In Progress");
    expect(inProgress!.issues[0].isStale).toBe(true);
  });

  it("extracts acceptance criteria from issue body", async () => {
    const issues = [
      makeIssue({
        number: 1,
        body: "## Acceptance Criteria\n- Login works\n- Session persists\n\n## Notes\nSome notes",
      }),
    ];

    mockExecGhJson.mockResolvedValueOnce(issues);
    mockExecGhJson.mockResolvedValue([]);

    const doc = await rebuildContext();
    const backlog = doc.sections.find((s) => s.column === "Backlog");
    expect(backlog!.issues[0].acceptanceCriteria).toContain("Login works");
    expect(backlog!.issues[0].acceptanceCriteria).toContain("Session persists");
  });

  it("identifies assigned agent from labels", async () => {
    const issues = [
      makeIssue({ number: 1, labels: [{ name: "website" }, { name: "feature" }] }),
    ];

    mockExecGhJson.mockResolvedValueOnce(issues);
    mockExecGhJson.mockResolvedValue([]);

    const doc = await rebuildContext();
    const backlog = doc.sections.find((s) => s.column === "Backlog");
    expect(backlog!.issues[0].assignedAgent).toBe("website");
  });

  it("handles zero open issues", async () => {
    mockExecGhJson.mockResolvedValueOnce([]);

    const doc = await rebuildContext();
    expect(doc.totalOpen).toBe(0);
    expect(doc.staleIssues).toHaveLength(0);
  });
});

describe("formatHandoffMarkdown", () => {
  it("produces valid markdown with frontmatter", async () => {
    const issues = [
      makeIssue({ number: 1, title: "Task A" }),
    ];

    mockExecGhJson.mockResolvedValueOnce(issues);
    mockExecGhJson.mockResolvedValue([]);

    const doc = await rebuildContext();
    const md = formatHandoffMarkdown(doc);

    expect(md).toContain("---");
    expect(md).toContain("generated:");
    expect(md).toContain("total_open: 1");
    expect(md).toContain("# Context Rebuild Summary");
    expect(md).toContain("#1: Task A");
  });
});
