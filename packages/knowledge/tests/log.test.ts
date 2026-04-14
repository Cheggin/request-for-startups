import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { logOperation, readLog, recentLog } from "../src/log.js";
import { initKnowledgeBase, getLogPath } from "../src/store.js";

let testDir: string;

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), "knowledge-test-"));
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

describe("log", () => {
  describe("logOperation", () => {
    it("appends entry to log file", async () => {
      await initKnowledgeBase(testDir, "coding");
      await logOperation(testDir, "coding", {
        operation: "ingest",
        details: "Ingested test article",
      });

      const content = await Bun.file(getLogPath(testDir, "coding")).text();
      expect(content).toContain("[INGEST]");
      expect(content).toContain("Ingested test article");
    });

    it("includes timestamp", async () => {
      await initKnowledgeBase(testDir, "coding");
      await logOperation(testDir, "coding", {
        operation: "query",
        details: "Queried for auth",
      });

      const content = await Bun.file(getLogPath(testDir, "coding")).text();
      // ISO timestamp pattern
      expect(content).toMatch(/\d{4}-\d{2}-\d{2}T/);
    });

    it("uses custom timestamp when provided", async () => {
      await initKnowledgeBase(testDir, "coding");
      await logOperation(testDir, "coding", {
        operation: "lint",
        details: "Lint check",
        timestamp: "2025-01-01T00:00:00Z",
      });

      const content = await Bun.file(getLogPath(testDir, "coding")).text();
      expect(content).toContain("2025-01-01T00:00:00Z");
    });
  });

  describe("readLog", () => {
    it("parses all log entries", async () => {
      await initKnowledgeBase(testDir, "coding");
      await logOperation(testDir, "coding", {
        operation: "ingest",
        details: "First",
      });
      await logOperation(testDir, "coding", {
        operation: "query",
        details: "Second",
      });

      const entries = await readLog(testDir, "coding");
      expect(entries.length).toBe(2);
      expect(entries[0].operation).toBe("ingest");
      expect(entries[1].operation).toBe("query");
    });

    it("returns empty for non-existent log", async () => {
      const entries = await readLog(testDir, "coding");
      expect(entries).toEqual([]);
    });
  });

  describe("recentLog", () => {
    it("returns last n entries", async () => {
      await initKnowledgeBase(testDir, "coding");
      await logOperation(testDir, "coding", {
        operation: "ingest",
        details: "First",
      });
      await logOperation(testDir, "coding", {
        operation: "query",
        details: "Second",
      });
      await logOperation(testDir, "coding", {
        operation: "lint",
        details: "Third",
      });

      const entries = await recentLog(testDir, "coding", 2);
      expect(entries.length).toBe(2);
      expect(entries[0].operation).toBe("query");
      expect(entries[1].operation).toBe("lint");
    });
  });
});
