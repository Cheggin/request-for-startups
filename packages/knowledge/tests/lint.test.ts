import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { lintWiki } from "../src/lint.js";
import { createPage, linkPages } from "../src/wiki.js";
import { initKnowledgeBase, getWikiPath } from "../src/store.js";

let testDir: string;

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), "knowledge-test-"));
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

describe("lint", () => {
  it("returns no issues for empty wiki", async () => {
    await initKnowledgeBase(testDir, "coding");
    const result = await lintWiki(testDir, "coding");
    expect(result.issues.length).toBe(0);
    expect(result.pageCount).toBe(0);
  });

  it("detects orphaned pages", async () => {
    await createPage(testDir, "coding", {
      title: "Lonely Page",
      content: "No links to or from this page.",
      tags: [],
      linkedPages: [],
    });
    await createPage(testDir, "coding", {
      title: "Another Lonely",
      content: "Also alone.",
      tags: [],
      linkedPages: [],
    });

    const result = await lintWiki(testDir, "coding");
    const orphaned = result.issues.filter((i) => i.type === "orphaned");
    expect(orphaned.length).toBe(2);
  });

  it("detects missing cross-references", async () => {
    await createPage(testDir, "coding", {
      title: "Linking Page",
      content: "See also [[non-existent-page]] for details.",
      tags: [],
      linkedPages: [],
    });

    const result = await lintWiki(testDir, "coding");
    const missing = result.issues.filter((i) => i.type === "missing-crossref");
    expect(missing.length).toBe(1);
    expect(missing[0].message).toContain("non-existent-page");
  });

  it("detects stale content", async () => {
    await createPage(testDir, "coding", {
      title: "Old Page",
      content: "Ancient content.",
      tags: [],
      linkedPages: [],
    });

    // Manually set the updated date to 60 days ago
    const filePath = join(getWikiPath(testDir, "coding"), "old-page.md");
    const content = await Bun.file(filePath).text();
    const oldDate = new Date(
      Date.now() - 60 * 24 * 60 * 60 * 1000
    ).toISOString();
    const updated = content.replace(/updated: .+/, `updated: ${oldDate}`);
    await Bun.write(filePath, updated);

    const result = await lintWiki(testDir, "coding");
    const stale = result.issues.filter((i) => i.type === "stale");
    expect(stale.length).toBe(1);
  });

  it("detects index out of sync", async () => {
    await initKnowledgeBase(testDir, "coding");

    // Create a wiki page directly (bypassing index)
    const wikiDir = getWikiPath(testDir, "coding");
    await Bun.write(
      join(wikiDir, "sneaky.md"),
      "---\ntitle: \"Sneaky\"\ntags: []\nlinked: []\nupdated: " +
        new Date().toISOString() +
        "\n---\n\nSnuck in."
    );

    const result = await lintWiki(testDir, "coding");
    const syncIssues = result.issues.filter(
      (i) => i.type === "index-out-of-sync"
    );
    expect(syncIssues.length).toBe(1);
    expect(syncIssues[0].slug).toBe("sneaky");
  });

  it("reports page count", async () => {
    await createPage(testDir, "coding", {
      title: "One",
      content: "Content.",
      tags: [],
      linkedPages: [],
    });
    await createPage(testDir, "coding", {
      title: "Two",
      content: "Content.",
      tags: [],
      linkedPages: [],
    });

    const result = await lintWiki(testDir, "coding");
    expect(result.pageCount).toBe(2);
  });

  it("does not flag linked pages as orphaned", async () => {
    await createPage(testDir, "coding", {
      title: "Hub",
      content: "Central page.",
      tags: [],
      linkedPages: [],
    });
    await createPage(testDir, "coding", {
      title: "Spoke",
      content: "Linked page.",
      tags: [],
      linkedPages: [],
    });
    await linkPages(testDir, "coding", "hub", "spoke");

    const result = await lintWiki(testDir, "coding");
    const orphaned = result.issues.filter((i) => i.type === "orphaned");
    // Neither should be orphaned since hub links to spoke
    const hubOrphaned = orphaned.find((i) => i.slug === "hub");
    const spokeOrphaned = orphaned.find((i) => i.slug === "spoke");
    expect(hubOrphaned).toBeUndefined();
    expect(spokeOrphaned).toBeUndefined();
  });
});
