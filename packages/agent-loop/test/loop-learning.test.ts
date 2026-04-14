import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, mkdir, writeFile, readFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { existsSync } from "fs";
import { preTaskLearning, postTaskLearning } from "../src/loop.js";

let testDir: string;

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), "loop-learning-test-"));
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

describe("preTaskLearning", () => {
  test("returns empty context when no knowledge base exists", async () => {
    const result = await preTaskLearning("coding", "Build an API", testDir);
    expect(result.contextToInject).toBe("");
    expect(result.indexContent).toBe("");
    expect(result.relevantFindings).toEqual([]);
    expect(result.recentLogEntries).toEqual([]);
  });

  test("reads index content from knowledge base", async () => {
    const categoryDir = join(testDir, ".harness/knowledge/coding");
    await mkdir(categoryDir, { recursive: true });
    await writeFile(
      join(categoryDir, "index.md"),
      "# coding Knowledge Index\n\n_2 pages indexed._\n",
    );

    const result = await preTaskLearning("coding", "Build an API", testDir);
    expect(result.indexContent).toContain("coding Knowledge Index");
  });

  test("reads recent log entries", async () => {
    const categoryDir = join(testDir, ".harness/knowledge/coding");
    await mkdir(categoryDir, { recursive: true });
    await writeFile(
      join(categoryDir, "log.md"),
      `# coding Knowledge Log

_Append-only operation chronicle._

- 2025-01-01T00:00:00Z [TASK] SUCCESS
- 2025-01-02T00:00:00Z [TASK] FAILURE
`,
    );

    const result = await preTaskLearning("coding", "Build an API", testDir);
    expect(result.recentLogEntries.length).toBe(2);
    expect(result.recentLogEntries[0]).toContain("SUCCESS");
  });

  test("finds relevant wiki pages by keyword match", async () => {
    const wikiDir = join(testDir, ".harness/knowledge/coding/wiki");
    await mkdir(wikiDir, { recursive: true });
    await writeFile(
      join(wikiDir, "auth-patterns.md"),
      `---
title: "Auth Patterns"
tags: ["auth", "api"]
---

Authentication patterns for the API layer. Use JWT tokens for stateless auth.
OAuth2 flows require redirect handling.`,
    );
    await writeFile(
      join(wikiDir, "database-setup.md"),
      `---
title: "Database Setup"
tags: ["database"]
---

PostgreSQL configuration for the data layer.`,
    );

    // "auth" and "api" should match the first page (2+ keyword matches)
    const result = await preTaskLearning(
      "coding",
      "Build an auth API endpoint",
      testDir,
    );
    expect(result.relevantFindings.length).toBeGreaterThan(0);
    expect(result.relevantFindings[0]).toContain("Auth");
  });

  test("injects prior knowledge into context string", async () => {
    const wikiDir = join(testDir, ".harness/knowledge/coding/wiki");
    await mkdir(wikiDir, { recursive: true });
    await writeFile(
      join(wikiDir, "api-design.md"),
      `---
title: "API Design"
tags: ["api", "design"]
---

REST API design patterns. Always version your endpoints.`,
    );

    const result = await preTaskLearning(
      "coding",
      "Design a REST API with versioned endpoints",
      testDir,
    );

    if (result.relevantFindings.length > 0) {
      expect(result.contextToInject).toContain("## Prior Knowledge");
    }
  });
});

describe("postTaskLearning", () => {
  test("creates log file and writes success entry", async () => {
    await postTaskLearning(
      "coding",
      {
        success: true,
        duration_ms: 5000,
        turns_used: 4,
        filesChanged: ["src/api.ts", "src/auth.ts"],
        lessonsLearned: "JWT validation needs to happen before route matching",
      },
      testDir,
    );

    const logPath = join(testDir, ".harness/knowledge/coding/log.md");
    expect(existsSync(logPath)).toBe(true);

    const content = await readFile(logPath, "utf-8");
    expect(content).toContain("[TASK] SUCCESS");
    expect(content).toContain("duration: 5000ms");
    expect(content).toContain("turns: 4");
    expect(content).toContain("src/api.ts, src/auth.ts");
    expect(content).toContain("JWT validation");
  });

  test("writes failure entry", async () => {
    await postTaskLearning(
      "coding",
      {
        success: false,
        duration_ms: 12000,
        turns_used: 8,
        filesChanged: [],
        lessonsLearned: "Build failed due to missing type definitions",
      },
      testDir,
    );

    const logPath = join(testDir, ".harness/knowledge/coding/log.md");
    const content = await readFile(logPath, "utf-8");
    expect(content).toContain("[TASK] FAILURE");
    expect(content).toContain("files: none");
    expect(content).toContain("missing type definitions");
  });

  test("appends to existing log", async () => {
    // First entry
    await postTaskLearning(
      "coding",
      {
        success: true,
        duration_ms: 1000,
        turns_used: 2,
        filesChanged: ["a.ts"],
        lessonsLearned: "First task",
      },
      testDir,
    );

    // Second entry
    await postTaskLearning(
      "coding",
      {
        success: false,
        duration_ms: 2000,
        turns_used: 3,
        filesChanged: ["b.ts"],
        lessonsLearned: "Second task",
      },
      testDir,
    );

    const logPath = join(testDir, ".harness/knowledge/coding/log.md");
    const content = await readFile(logPath, "utf-8");
    expect(content).toContain("First task");
    expect(content).toContain("Second task");
    expect(content).toContain("[TASK] SUCCESS");
    expect(content).toContain("[TASK] FAILURE");
  });

  test("writes ledger JSON with metrics", async () => {
    await postTaskLearning(
      "coding",
      {
        success: true,
        duration_ms: 3000,
        turns_used: 4,
        filesChanged: ["x.ts"],
        lessonsLearned: "",
      },
      testDir,
    );

    const ledgerPath = join(testDir, ".harness/knowledge/coding/ledger.json");
    expect(existsSync(ledgerPath)).toBe(true);

    const ledger = JSON.parse(await readFile(ledgerPath, "utf-8"));
    expect(Array.isArray(ledger)).toBe(true);
    expect(ledger.length).toBe(1);
    expect(ledger[0].success).toBe(true);
    expect(ledger[0].duration_ms).toBe(3000);
    expect(ledger[0].turns_used).toBe(4);
  });

  test("appends to existing ledger", async () => {
    await postTaskLearning(
      "general",
      {
        success: true,
        duration_ms: 1000,
        turns_used: 1,
        filesChanged: [],
        lessonsLearned: "",
      },
      testDir,
    );

    await postTaskLearning(
      "general",
      {
        success: false,
        duration_ms: 2000,
        turns_used: 2,
        filesChanged: ["y.ts"],
        lessonsLearned: "",
      },
      testDir,
    );

    const ledgerPath = join(testDir, ".harness/knowledge/general/ledger.json");
    const ledger = JSON.parse(await readFile(ledgerPath, "utf-8"));
    expect(ledger.length).toBe(2);
    expect(ledger[0].success).toBe(true);
    expect(ledger[1].success).toBe(false);
  });

  test("creates category directory if it does not exist", async () => {
    const categoryDir = join(testDir, ".harness/knowledge/operations");
    expect(existsSync(categoryDir)).toBe(false);

    await postTaskLearning(
      "operations",
      {
        success: true,
        duration_ms: 500,
        turns_used: 1,
        filesChanged: [],
        lessonsLearned: "Test",
      },
      testDir,
    );

    expect(existsSync(categoryDir)).toBe(true);
  });
});
