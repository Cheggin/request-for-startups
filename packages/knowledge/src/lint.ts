import { join } from "path";
import { exists, readdir } from "fs/promises";
import { getWikiPath, getIndexPath } from "./store.js";
import { parseFrontmatter, listPages } from "./wiki.js";
import { logOperation } from "./log.js";
import {
  type Category,
  STALE_THRESHOLD_DAYS,
  WIKI_LINK_PATTERN,
} from "./constants.js";

export interface LintIssue {
  type:
    | "orphaned"
    | "stale"
    | "missing-crossref"
    | "contradiction"
    | "index-out-of-sync";
  slug: string;
  message: string;
  severity: "warning" | "error" | "info";
}

export interface LintResult {
  issues: LintIssue[];
  pageCount: number;
  checkedAt: string;
}

export async function lintWiki(
  rootPath: string,
  category: Category
): Promise<LintResult> {
  const wikiDir = getWikiPath(rootPath, category);
  const indexPath = getIndexPath(rootPath, category);
  const issues: LintIssue[] = [];

  if (!(await exists(wikiDir))) {
    return { issues: [], pageCount: 0, checkedAt: new Date().toISOString() };
  }

  const files = await readdir(wikiDir);
  const mdFiles = files.filter((f) => f.endsWith(".md"));

  if (mdFiles.length === 0) {
    return { issues: [], pageCount: 0, checkedAt: new Date().toISOString() };
  }

  const allSlugs = new Set(mdFiles.map((f) => f.replace(/\.md$/, "")));
  const incomingLinks = new Map<string, Set<string>>();
  const outgoingLinks = new Map<string, Set<string>>();

  // Initialize link maps
  for (const slug of allSlugs) {
    incomingLinks.set(slug, new Set());
    outgoingLinks.set(slug, new Set());
  }

  // Analyze each page
  for (const file of mdFiles) {
    const slug = file.replace(/\.md$/, "");
    const raw = await Bun.file(join(wikiDir, file)).text();
    const { meta, content } = parseFrontmatter(raw);

    // Check for stale content
    if (meta.updated) {
      const updatedDate = new Date(meta.updated);
      const daysSinceUpdate = Math.floor(
        (Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceUpdate > STALE_THRESHOLD_DAYS) {
        issues.push({
          type: "stale",
          slug,
          message: `Page "${slug}" has not been updated in ${daysSinceUpdate} days`,
          severity: "warning",
        });
      }
    }

    // Extract wiki links
    const linkMatches = content.matchAll(WIKI_LINK_PATTERN);
    for (const match of linkMatches) {
      const linkedSlug = match[1];
      outgoingLinks.get(slug)?.add(linkedSlug);

      if (allSlugs.has(linkedSlug)) {
        incomingLinks.get(linkedSlug)?.add(slug);
      } else {
        // Missing cross-reference
        issues.push({
          type: "missing-crossref",
          slug,
          message: `Page "${slug}" links to "[[${linkedSlug}]]" which does not exist`,
          severity: "error",
        });
      }
    }

    // Also check the linked frontmatter
    if (meta.linked) {
      const linkedMatch = meta.linked.match(/\[(.+)\]/);
      if (linkedMatch) {
        const linkedSlugs = linkedMatch[1]
          .split(",")
          .map((s) => s.trim().replace(/"/g, ""))
          .filter(Boolean);
        for (const ls of linkedSlugs) {
          outgoingLinks.get(slug)?.add(ls);
          if (allSlugs.has(ls)) {
            incomingLinks.get(ls)?.add(slug);
          }
        }
      }
    }
  }

  // Check for orphaned pages (no incoming links, excluding the first page)
  if (allSlugs.size > 1) {
    for (const slug of allSlugs) {
      const incoming = incomingLinks.get(slug);
      const outgoing = outgoingLinks.get(slug);
      if (
        incoming &&
        incoming.size === 0 &&
        outgoing &&
        outgoing.size === 0
      ) {
        issues.push({
          type: "orphaned",
          slug,
          message: `Page "${slug}" has no incoming or outgoing links`,
          severity: "warning",
        });
      }
    }
  }

  // Check index sync
  if (await exists(indexPath)) {
    const indexContent = await Bun.file(indexPath).text();
    for (const slug of allSlugs) {
      if (!indexContent.includes(`wiki/${slug}.md`)) {
        issues.push({
          type: "index-out-of-sync",
          slug,
          message: `Page "${slug}" exists but is not in index.md`,
          severity: "error",
        });
      }
    }
  }

  await logOperation(rootPath, category, {
    operation: "lint",
    details: `Lint check found ${issues.length} issue(s) across ${mdFiles.length} pages`,
  });

  return {
    issues,
    pageCount: mdFiles.length,
    checkedAt: new Date().toISOString(),
  };
}
