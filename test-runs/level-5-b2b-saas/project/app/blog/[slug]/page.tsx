import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPost, getAllBlogSlugs } from "@/lib/blog-posts";

export function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const post = getBlogPost(params.slug);
  if (!post) return { title: "Not found — PulseCheck" };
  return {
    title: `${post.title} — PulseCheck`,
    description: post.description,
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getBlogPost(params.slug);
  if (!post) notFound();

  return (
    <div className="flex flex-col min-h-screen" style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-[#e2e8f0]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#6d28d9] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <span className="font-semibold text-[15px] text-[#0f172a] tracking-tight">PulseCheck</span>
          </Link>
          <Link href="/dashboard" className="btn-primary text-sm px-4 py-2 rounded-lg">
            Open Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 py-16 px-6">
        <article className="max-w-3xl mx-auto">
          <Link
            href="/blog"
            className="text-sm text-[#6d28d9] hover:text-[#5b21b6] transition-colors mb-8 inline-block"
          >
            ← Back to blog
          </Link>

          <div className="flex items-center gap-3 text-sm text-[#94a3b8] mb-4">
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <span aria-hidden="true">·</span>
            <span>{post.readTime}</span>
            <span aria-hidden="true">·</span>
            <span>{post.author}</span>
          </div>

          <h1 className="text-4xl font-bold text-[#0f172a] tracking-tight leading-tight mb-8">
            {post.title}
          </h1>

          <div
            className="prose-custom"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(post.content) }}
          />

          <div className="mt-16 pt-8 border-t border-[#e2e8f0]">
            <div className="card" style={{ background: "#faf8ff", border: "1px solid #ede9fe" }}>
              <h3 className="font-semibold text-[#0f172a] text-lg mb-2">
                Try PulseCheck with your team
              </h3>
              <p className="text-[#64748b] text-sm mb-4">
                Start running weekly pulse surveys in under 2 minutes. Free for teams up to 10.
              </p>
              <Link href="/dashboard" className="btn-primary text-sm px-5 py-2.5 rounded-lg inline-block">
                Get started free
              </Link>
            </div>
          </div>
        </article>
      </main>

      <footer className="bg-white border-t border-[#e2e8f0] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#6d28d9] flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <span className="font-semibold text-sm text-[#0f172a]">PulseCheck</span>
          </Link>
          <nav className="flex items-center gap-6 flex-wrap justify-center">
            <Link href="/blog" className="text-sm text-[#64748b] hover:text-[#0f172a] transition-colors">Blog</Link>
            <Link href="/legal/terms" className="text-sm text-[#64748b] hover:text-[#0f172a] transition-colors">Terms</Link>
            <Link href="/legal/privacy" className="text-sm text-[#64748b] hover:text-[#0f172a] transition-colors">Privacy</Link>
          </nav>
          <p className="text-xs text-[#94a3b8]">2026 PulseCheck. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function markdownToHtml(markdown: string): string {
  let html = markdown
    // Tables
    .replace(/\n\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)+)/g, (_match, header: string, body: string) => {
      const headers = header.split("|").map((h: string) => h.trim()).filter(Boolean);
      const rows = body.trim().split("\n").map((row: string) =>
        row.split("|").map((cell: string) => cell.trim()).filter(Boolean)
      );
      return `<table><thead><tr>${headers.map((h: string) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((row: string[]) => `<tr>${row.map((cell: string) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    })
    // Headings
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Paragraphs
    .replace(/\n{2,}/g, '</p><p>')
    // Line breaks within paragraphs
    .replace(/\n/g, ' ');

  html = `<p>${html}</p>`;

  // Clean up empty paragraphs and fix nesting
  html = html
    .replace(/<p>\s*<h([23])>/g, '<h$1>')
    .replace(/<\/h([23])>\s*<\/p>/g, '</h$1>')
    .replace(/<p>\s*<table>/g, '<table>')
    .replace(/<\/table>\s*<\/p>/g, '</table>')
    .replace(/<p>\s*<\/p>/g, '')
    .replace(/<p>\s*<ol>/g, '<ol>')
    .replace(/<\/ol>\s*<\/p>/g, '</ol>');

  // Numbered lists
  html = html.replace(
    /(?:<p>)?\d+\.\s+(.+?)(?:<\/p>|(?=\d+\.\s))/g,
    '<li>$1</li>'
  );
  html = html.replace(/((?:<li>.+?<\/li>\s*)+)/g, '<ol>$1</ol>');

  return html;
}
