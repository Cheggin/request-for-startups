import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import {
  initKnowledgeBase,
  initAllKnowledgeBases,
  getBasePath,
  getRawPath,
  getWikiPath,
  getIndexPath,
  getLogPath,
  isValidCategory,
} from "../src/store.js";
import { CATEGORIES } from "../src/constants.js";
import { exists } from "fs/promises";

let testDir: string;

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), "knowledge-test-"));
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

describe("store", () => {
  describe("path helpers", () => {
    it("returns correct base path", () => {
      const p = getBasePath("/root", "coding");
      expect(p).toBe("/root/.harness/knowledge/coding");
    });

    it("returns correct raw path", () => {
      const p = getRawPath("/root", "coding");
      expect(p).toBe("/root/.harness/knowledge/coding/raw");
    });

    it("returns correct wiki path", () => {
      const p = getWikiPath("/root", "coding");
      expect(p).toBe("/root/.harness/knowledge/coding/wiki");
    });

    it("returns correct index path", () => {
      const p = getIndexPath("/root", "coding");
      expect(p).toBe("/root/.harness/knowledge/coding/index.md");
    });

    it("returns correct log path", () => {
      const p = getLogPath("/root", "coding");
      expect(p).toBe("/root/.harness/knowledge/coding/log.md");
    });
  });

  describe("initKnowledgeBase", () => {
    it("creates directory structure", async () => {
      const result = await initKnowledgeBase(testDir, "coding");
      expect(result.created).toBe(true);
      expect(await exists(getRawPath(testDir, "coding"))).toBe(true);
      expect(await exists(getWikiPath(testDir, "coding"))).toBe(true);
      expect(await exists(getIndexPath(testDir, "coding"))).toBe(true);
      expect(await exists(getLogPath(testDir, "coding"))).toBe(true);
    });

    it("creates index.md with default content", async () => {
      await initKnowledgeBase(testDir, "coding");
      const content = await Bun.file(getIndexPath(testDir, "coding")).text();
      expect(content).toContain("coding Knowledge Index");
      expect(content).toContain("No pages yet");
    });

    it("creates log.md with default content", async () => {
      await initKnowledgeBase(testDir, "coding");
      const content = await Bun.file(getLogPath(testDir, "coding")).text();
      expect(content).toContain("coding Knowledge Log");
    });

    it("reports not created on second call", async () => {
      await initKnowledgeBase(testDir, "coding");
      const result = await initKnowledgeBase(testDir, "coding");
      expect(result.created).toBe(false);
    });

    it("does not overwrite existing index", async () => {
      await initKnowledgeBase(testDir, "coding");
      await Bun.write(getIndexPath(testDir, "coding"), "custom content");
      await initKnowledgeBase(testDir, "coding");
      const content = await Bun.file(getIndexPath(testDir, "coding")).text();
      expect(content).toBe("custom content");
    });
  });

  describe("initAllKnowledgeBases", () => {
    it("creates all categories", async () => {
      const results = await initAllKnowledgeBases(testDir);
      expect(results.size).toBe(CATEGORIES.length);
      for (const cat of CATEGORIES) {
        expect(results.has(cat)).toBe(true);
        expect(await exists(getBasePath(testDir, cat))).toBe(true);
      }
    });
  });

  describe("isValidCategory", () => {
    it("returns true for valid categories", () => {
      expect(isValidCategory("coding")).toBe(true);
      expect(isValidCategory("growth")).toBe(true);
      expect(isValidCategory("general")).toBe(true);
    });

    it("returns false for invalid categories", () => {
      expect(isValidCategory("invalid")).toBe(false);
      expect(isValidCategory("")).toBe(false);
    });
  });
});
