import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { rebuildIndex, addToIndex, removeFromIndex } from "../src/index-manager.js";
import { createPage } from "../src/wiki.js";
import { getIndexPath, initKnowledgeBase } from "../src/store.js";

let testDir: string;

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), "knowledge-test-"));
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

describe("index-manager", () => {
  describe("rebuildIndex", () => {
    it("builds index from wiki pages", async () => {
      await createPage(testDir, "coding", {
        title: "Alpha",
        content: "Alpha content.",
        tags: ["a"],
        linkedPages: [],
      });
      await createPage(testDir, "coding", {
        title: "Beta",
        content: "Beta content.",
        tags: ["b"],
        linkedPages: [],
      });

      const result = await rebuildIndex(testDir, "coding");
      expect(result.pageCount).toBe(2);

      const indexContent = await Bun.file(
        getIndexPath(testDir, "coding")
      ).text();
      expect(indexContent).toContain("Alpha");
      expect(indexContent).toContain("Beta");
      expect(indexContent).toContain("2 pages indexed");
    });

    it("handles empty wiki", async () => {
      await initKnowledgeBase(testDir, "coding");
      const result = await rebuildIndex(testDir, "coding");
      expect(result.pageCount).toBe(0);
    });
  });

  describe("addToIndex", () => {
    it("adds entry to empty index", async () => {
      await initKnowledgeBase(testDir, "coding");
      await addToIndex(testDir, "coding", {
        slug: "test-page",
        title: "Test Page",
        summary: "A test page",
        tags: ["test"],
      });

      const content = await Bun.file(
        getIndexPath(testDir, "coding")
      ).text();
      expect(content).toContain("Test Page");
      expect(content).toContain("test-page.md");
    });

    it("appends to existing index", async () => {
      await createPage(testDir, "coding", {
        title: "First",
        content: "First page.",
        tags: [],
        linkedPages: [],
      });

      await addToIndex(testDir, "coding", {
        slug: "second",
        title: "Second",
        summary: "Second page",
        tags: ["new"],
      });

      const content = await Bun.file(
        getIndexPath(testDir, "coding")
      ).text();
      expect(content).toContain("First");
      expect(content).toContain("Second");
    });
  });

  describe("removeFromIndex", () => {
    it("removes entry by rebuilding index", async () => {
      await createPage(testDir, "coding", {
        title: "Keep This",
        content: "Keep content.",
        tags: [],
        linkedPages: [],
      });
      await createPage(testDir, "coding", {
        title: "Remove This",
        content: "Remove content.",
        tags: [],
        linkedPages: [],
      });

      // Delete the actual file first, then remove from index
      const { unlink } = await import("fs/promises");
      await unlink(
        join(testDir, ".harness/knowledge/coding/wiki/remove-this.md")
      );
      await removeFromIndex(testDir, "coding", "remove-this");

      const content = await Bun.file(
        getIndexPath(testDir, "coding")
      ).text();
      expect(content).toContain("Keep This");
      expect(content).not.toContain("Remove This");
    });
  });
});
