import { describe, it, expect } from "bun:test";
import { classifyTask, buildTaskFromIssue, buildTaskFromPrompt } from "../src/dispatcher.js";
import type { Issue } from "@harness/github-state";
import type { Task } from "../src/types.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    number: 42,
    title: "Test issue",
    body: "Some body text",
    state: "open",
    labels: [],
    assignees: [],
    url: "https://github.com/test/repo/issues/42",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "42",
    title: "Test task",
    body: "Some body text",
    source: "github_issue",
    labels: [],
    filePaths: [],
    dependsOn: [],
    ...overrides,
  };
}

// ─── classifyTask ───────────────────────────────────────────────────────────

describe("classifyTask", () => {
  it("routes by label when a direct label match exists", () => {
    const task = makeTask({ labels: ["backend"] });
    const result = classifyTask(task);
    expect(result.agent).toBe("backend");
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    expect(result.signals.some((s) => s.type === "label")).toBe(true);
  });

  it("routes by label alias (frontend -> website)", () => {
    const task = makeTask({ labels: ["frontend"] });
    const result = classifyTask(task);
    expect(result.agent).toBe("website");
  });

  it("routes by file path patterns", () => {
    const task = makeTask({
      filePaths: ["packages/api/src/routes.ts"],
      labels: [],
    });
    const result = classifyTask(task);
    expect(result.agent).toBe("backend");
    expect(result.signals.some((s) => s.type === "file_path")).toBe(true);
  });

  it("routes by keyword in title", () => {
    const task = makeTask({
      title: "Build new landing page for signup",
      body: "",
      labels: [],
    });
    const result = classifyTask(task);
    expect(result.agent).toBe("website");
    expect(result.signals.some((s) => s.type === "keyword")).toBe(true);
  });

  it("routes by keyword in body", () => {
    const task = makeTask({
      title: "New feature",
      body: "We need a REST API endpoint for user profiles",
      labels: [],
    });
    const result = classifyTask(task);
    expect(result.agent).toBe("backend");
  });

  it("falls back to ops when no signals match", () => {
    const task = makeTask({
      title: "Miscellaneous cleanup",
      body: "nothing specific",
      labels: [],
    });
    const result = classifyTask(task);
    expect(result.agent).toBe("ops");
    expect(result.confidence).toBeLessThan(0.5);
  });

  it("prefers label over keyword when both present", () => {
    const task = makeTask({
      title: "Build landing page with API integration",
      labels: ["backend"],
    });
    const result = classifyTask(task);
    expect(result.agent).toBe("backend");
  });

  it("aggregates multiple keyword matches for higher confidence", () => {
    const task = makeTask({
      title: "Build React component with Tailwind CSS",
      body: "Create a responsive layout for the landing page using Next.js",
      labels: [],
    });
    const result = classifyTask(task);
    expect(result.agent).toBe("website");
    expect(result.confidence).toBeGreaterThan(0.5);
  });
});

// ─── buildTaskFromIssue ─────────────────────────────────────────────────────

describe("buildTaskFromIssue", () => {
  it("maps issue fields to task", () => {
    const issue = makeIssue({
      number: 99,
      title: "Fix login bug",
      body: "Auth endpoint returns 500",
      labels: [{ name: "backend" }, { name: "bug" }],
    });
    const task = buildTaskFromIssue(issue);
    expect(task.id).toBe("99");
    expect(task.title).toBe("Fix login bug");
    expect(task.source).toBe("github_issue");
    expect(task.labels).toEqual(["backend", "bug"]);
    expect(task.issue).toBe(issue);
  });

  it("extracts file paths from body", () => {
    const issue = makeIssue({
      body: "Fix the file at packages/api/src/auth.ts and also packages/api/src/users.ts",
    });
    const task = buildTaskFromIssue(issue);
    expect(task.filePaths).toContain("packages/api/src/auth.ts");
    expect(task.filePaths).toContain("packages/api/src/users.ts");
  });

  it("extracts depends-on references from body", () => {
    const issue = makeIssue({
      body: "Depends on #10 and #15\n\nAlso blocked by #20",
    });
    const task = buildTaskFromIssue(issue);
    expect(task.dependsOn).toContain("10");
    expect(task.dependsOn).toContain("15");
    expect(task.dependsOn).toContain("20");
  });
});

// ─── buildTaskFromPrompt ────────────────────────────────────────────────────

describe("buildTaskFromPrompt", () => {
  it("creates a task from a direct prompt string", () => {
    const task = buildTaskFromPrompt("Deploy the new landing page");
    expect(task.source).toBe("direct_prompt");
    expect(task.title).toBe("Deploy the new landing page");
    expect(task.id).toBeTruthy();
    expect(task.labels).toEqual([]);
  });
});
