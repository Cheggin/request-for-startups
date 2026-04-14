import { join } from "path";
import { exists, readdir } from "fs/promises";
import { getWikiPath, initKnowledgeBase } from "./store.js";
import { addToIndex, removeFromIndex } from "./index-manager.js";
import { logOperation } from "./log.js";
import {
  type Category,
  FRONTMATTER_DELIMITER,
  WIKI_LINK_PATTERN,
} from "./constants.js";
import { slugify } from "./ingest.js";

export interface WikiPage {
  title: string;
  content: string;
  tags: string[];
  linkedPages: string[];
}

export interface WikiPageMeta {
  slug: string;
  title: string;
  tags: string[];
  linkedPages: string[];
  created: string;
  updated: string;
}

function buildWikiPage(page: WikiPage, isUpdate = false): string {
  const now = new Date().toISOString();
  const lines = [
    FRONTMATTER_DELIMITER,
    `title: "${page.title.replace(/"/g, '\\"')}"`,
    `tags: [${page.tags.map((t) => `"${t}"`).join(", ")}]`,
    `linked: [${page.linkedPages.map((l) => `"${l}"`).join(", ")}]`,
    `created: ${isUpdate ? "preserved" : now}`,
    `updated: ${now}`,
    FRONTMATTER_DELIMITER,
    "",
    page.content,
  ];
  return lines.join("\n");
}

export function parseFrontmatter(raw: string): {
  meta: Record<string, string>;
  content: string;
} {
  const lines = raw.split("\n");
  if (lines[0] !== FRONTMATTER_DELIMITER) {
    return { meta: {}, content: raw };
  }

  const endIdx = lines.indexOf(FRONTMATTER_DELIMITER, 1);
  if (endIdx === -1) {
    return { meta: {}, content: raw };
  }

  const meta: Record<string, string> = {};
  for (let i = 1; i < endIdx; i++) {
    const colonIdx = lines[i].indexOf(":");
    if (colonIdx > 0) {
      const key = lines[i].slice(0, colonIdx).trim();
      const value = lines[i].slice(colonIdx + 1).trim();
      meta[key] = value;
    }
  }

  const content = lines.slice(endIdx + 1).join("\n").trim();
  return { meta, content };
}

