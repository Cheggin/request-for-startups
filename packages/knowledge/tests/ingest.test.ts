import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, exists } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { ingestSource, slugify } from "../src/ingest.js";
import { getRawPath } from "../src/store.js";

let testDir: string;

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), "knowledge-test-"));
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

describe("ingest", () => {
  describe("slugify", () => {
    it("converts title to slug", () => {
      expect(slugify("Hello World")).toBe("hello-world");
    });

    it("removes special characters", () => {
      expect(slugify("React & TypeScript: A Guide")).toBe(
        "react-typescript-a-guide"
      );
    });

    it("collapses multiple dashes", () => {
      expect(slugify("too   many   spaces")).toBe("too-many-spaces");
    });

    it("trims leading and trailing dashes", () => {
      expect(slugify("--hello--")).toBe("hello");
    });
  });

  describe("ingestSource", () => {
    it("saves source to raw directory", async () => {
      const result = await ingestSource(testDir, "coding", {
        title: "Test Article",
        content: "# Test\n\nThis is a test article.",
        type: "article",
      });

      expect(result.slug).toBe("test-article");
      const rawPath = join(getRawPath(testDir, "coding"), "test-article.md");
      expect(await exists(rawPath)).toBe(true);
    });

    it("includes frontmatter in raw file", async () => {
      await ingestSource(testDir, "coding", {
        title: "Test Article",
        content: "Content here",
        url: "https://example.com",
        type: "article",
      });

      const rawPath = join(getRawPath(testDir, "coding"), "test-article.md");
      const content = await Bun.file(rawPath).text();
      expect(content).toContain("---");
      expect(content).toContain('title: "Test Article"');
      expect(content).toContain("type: article");
      expect(content).toContain('url: "https://example.com"');
    });

    it("returns structured summary", async () => {
      const result = await ingestSource(testDir, "coding", {
        title: "React Hooks Guide",
        content: "# useState\n\nManage state.\n\n# useEffect\n\nSide effects.",
        type: "doc",
      });

      expect(result.summary.title).toBe("React Hooks Guide");
      expect(result.summary.type).toBe("doc");
      expect(result.summary.keyTopics).toContain("useState");
      expect(result.summary.keyTopics).toContain("useEffect");
      expect(result.summary.suggestedWikiPages.length).toBeGreaterThan(0);
    });

    it("handles duplicate titles with timestamps", async () => {
      await ingestSource(testDir, "coding", {
        title: "Duplicate",
        content: "First version",
        type: "article",
      });

      const result = await ingestSource(testDir, "coding", {
        title: "Duplicate",
        content: "Second version",
        type: "article",
      });

      // Original file still exists
      const rawPath = join(getRawPath(testDir, "coding"), "duplicate.md");
      expect(await exists(rawPath)).toBe(true);
      const original = await Bun.file(rawPath).text();
      expect(original).toContain("First version");
    });

    it("extracts topics from headings", async () => {
      const result = await ingestSource(testDir, "coding", {
        title: "Architecture",
        content:
          "# Microservices\n\nContent\n\n## Event Sourcing\n\nMore content\n\n### CQRS\n\nDetails",
        type: "doc",
      });

      expect(result.summary.keyTopics).toContain("Microservices");
      expect(result.summary.keyTopics).toContain("Event Sourcing");
      expect(result.summary.keyTopics).toContain("CQRS");
    });
  });
});
