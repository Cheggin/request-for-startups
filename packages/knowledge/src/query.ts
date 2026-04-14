import { exists } from "fs/promises";
import { getIndexPath } from "./store.js";
import { searchPages, readPage, listPages } from "./wiki.js";
import { logOperation } from "./log.js";
import { type Category } from "./constants.js";

export interface QueryContext {
  question: string;
  category: Category;
  indexContent: string;
  relevantPages: {
    slug: string;
    title: string;
    content: string;
    meta: Record<string, string>;
    relevanceScore: number;
  }[];
  totalPagesInCategory: number;
}

export async function queryKnowledge(
  rootPath: string,
  category: Category,
  question: string
): Promise<QueryContext> {
  // Step 1: Read the index
  const indexPath = getIndexPath(rootPath, category);
  let indexContent = "";

  if (await exists(indexPath)) {
    indexContent = await Bun.file(indexPath).text();
  }

  // Step 2: Search for relevant pages
  const searchResults = await searchPages(rootPath, category, question);

  // Step 3: Read the top relevant pages (max 10)
  const topResults = searchResults.slice(0, 10);
  const relevantPages: QueryContext["relevantPages"] = [];

  for (const result of topResults) {
    const page = await readPage(rootPath, category, result.slug);
    if (page) {
      relevantPages.push({
        slug: result.slug,
        title: result.title,
        content: page.content,
        meta: page.meta,
        relevanceScore: result.score,
      });
    }
  }

  // Step 4: Get total page count
  const allPages = await listPages(rootPath, category);

  await logOperation(rootPath, category, {
    operation: "query",
    details: `Query "${question}" matched ${relevantPages.length} of ${allPages.length} pages`,
  });

  return {
    question,
    category,
    indexContent,
    relevantPages,
    totalPagesInCategory: allPages.length,
  };
}