function parseTags(tagString: string): string[] {
  const match = tagString.match(/\[(.+)\]/);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((t) => t.trim().replace(/"/g, ""))
    .filter(Boolean);
}

export async function createPage(
  rootPath: string,
  category: Category,
  page: WikiPage
): Promise<{ slug: string; path: string }> {
  await initKnowledgeBase(rootPath, category);

  const slug = slugify(page.title);
  const wikiDir = getWikiPath(rootPath, category);
  const filePath = join(wikiDir, `${slug}.md`);

  await Bun.write(filePath, buildWikiPage(page));

  const summary =
    page.content.split("\n").find((l) => l.trim().length > 0)?.slice(0, 100) ??
    "No summary";

  await addToIndex(rootPath, category, {
    slug,
    title: page.title,
    summary,
    tags: page.tags,
  });

  await logOperation(rootPath, category, {
    operation: "update",
    details: `Created wiki page "${page.title}" (wiki/${slug}.md)`,
  });

  return { slug, path: filePath };
}

export async function updatePage(
  rootPath: string,
  category: Category,
  slug: string,
  content: string
): Promise<{ path: string }> {
  const wikiDir = getWikiPath(rootPath, category);
  const filePath = join(wikiDir, `${slug}.md`);

  if (!(await exists(filePath))) {
    throw new Error(`Wiki page not found: ${slug}`);
  }

  const existing = await Bun.file(filePath).text();
  const parsed = parseFrontmatter(existing);

  const updatedLines = [
    FRONTMATTER_DELIMITER,
    ...Object.entries(parsed.meta)
      .filter(([k]) => k !== "updated")
      .map(([k, v]) => `${k}: ${v}`),
    `updated: ${new Date().toISOString()}`,
    FRONTMATTER_DELIMITER,
    "",
    content,
  ];

  await Bun.write(filePath, updatedLines.join("\n"));

  await logOperation(rootPath, category, {
    operation: "update",
    details: `Updated wiki page "${slug}"`,
  });

  return { path: filePath };
}

export async function readPage(
  rootPath: string,
  category: Category,
  slug: string
): Promise<{ meta: Record<string, string>; content: string } | null> {
  const wikiDir = getWikiPath(rootPath, category);
  const filePath = join(wikiDir, `${slug}.md`);

  if (!(await exists(filePath))) {
    return null;
  }

  const raw = await Bun.file(filePath).text();
  return parseFrontmatter(raw);
}

export async function listPages(
  rootPath: string,
  category: Category
): Promise<WikiPageMeta[]> {
  const wikiDir = getWikiPath(rootPath, category);

  if (!(await exists(wikiDir))) {
    return [];
  }

  const files = await readdir(wikiDir);
  const pages: WikiPageMeta[] = [];

  for (const file of files) {
    if (!file.endsWith(".md")) continue;

    const slug = file.replace(/\.md$/, "");
    const raw = await Bun.file(join(wikiDir, file)).text();
    const { meta } = parseFrontmatter(raw);

    pages.push({
      slug,
      title: meta.title?.replace(/"/g, "") ?? slug,
      tags: meta.tags ? parseTags(meta.tags) : [],
      linkedPages: meta.linked ? parseTags(meta.linked) : [],
      created: meta.created ?? "unknown",
      updated: meta.updated ?? "unknown",
    });
  }

  return pages;
}

export async function searchPages(
  rootPath: string,
  category: Category,
  query: string
): Promise<{ slug: string; title: string; snippet: string; score: number }[]> {
  const wikiDir = getWikiPath(rootPath, category);

  if (!(await exists(wikiDir))) {
    return [];
  }

  const files = await readdir(wikiDir);
  const queryTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1);
  const results: { slug: string; title: string; snippet: string; score: number }[] = [];

  for (const file of files) {
    if (!file.endsWith(".md")) continue;

    const slug = file.replace(/\.md$/, "");
    const raw = await Bun.file(join(wikiDir, file)).text();
    const { meta, content } = parseFrontmatter(raw);
    const title = meta.title?.replace(/"/g, "") ?? slug;
    const tags = meta.tags ? parseTags(meta.tags) : [];

    const fullText = `${title} ${tags.join(" ")} ${content}`.toLowerCase();
    let score = 0;

    for (const term of queryTerms) {
      // Fuzzy: check if term is a substring of any word in the text
      const words = fullText.split(/\s+/);
      for (const word of words) {
        if (word.includes(term) || term.includes(word)) {
          score++;
        }
      }

      // Boost for title match
      if (title.toLowerCase().includes(term)) {
        score += 3;
      }

      // Boost for tag match
      if (tags.some((t) => t.toLowerCase().includes(term))) {
        score += 2;
      }
    }

    if (score > 0) {
      const snippetStart = fullText.indexOf(queryTerms[0]);
      const start = Math.max(0, snippetStart - 50);
      const snippet = content.slice(start, start + 200).replace(/\n/g, " ");
      results.push({ slug, title, snippet, score });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

export async function linkPages(
  rootPath: string,
  category: Category,
  fromSlug: string,
  toSlug: string
): Promise<void> {
  const wikiDir = getWikiPath(rootPath, category);
  const fromPath = join(wikiDir, `${fromSlug}.md`);

  if (!(await exists(fromPath))) {
    throw new Error(`Source page not found: ${fromSlug}`);
  }

  const raw = await Bun.file(fromPath).text();
  const { meta, content } = parseFrontmatter(raw);

  const existingLinked = meta.linked ? parseTags(meta.linked) : [];
  if (!existingLinked.includes(toSlug)) {
    existingLinked.push(toSlug);
  }

  meta.linked = `[${existingLinked.map((l) => `"${l}"`).join(", ")}]`;
  meta.updated = new Date().toISOString();

  const updatedLines = [
    FRONTMATTER_DELIMITER,
    ...Object.entries(meta).map(([k, v]) => `${k}: ${v}`),
    FRONTMATTER_DELIMITER,
    "",
    content,
  ];

  await Bun.write(fromPath, updatedLines.join("\n"));

  // Append wiki-link at bottom if not already present
  const wikiLink = `[[${toSlug}]]`;
  if (!content.includes(wikiLink)) {
    const withLink = content + `\n\nSee also: ${wikiLink}\n`;
    const finalLines = [
      FRONTMATTER_DELIMITER,
      ...Object.entries(meta).map(([k, v]) => `${k}: ${v}`),
      FRONTMATTER_DELIMITER,
      "",
      withLink,
    ];
    await Bun.write(fromPath, finalLines.join("\n"));
  }
}
