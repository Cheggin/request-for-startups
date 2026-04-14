import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the gh module before importing anything that uses it
vi.mock("../src/gh.js", () => ({
  execGh: vi.fn(),
  execGhJson: vi.fn(),
}));

import { execGh, execGhJson } from "../src/gh.js";
import {
  createIssue,
  updateIssue,
  closeIssue,
  getIssue,
  searchIssues,
  getAssignedAgent,
} from "../src/issues.js";

const mockExecGh = vi.mocked(execGh);
const mockExecGhJson = vi.mocked(execGhJson);

const SAMPLE_ISSUE = {
  number: 42,
  title: "Implement login flow",
  body: "## Acceptance Criteria\n- User can log in",
  state: "OPEN",
  labels: [{ name: "feature" }, { name: "backend" }],
  assignees: [{ login: "agent-1" }],
  url: "https://github.com/org/repo/issues/42",
  createdAt: "2026-04-13T00:00:00Z",
  updatedAt: "2026-04-13T00:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createIssue", () => {
  it("creates an issue with title and body", async () => {
    mockExecGhJson.mockResolvedValue(SAMPLE_ISSUE);

    const result = await createIssue({
      title: "Implement login flow",
      body: "## Acceptance Criteria\n- User can log in",
    });

    expect(mockExecGhJson).toHaveBeenCalledOnce();
    const args = mockExecGhJson.mock.calls[0][0];
    expect(args).toContain("issue");
    expect(args).toContain("create");
    expect(args).toContain("--title");
    expect(args).toContain("Implement login flow");
    expect(result.number).toBe(42);
  });

  it("applies agent and category labels", async () => {
    mockExecGhJson.mockResolvedValue(SAMPLE_ISSUE);

    await createIssue({
      title: "Fix auth bug",
      body: "Details",
      agentLabel: "backend",
      categoryLabel: "bug",
    });

    const args = mockExecGhJson.mock.calls[0][0];
    const labelIdx = args.indexOf("--label");
    expect(labelIdx).toBeGreaterThan(-1);
    const labelValue = args[labelIdx + 1];
    expect(labelValue).toContain("backend");
    expect(labelValue).toContain("bug");
  });

  it("includes assignee when provided", async () => {
    mockExecGhJson.mockResolvedValue(SAMPLE_ISSUE);

    await createIssue({
      title: "Task",
      body: "Body",
      assignee: "agent-1",
    });

    const args = mockExecGhJson.mock.calls[0][0];
    expect(args).toContain("--assignee");
    expect(args).toContain("agent-1");
  });
});

describe("updateIssue", () => {
  it("updates title and adds labels", async () => {
    mockExecGh.mockResolvedValue({ stdout: "", stderr: "", exitCode: 0 });
    mockExecGhJson.mockResolvedValue({ ...SAMPLE_ISSUE, title: "Updated" });

    const result = await updateIssue(42, {
      title: "Updated",
      addLabels: ["urgent"],
    });

    // First call is edit, then getIssue
    expect(mockExecGh).toHaveBeenCalledOnce();
    const editArgs = mockExecGh.mock.calls[0][0];
    expect(editArgs).toContain("edit");
    expect(editArgs).toContain("--title");
    expect(editArgs).toContain("--add-label");
    expect(result.title).toBe("Updated");
  });

  it("closes issue when state is closed", async () => {
    mockExecGh.mockResolvedValue({ stdout: "", stderr: "", exitCode: 0 });
    mockExecGhJson.mockResolvedValue({ ...SAMPLE_ISSUE, state: "CLOSED" });

    await updateIssue(42, { state: "closed" });

    // Should call edit then close then getIssue
    expect(mockExecGh).toHaveBeenCalledTimes(2);
    const closeArgs = mockExecGh.mock.calls[1][0];
    expect(closeArgs).toContain("close");
  });
});

describe("closeIssue", () => {
  it("calls gh issue close", async () => {
    mockExecGh.mockResolvedValue({ stdout: "", stderr: "", exitCode: 0 });
    await closeIssue(42);
    expect(mockExecGh).toHaveBeenCalledWith(["issue", "close", "42"]);
  });
});

describe("getIssue", () => {
  it("fetches issue by number with JSON fields", async () => {
    mockExecGhJson.mockResolvedValue(SAMPLE_ISSUE);
    const result = await getIssue(42);
    expect(result.number).toBe(42);
    const args = mockExecGhJson.mock.calls[0][0];
    expect(args).toContain("view");
    expect(args).toContain("42");
    expect(args).toContain("--json");
  });
});

describe("searchIssues", () => {
  it("lists open issues by default", async () => {
    mockExecGhJson.mockResolvedValue([SAMPLE_ISSUE]);
    const results = await searchIssues({});
    expect(results).toHaveLength(1);
    const args = mockExecGhJson.mock.calls[0][0];
    expect(args).toContain("--state");
    expect(args).toContain("open");
  });

  it("filters by labels", async () => {
    mockExecGhJson.mockResolvedValue([SAMPLE_ISSUE]);
    await searchIssues({ labels: ["backend", "feature"] });
    const args = mockExecGhJson.mock.calls[0][0];
    expect(args).toContain("--label");
    expect(args).toContain("backend,feature");
  });

  it("respects custom limit", async () => {
    mockExecGhJson.mockResolvedValue([]);
    await searchIssues({ limit: 50 });
    const args = mockExecGhJson.mock.calls[0][0];
    expect(args).toContain("--limit");
    expect(args).toContain("50");
  });
});

describe("getAssignedAgent", () => {
  it("returns agent label when present", async () => {
    mockExecGhJson.mockResolvedValue(SAMPLE_ISSUE);
    const agent = await getAssignedAgent(42);
    expect(agent).toBe("backend");
  });

  it("returns null when no agent label", async () => {
    mockExecGhJson.mockResolvedValue({
      ...SAMPLE_ISSUE,
      labels: [{ name: "feature" }],
    });
    const agent = await getAssignedAgent(42);
    expect(agent).toBeNull();
  });
});
