import { join } from "path";
import { exists, readdir } from "fs/promises";
import { getIndexPath, getWikiPath, initKnowledgeBase } from "./store.js";
import { parseFrontmatter } from "./wiki.js";
import { type Category } from "./constants.js";

export interface IndexEntry {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
}

function buildIndexContent(category: string, entries: IndexEntry[]): string {
  const lines = [`# ${category} Knowledge Index`, ""];

  if (entries.length === 0) {
    lines.push("_No pages yet. Ingest sources to populate._");
    return lines.join("\n") + "\n";
  }

  lines.push(`_${entries.length} pages indexed._`, "");
  lines.push("| Page | Summary | Tags |");
  lines.push("|------|---------|------|");

  for (const entry of entries) {
    const tags = entry.tags.map((t) => `\`${t}\``).join(", ");
    lines.push(
      `| [${entry.title}](wiki/${entry.slug}.md) | ${entry.summary} | ${tags} |`
    );
  }

  lines.push("");
  return lines.join("\n");
}

export async function rebuildIndex(
  rootPath: string,
  category: Category
): Promise<{ pageCount: number }> {
  await initKnowledgeBase(rootPath, category);

  const wikiDir = getWikiPath(rootPath, category);
  const indexPath = getIndexPath(rootPath, category);

  if (!(await exists(wikiDir))) {
    await Bun.write(indexPath, buildIndexContent(category, []));
    return { pageCount: 0 };
  }

  const files = await readdir(wikiDir);
  const entries: IndexEntry[] = [];

  for (const file of files) {
    if (!file.endsWith(".md")) continue;

    const slug = file.replace(/\.md$/, "");
    const raw = await Bun.file(join(wikiDir, file)).text();
    const { meta, content } = parseFrontmatter(raw);

    const title = meta.title?.replace(/"/g, "") ?? slug;
    const tags = meta.tags
      ? meta.tags
          .match(/\[(.+)\]/)?.[1]
          ?.split(",")
          .map((t) => t.trim().replace(/"/g, ""))
          .filter(Boolean) ?? []
      : [];

    const summary =
      content
        .split("\n")
        .find((l) => l.trim().length > 0)
        ?.slice(0, 100) ?? "No summary";

    entries.push({ slug, title, summary, tags });
  }

  entries.sort((a, b) => a.title.localeCompare(b.title));
  await Bun.write(indexPath, buildIndexContent(category, entries));

  return { pageCount: entries.length };
}

export async function addToIndex(
  rootPath: string,
  category: Category,
  entry: IndexEntry
): Promise<void> {
  const indexPath = getIndexPath(rootPath, category);

  if (!(await exists(indexPath))) {
    await initKnowledgeBase(rootPath, category);
  }

  const currentContent = await Bun.file(indexPath).text();

  // If this slug already exists in the index, rebuild instead
  if (currentContent.includes(`wiki/${entry.slug}.md`)) {
    await rebuildIndex(rootPath, category);
    return;
  }

  // If index is empty (has the placeholder), replace it
  if (currentContent.includes("_No pages yet")) {
    const entries = [entry];
    await Bun.write(indexPath, buildIndexContent(category, entries));
    return;
  }

  // Append to existing table
  const tags = entry.tags.map((t) => `\`${t}\``).join(", ");
  const newRow = `| [${entry.title}](wiki/${entry.slug}.md) | ${entry.summary} | ${tags} |`;
  const updatedContent = currentContent.trimEnd() + "\n" + newRow + "\n";

  // Update page count
  const countMatch = updatedContent.match(/_(\d+) pages indexed\._/);
  if (countMatch) {
    const newCount = parseInt(countMatch[1]) + 1;
    await Bun.write(
      indexPath,
      updatedContent.replace(
        `_${countMatch[1]} pages indexed._`,
        `_${newCount} pages indexed._`
      )
    );
  } else {
    await Bun.write(indexPath, updatedContent);
  }
}

export async function removeFromIndex(
  rootPath: string,
  category: Category,
  slug: string
): Promise<void> {
  await rebuildIndex(rootPath, category);
}
