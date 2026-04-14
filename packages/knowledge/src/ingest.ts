import { join } from "path";
import { exists } from "fs/promises";
import { getRawPath, initKnowledgeBase } from "./store.js";
import { logOperation } from "./log.js";
import { type Category, type SourceType, FRONTMATTER_DELIMITER } from "./constants.js";

export interface Source {
  title: string;
  content: string;
  url?: string;
  type: SourceType;
}

export interface IngestResult {
  slug: string;
  rawPath: string;
  summary: {
    title: string;
    type: SourceType;
    url?: string;
    keyTopics: string[];
    suggestedWikiPages: string[];
    contentPreview: string;
  };
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildRawDocument(source: Source): string {
  const lines = [
    FRONTMATTER_DELIMITER,
    `title: "${source.title.replace(/"/g, '\\"')}"`,
    `type: ${source.type}`,
    `ingested: ${new Date().toISOString()}`,
  ];

  if (source.url) {
    lines.push(`url: "${source.url}"`);
  }

  lines.push(FRONTMATTER_DELIMITER, "", source.content);
  return lines.join("\n");
}

function extractKeyTopics(content: string): string[] {
  const headings: string[] = [];
  const lines = content.split("\n");

  for (const line of lines) {
    const match = line.match(/^#{1,3}\s+(.+)/);
    if (match) {
      headings.push(match[1].trim());
    }
  }

  if (headings.length === 0) {
    const words = content
      .split(/\s+/)
      .filter((w) => w.length > 5)
      .slice(0, 5);
    return [...new Set(words)];
  }

  return headings.slice(0, 10);
}

function suggestWikiPages(title: string, topics: string[]): string[] {
  const suggestions = [slugify(title)];
  for (const topic of topics.slice(0, 3)) {
    const slug = slugify(topic);
    if (slug && !suggestions.includes(slug)) {
      suggestions.push(slug);
    }
  }
  return suggestions;
}

export async function ingestSource(
  rootPath: string,
  category: Category,
  source: Source
): Promise<IngestResult> {
  await initKnowledgeBase(rootPath, category);

  const slug = slugify(source.title);
  const rawDir = getRawPath(rootPath, category);
  const filePath = join(rawDir, `${slug}.md`);

  // Immutable: do not overwrite existing raw sources
  if (await exists(filePath)) {
    const timestamp = Date.now();
    const uniquePath = join(rawDir, `${slug}-${timestamp}.md`);
    await Bun.write(uniquePath, buildRawDocument(source));
  } else {
    await Bun.write(filePath, buildRawDocument(source));
  }

  const keyTopics = extractKeyTopics(source.content);
  const suggestedPages = suggestWikiPages(source.title, keyTopics);
  const contentPreview = source.content.slice(0, 300).replace(/\n/g, " ");

  await logOperation(rootPath, category, {
    operation: "ingest",
    details: `Ingested "${source.title}" (${source.type}) as raw/${slug}.md`,
  });

  return {
    slug,
    rawPath: filePath,
    summary: {
      title: source.title,
      type: source.type,
      url: source.url,
      keyTopics,
      suggestedWikiPages: suggestedPages,
      contentPreview,
    },
  };
}

export async function ingestFromUrl(
  rootPath: string,
  category: Category,
  url: string,
  title?: string
): Promise<IngestResult> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  const content = await response.text();
  const resolvedTitle = title ?? new URL(url).pathname.split("/").pop() ?? "untitled";

  return ingestSource(rootPath, category, {
    title: resolvedTitle,
    content,
    url,
    type: "article",
  });
}
