import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, exists } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import {
  createPage,
  updatePage,
  readPage,
  listPages,
  searchPages,
  linkPages,
  parseFrontmatter,
} from "../src/wiki.js";
import { getWikiPath } from "../src/store.js";

let testDir: string;

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), "knowledge-test-"));
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

describe("wiki", () => {
  describe("parseFrontmatter", () => {
    it("parses YAML frontmatter", () => {
      const raw = `---\ntitle: "Test"\ntags: ["a", "b"]\n---\n\nContent here`;
      const result = parseFrontmatter(raw);
      expect(result.meta.title).toBe('"Test"');
      expect(result.content).toBe("Content here");
    });

    it("handles missing frontmatter", () => {
      const raw = "Just content, no frontmatter";
      const result = parseFrontmatter(raw);
      expect(result.meta).toEqual({});
      expect(result.content).toBe(raw);
    });
  });

  describe("createPage", () => {
    it("creates a wiki page with frontmatter", async () => {
      const result = await createPage(testDir, "coding", {
        title: "Auth Patterns",
        content: "OAuth2 is the standard for authorization.",
        tags: ["auth", "security"],
        linkedPages: [],
      });

      expect(result.slug).toBe("auth-patterns");
      const filePath = join(getWikiPath(testDir, "coding"), "auth-patterns.md");
      expect(await exists(filePath)).toBe(true);

      const content = await Bun.file(filePath).text();
      expect(content).toContain('title: "Auth Patterns"');
      expect(content).toContain('tags: ["auth", "security"]');
      expect(content).toContain("OAuth2 is the standard");
    });

    it("adds page to index", async () => {
      await createPage(testDir, "coding", {
        title: "Test Page",
        content: "Some content here.",
        tags: ["test"],
        linkedPages: [],
      });

      const indexPath = join(
        testDir,
        ".harness/knowledge/coding/index.md"
      );
      const indexContent = await Bun.file(indexPath).text();
      expect(indexContent).toContain("Test Page");
      expect(indexContent).toContain("test-page.md");
    });
  });

  describe("updatePage", () => {
    it("updates existing page content", async () => {
      await createPage(testDir, "coding", {
        title: "Mutable Page",
        content: "Original content.",
        tags: ["test"],
        linkedPages: [],
      });

      await updatePage(testDir, "coding", "mutable-page", "Updated content.");

      const page = await readPage(testDir, "coding", "mutable-page");
      expect(page).not.toBeNull();
      expect(page!.content).toBe("Updated content.");
    });

    it("throws for non-existent page", async () => {
      expect(
        updatePage(testDir, "coding", "non-existent", "content")
      ).rejects.toThrow("Wiki page not found");
    });

    it("preserves frontmatter on update", async () => {
      await createPage(testDir, "coding", {
        title: "Keep Meta",
        content: "Original.",
        tags: ["preserve"],
        linkedPages: [],
      });

      await updatePage(testDir, "coding", "keep-meta", "New content.");

      const page = await readPage(testDir, "coding", "keep-meta");
      expect(page!.meta.title).toContain("Keep Meta");
      expect(page!.meta.tags).toContain("preserve");
    });
  });

  describe("readPage", () => {
    it("reads an existing page", async () => {
      await createPage(testDir, "coding", {
        title: "Readable",
        content: "Read me.",
        tags: ["read"],
        linkedPages: [],
      });

      const page = await readPage(testDir, "coding", "readable");
      expect(page).not.toBeNull();
      expect(page!.content).toBe("Read me.");
    });

    it("returns null for non-existent page", async () => {
      const page = await readPage(testDir, "coding", "ghost");
      expect(page).toBeNull();
    });
  });

  describe("listPages", () => {
    it("lists all pages in a category", async () => {
      await createPage(testDir, "coding", {
        title: "Page One",
        content: "First.",
        tags: ["a"],
        linkedPages: [],
      });
      await createPage(testDir, "coding", {
        title: "Page Two",
        content: "Second.",
        tags: ["b"],
        linkedPages: [],
      });

      const pages = await listPages(testDir, "coding");
      expect(pages.length).toBe(2);
      const titles = pages.map((p) => p.title);
      expect(titles).toContain("Page One");
      expect(titles).toContain("Page Two");
    });

    it("returns empty array for empty category", async () => {
      const pages = await listPages(testDir, "coding");
      expect(pages).toEqual([]);
    });
  });

  describe("searchPages", () => {
    it("finds pages by content", async () => {
      await createPage(testDir, "coding", {
        title: "React Hooks",
        content: "useState and useEffect are fundamental hooks.",
        tags: ["react", "hooks"],
        linkedPages: [],
      });
      await createPage(testDir, "coding", {
        title: "Vue Composition",
        content: "Vue uses ref and computed for reactivity.",
        tags: ["vue"],
        linkedPages: [],
      });

      const results = await searchPages(testDir, "coding", "hooks");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].slug).toBe("react-hooks");
    });

    it("boosts title matches", async () => {
      await createPage(testDir, "coding", {
        title: "Authentication",
        content: "Basic content about auth.",
        tags: ["auth"],
        linkedPages: [],
      });
      await createPage(testDir, "coding", {
        title: "Security Overview",
        content: "Covers authentication and authorization.",
        tags: ["security"],
        linkedPages: [],
      });

      const results = await searchPages(testDir, "coding", "authentication");
      expect(results[0].slug).toBe("authentication");
    });

    it("returns empty for no matches", async () => {
      await createPage(testDir, "coding", {
        title: "Unrelated",
        content: "Nothing relevant.",
        tags: [],
        linkedPages: [],
      });

      const results = await searchPages(testDir, "coding", "quantum-physics");
      expect(results.length).toBe(0);
    });
  });

  describe("linkPages", () => {
    it("adds cross-reference between pages", async () => {
      await createPage(testDir, "coding", {
        title: "Page A",
        content: "Content A.",
        tags: [],
        linkedPages: [],
      });
      await createPage(testDir, "coding", {
        title: "Page B",
        content: "Content B.",
        tags: [],
        linkedPages: [],
      });

      await linkPages(testDir, "coding", "page-a", "page-b");

      const pageA = await readPage(testDir, "coding", "page-a");
      expect(pageA!.content).toContain("[[page-b]]");
      expect(pageA!.meta.linked).toContain("page-b");
    });

    it("throws for non-existent source page", async () => {
      expect(
        linkPages(testDir, "coding", "ghost", "page-b")
      ).rejects.toThrow("Source page not found");
    });
  });
});
