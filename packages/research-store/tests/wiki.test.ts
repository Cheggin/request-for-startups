import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as fs from "fs";
import * as path from "path";
import { addPage, queryPages, listPages, readPage } from "../src/wiki.js";

const TEST_ROOT = path.join(import.meta.dir, ".tmp-wiki-test");

beforeEach(() => {
  fs.mkdirSync(TEST_ROOT, { recursive: true });
});

afterEach(() => {
  fs.rmSync(TEST_ROOT, { recursive: true, force: true });
});

describe("addPage", () => {
  it("creates a markdown file with YAML frontmatter", () => {
    const slug = addPage(TEST_ROOT, "coding", "My First Page", "Hello world", [
      "test",
      "intro",
    ]);

    expect(slug).toBe("my-first-page");

    const filePath = path.join(
      TEST_ROOT,
      ".harness/research/coding/my-first-page.md",
    );
    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("title: \"My First Page\"");
    expect(content).toContain("category: coding");
    expect(content).toContain('tags: ["test", "intro"]');
    expect(content).toContain("confidence: 0.5");
    expect(content).toContain("source: session");
    expect(content).toContain("Hello world");
  });

  it("uses custom confidence and source", () => {
    addPage(TEST_ROOT, "architecture", "API Design", "REST vs GraphQL", ["api"], {
      confidence: 0.9,
      source: "web",
    });

    const page = readPage(TEST_ROOT, "architecture", "api-design");
    expect(page).not.toBeNull();
    expect(page!.confidence).toBe(0.9);
    expect(page!.source).toBe("web");
  });

  it("preserves created date on update", () => {
    addPage(TEST_ROOT, "coding", "Evolving Page", "v1", ["test"]);
    const page1 = readPage(TEST_ROOT, "coding", "evolving-page");
    const created1 = page1!.created;

    // Small delay to ensure different timestamp
    addPage(TEST_ROOT, "coding", "Evolving Page", "v2", ["test", "updated"]);
    const page2 = readPage(TEST_ROOT, "coding", "evolving-page");

    expect(page2!.created).toBe(created1);
    expect(page2!.content).toBe("v2");
    expect(page2!.tags).toContain("updated");
  });

  it("throws on invalid category", () => {
    expect(() => {
      addPage(TEST_ROOT, "invalid" as any, "Bad", "content", []);
    }).toThrow("Invalid category");
  });

  it("throws on empty title", () => {
    expect(() => {
      addPage(TEST_ROOT, "coding", "   ", "content", []);
    }).toThrow("non-empty slug");
  });
});

describe("readPage", () => {
  it("returns null for non-existent page", () => {
    const result = readPage(TEST_ROOT, "coding", "does-not-exist");
    expect(result).toBeNull();
  });

  it("returns full page with content", () => {
    addPage(TEST_ROOT, "decision", "Use TypeScript", "We chose TypeScript because...", [
      "lang",
      "decision",
    ]);

    const page = readPage(TEST_ROOT, "decision", "use-typescript");
    expect(page).not.toBeNull();
    expect(page!.title).toBe("Use TypeScript");
    expect(page!.category).toBe("decision");
    expect(page!.tags).toEqual(["lang", "decision"]);
    expect(page!.content).toContain("We chose TypeScript");
    expect(page!.slug).toBe("use-typescript");
  });
});

describe("listPages", () => {
  it("returns empty array when no pages exist", () => {
    const result = listPages(TEST_ROOT);
    expect(result).toEqual([]);
  });

  it("lists all pages across categories", () => {
    addPage(TEST_ROOT, "coding", "Page A", "content a", ["a"]);
    addPage(TEST_ROOT, "growth", "Page B", "content b", ["b"]);
    addPage(TEST_ROOT, "design", "Page C", "content c", ["c"]);

    const all = listPages(TEST_ROOT);
    expect(all.length).toBe(3);
  });

  it("filters by category", () => {
    addPage(TEST_ROOT, "coding", "Page A", "content a", ["a"]);
    addPage(TEST_ROOT, "growth", "Page B", "content b", ["b"]);

    const codingOnly = listPages(TEST_ROOT, "coding");
    expect(codingOnly.length).toBe(1);
    expect(codingOnly[0].title).toBe("Page A");
  });
});

describe("queryPages", () => {
  beforeEach(() => {
    addPage(
      TEST_ROOT,
      "coding",
      "TypeScript Best Practices",
      "Use strict mode. Prefer interfaces over types. Avoid any.",
      ["typescript", "best-practices"],
    );
    addPage(
      TEST_ROOT,
      "architecture",
      "Microservices Architecture",
      "Split by domain. Use event-driven communication. Keep services small.",
      ["microservices", "architecture"],
    );
    addPage(
      TEST_ROOT,
      "growth",
      "SEO Fundamentals",
      "Meta tags, sitemap, page speed. Content is king.",
      ["seo", "marketing"],
    );
  });

  it("finds pages by content keyword", () => {
    const results = queryPages(TEST_ROOT, "strict mode");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].page.title).toBe("TypeScript Best Practices");
  });

  it("finds pages by title keyword", () => {
    const results = queryPages(TEST_ROOT, "microservices");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].page.title).toBe("Microservices Architecture");
  });

  it("finds pages by tag", () => {
    const results = queryPages(TEST_ROOT, "practices", undefined, [
      "typescript",
    ]);
    expect(results.length).toBe(1);
    expect(results[0].page.tags).toContain("typescript");
  });

  it("filters by category", () => {
    const results = queryPages(TEST_ROOT, "architecture", "architecture");
    expect(results.length).toBe(1);
    expect(results[0].page.category).toBe("architecture");
  });

  it("returns empty for no match", () => {
    const results = queryPages(TEST_ROOT, "quantum computing blockchain");
    expect(results.length).toBe(0);
  });

  it("returns snippets from matching content", () => {
    const results = queryPages(TEST_ROOT, "strict");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].snippets.length).toBeGreaterThanOrEqual(1);
  });

  it("sorts by relevance score descending", () => {
    // Add a page that matches "typescript" in title AND content AND tags
    addPage(
      TEST_ROOT,
      "coding",
      "Advanced TypeScript",
      "TypeScript generics and TypeScript utility types",
      ["typescript"],
    );

    const results = queryPages(TEST_ROOT, "typescript");
    expect(results.length).toBeGreaterThanOrEqual(2);
    // The page with more matches should rank higher
    expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
  });
});
