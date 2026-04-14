import * as fs from "fs";
import * as path from "path";
import { CATEGORIES, RESEARCH_DIR, type Category, type Source } from "./constants";

export interface PageFrontmatter {
  title: string; category: Category; tags: string[];
  created: string; updated: string; confidence: number; source: Source;
}
export interface Page extends PageFrontmatter { slug: string; content: string; }
export interface PageSummary {
  slug: string; title: string; category: Category;
  tags: string[]; confidence: number; updated: string;
}
export interface QueryResult { page: PageSummary; snippets: string[]; score: number; }

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function getResearchDir(projectRoot: string): string {
  return path.join(projectRoot, RESEARCH_DIR);
}
function getCategoryDir(projectRoot: string, category: Category): string {
  const dir = path.join(getResearchDir(projectRoot), category);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
function serializeFrontmatter(fm: PageFrontmatter): string {
  const escapedTitle = fm.title.replace(/"/g, '\\"');
  return [
    "---",
    'title: "' + escapedTitle + '"',
    "category: " + fm.category,
    "tags: [" + fm.tags.map((t) => '"' + t + '"').join(", ") + "]",
    "created: " + fm.created,
    "updated: " + fm.updated,
    "confidence: " + fm.confidence,
    "source: " + fm.source,
    "---",
  ].join("\n");
}
function parseFrontmatter(raw: string): { frontmatter: PageFrontmatter; content: string } | null {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return null;
  const yaml = match[1]; const content = match[2].trim();
  const get = (key: string): string => {
    const m = yaml.match(new RegExp("^" + key + ":\\s*(.+)$", "m"));
    return m ? m[1].trim() : "";
  };
  const title = get("title").replace(/^"|"$/g, "").replace(/\\"/g, '"');
  const category = get("category") as Category;
  const tagsRaw = get("tags");
  const tagsMatch = tagsRaw.match(/\[([^\]]*)\]/);
  const tags = tagsMatch ? tagsMatch[1].split(",").map((t) => t.trim().replace(/^"|"$/g, "")).filter(Boolean) : [];
  const created = get("created"); const updated = get("updated");
  const confidence = parseFloat(get("confidence")) || 0;
  const source = (get("source") || "session") as Source;
  if (!title || !category) return null;
  return { frontmatter: { title, category, tags, created, updated, confidence, source }, content };
}
function fuzzyMatch(query: string, target: string): number {
  const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const targetLower = target.toLowerCase();
  let score = 0;
  for (const term of queryTerms) {
    if (targetLower.includes(term)) {
      score += 1;
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp("\\b" + escaped + "\\b").test(targetLower)) score += 0.5;
    }
  }
  return score;
}

export function addPage(
  projectRoot: string, category: Category, title: string,
  content: string, tags: string[],
  options?: { confidence?: number; source?: Source },
): string {
  if (!CATEGORIES.includes(category)) throw new Error("Invalid category: " + category + ". Must be one of: " + CATEGORIES.join(", "));
  const slug = slugify(title);
  if (!slug) throw new Error("Title must produce a non-empty slug");
  const dir = getCategoryDir(projectRoot, category);
  const filePath = path.join(dir, slug + ".md");
  const now = new Date().toISOString();
  let created = now;
  if (fs.existsSync(filePath)) {
    const existing = parseFrontmatter(fs.readFileSync(filePath, "utf-8"));
    if (existing) created = existing.frontmatter.created;
  }
  const frontmatter: PageFrontmatter = {
    title, category, tags, created, updated: now,
    confidence: options?.confidence ?? 0.5, source: options?.source ?? "session",
  };
  fs.writeFileSync(filePath, serializeFrontmatter(frontmatter) + "\n\n" + content + "\n");
  return slug;
}

export function queryPages(
  projectRoot: string, query: string, category?: Category, tags?: string[],
): QueryResult[] {
  const results: QueryResult[] = [];
  const researchDir = getResearchDir(projectRoot);
  const cats = category ? [category] : [...CATEGORIES];
  for (const cat of cats) {
    const catDir = path.join(researchDir, cat);
    if (!fs.existsSync(catDir)) continue;
    for (const file of fs.readdirSync(catDir).filter((f) => f.endsWith(".md"))) {
      const raw = fs.readFileSync(path.join(catDir, file), "utf-8");
      const parsed = parseFrontmatter(raw);
      if (!parsed) continue;
      const { frontmatter, content } = parsed;
      const slug = file.replace(/\.md$/, "");
      if (tags && tags.length > 0) {
        if (!tags.some((t) => frontmatter.tags.some((pt) => pt.toLowerCase() === t.toLowerCase()))) continue;
      }
      let score = 0;
      score += fuzzyMatch(query, frontmatter.title) * 3;
      score += fuzzyMatch(query, frontmatter.tags.join(" ")) * 2;
      score += fuzzyMatch(query, content);
      if (score === 0) continue;
      const snippets: string[] = [];
      const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
      for (const line of content.split("\n")) {
        if (snippets.length >= 3) break;
        const ll = line.toLowerCase();
        if (queryTerms.some((t) => ll.includes(t)) && line.trim()) snippets.push(line.trim());
      }
      results.push({ page: { slug, title: frontmatter.title, category: frontmatter.category, tags: frontmatter.tags, confidence: frontmatter.confidence, updated: frontmatter.updated }, snippets, score });
    }
  }
  results.sort((a, b) => b.score - a.score);
  return results;
}

export function listPages(projectRoot: string, category?: Category): PageSummary[] {
  const results: PageSummary[] = [];
  const researchDir = getResearchDir(projectRoot);
  const cats = category ? [category] : [...CATEGORIES];
  for (const cat of cats) {
    const catDir = path.join(researchDir, cat);
    if (!fs.existsSync(catDir)) continue;
    for (const file of fs.readdirSync(catDir).filter((f) => f.endsWith(".md"))) {
      const raw = fs.readFileSync(path.join(catDir, file), "utf-8");
      const parsed = parseFrontmatter(raw);
      if (!parsed) continue;
      const { frontmatter } = parsed;
      results.push({ slug: file.replace(/\.md$/, ""), title: frontmatter.title, category: frontmatter.category, tags: frontmatter.tags, confidence: frontmatter.confidence, updated: frontmatter.updated });
    }
  }
  results.sort((a, b) => b.updated.localeCompare(a.updated));
  return results;
}

export function readPage(projectRoot: string, category: Category, slug: string): Page | null {
  const filePath = path.join(getResearchDir(projectRoot), category, slug + ".md");
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = parseFrontmatter(raw);
  if (!parsed) return null;
  return { ...parsed.frontmatter, slug, content: parsed.content };
}
