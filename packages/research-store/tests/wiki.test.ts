import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as fs from "fs";
import * as path from "path";
import { addPage, queryPages, listPages, readPage } from "../src/wiki";

const TEST_ROOT = path.join(import.meta.dir, ".tmp-wiki-test");

beforeEach(() => { fs.mkdirSync(TEST_ROOT, { recursive: true }); });
afterEach(() => { fs.rmSync(TEST_ROOT, { recursive: true, force: true }); });

describe("addPage", () => {
  it("creates a markdown file with YAML frontmatter", () => {
    const slug = addPage(TEST_ROOT, "coding", "My First Page", "Hello world", ["test", "intro"]);
    expect(slug).toBe("my-first-page");
    const filePath = path.join(TEST_ROOT, ".harness/research/coding/my-first-page.md");
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("My First Page");
    expect(content).toContain("category: coding");
    expect(content).toContain("confidence: 0.5");
    expect(content).toContain("source: session");
    expect(content).toContain("Hello world");
  });

  it("uses custom confidence and source", () => {
    addPage(TEST_ROOT, "architecture", "API Design", "REST vs GraphQL", ["api"], { confidence: 0.9, source: "web" });
    const page = readPage(TEST_ROOT, "architecture", "api-design");
    expect(page).not.toBeNull();
    expect(page!.confidence).toBe(0.9);
    expect(page!.source).toBe("web");
  });

  it("preserves created date on update", () => {
    addPage(TEST_ROOT, "coding", "Evolving Page", "v1", ["test"]);
    const page1 = readPage(TEST_ROOT, "coding", "evolving-page");
    const created1 = page1!.created;
    addPage(TEST_ROOT, "coding", "Evolving Page", "v2", ["test", "updated"]);
    const page2 = readPage(TEST_ROOT, "coding", "evolving-page");
    expect(page2!.created).toBe(created1);
    expect(page2!.content).toBe("v2");
    expect(page2!.tags).toContain("updated");
  });

  it("throws on invalid category", () => {
    expect(() => { addPage(TEST_ROOT, "invalid" as any, "Bad", "content", []); }).toThrow("Invalid category");
  });

  it("throws on empty title", () => {
    expect(() => { addPage(TEST_ROOT, "coding", "   ", "content", []); }).toThrow("non-empty slug");
  });
});

describe("readPage", () => {
  it("returns null for non-existent page", () => {
    expect(readPage(TEST_ROOT, "coding", "does-not-exist")).toBeNull();
  });

  it("returns full page with content", () => {
    addPage(TEST_ROOT, "decision", "Use TypeScript", "We chose TypeScript because...", ["lang", "decision"]);
    const page = readPage(TEST_ROOT, "decision", "use-typescript");
    expect(page).not.toBeNull();
    expect(page!.title).toBe("Use TypeScript");
    expect(page!.category).toBe("decision");
    expect(page!.content).toContain("We chose TypeScript");
    expect(page!.slug).toBe("use-typescript");
  });
});

describe("listPages", () => {
  it("returns empty array when no pages exist", () => { expect(listPages(TEST_ROOT)).toEqual([]); });

  it("lists all pages across categories", () => {
    addPage(TEST_ROOT, "coding", "Page A", "a", ["a"]);
    addPage(TEST_ROOT, "growth", "Page B", "b", ["b"]);
    addPage(TEST_ROOT, "design", "Page C", "c", ["c"]);
    expect(listPages(TEST_ROOT).length).toBe(3);
  });

  it("filters by category", () => {
    addPage(TEST_ROOT, "coding", "Page A", "a", ["a"]);
    addPage(TEST_ROOT, "growth", "Page B", "b", ["b"]);
    const codingOnly = listPages(TEST_ROOT, "coding");
    expect(codingOnly.length).toBe(1);
    expect(codingOnly[0].title).toBe("Page A");
  });
});

describe("queryPages", () => {
  beforeEach(() => {
    addPage(TEST_ROOT, "coding", "TypeScript Best Practices", "Use strict mode. Prefer interfaces over types.", ["typescript", "best-practices"]);
    addPage(TEST_ROOT, "architecture", "Microservices Architecture", "Split by domain. Use event-driven communication.", ["microservices", "architecture"]);
    addPage(TEST_ROOT, "growth", "SEO Fundamentals", "Meta tags, sitemap, page speed.", ["seo", "marketing"]);
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

  it("filters by category", () => {
    const results = queryPages(TEST_ROOT, "architecture", "architecture");
    expect(results.length).toBe(1);
    expect(results[0].page.category).toBe("architecture");
  });

  it("returns empty for no match", () => {
    expect(queryPages(TEST_ROOT, "quantum computing blockchain").length).toBe(0);
  });

  it("sorts by relevance score descending", () => {
    addPage(TEST_ROOT, "coding", "Advanced TypeScript", "TypeScript generics and TypeScript utility types", ["typescript"]);
    const results = queryPages(TEST_ROOT, "typescript");
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
  });
});
