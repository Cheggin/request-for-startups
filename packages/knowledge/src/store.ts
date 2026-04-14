import { mkdir, exists } from "fs/promises";
import { join } from "path";
import { CATEGORIES, HARNESS_DIR, type Category } from "./constants.js";

export function getBasePath(rootPath: string, category: Category): string {
  return join(rootPath, HARNESS_DIR, category);
}

export function getRawPath(rootPath: string, category: Category): string {
  return join(getBasePath(rootPath, category), "raw");
}

export function getWikiPath(rootPath: string, category: Category): string {
  return join(getBasePath(rootPath, category), "wiki");
}

export function getIndexPath(rootPath: string, category: Category): string {
  return join(getBasePath(rootPath, category), "index.md");
}

export function getLogPath(rootPath: string, category: Category): string {
  return join(getBasePath(rootPath, category), "log.md");
}

export async function initKnowledgeBase(
  basePath: string,
  category: Category
): Promise<{ created: boolean; path: string }> {
  const categoryPath = getBasePath(basePath, category);
  const rawPath = getRawPath(basePath, category);
  const wikiPath = getWikiPath(basePath, category);
  const indexPath = getIndexPath(basePath, category);
  const logPath = getLogPath(basePath, category);

  const alreadyExists = await exists(categoryPath);

  await mkdir(rawPath, { recursive: true });
  await mkdir(wikiPath, { recursive: true });

  if (!(await exists(indexPath))) {
    await Bun.write(
      indexPath,
      `# ${category} Knowledge Index\n\n_No pages yet. Ingest sources to populate._\n`
    );
  }

  if (!(await exists(logPath))) {
    await Bun.write(
      logPath,
      `# ${category} Knowledge Log\n\n_Append-only operation chronicle._\n`
    );
  }

  return { created: !alreadyExists, path: categoryPath };
}

export async function initAllKnowledgeBases(
  basePath: string
): Promise<Map<Category, string>> {
  const results = new Map<Category, string>();
  for (const category of CATEGORIES) {
    const result = await initKnowledgeBase(basePath, category);
    results.set(category, result.path);
  }
  return results;
}

export function isValidCategory(value: string): value is Category {
  return CATEGORIES.includes(value as Category);
}
