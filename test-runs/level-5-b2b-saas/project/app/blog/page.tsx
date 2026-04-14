import Link from "next/link";
import { BLOG_POSTS } from "@/lib/blog-posts";

export const metadata = {
  title: "Blog — PulseCheck",
  description: "Research and insights on team feedback, pulse surveys, and employee engagement.",
};

export default function BlogIndexPage() {
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
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-[#0f172a] tracking-tight mb-3">Blog</h1>
          <p className="text-lg text-[#64748b] mb-12">
            Research and insights on team feedback and employee engagement.
          </p>

          <div className="flex flex-col gap-8">
            {BLOG_POSTS.map((post) => (
              <article key={post.slug} className="card hover:border-[#6d28d9]/30 transition-colors">
                <div className="flex items-center gap-3 text-sm text-[#94a3b8] mb-3">
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                  <span aria-hidden="true">·</span>
                  <span>{post.readTime}</span>
                </div>
                <Link href={`/blog/${post.slug}`} className="group">
                  <h2 className="text-xl font-semibold text-[#0f172a] group-hover:text-[#6d28d9] transition-colors mb-2">
                    {post.title}
                  </h2>
                </Link>
                <p className="text-[#64748b] leading-relaxed mb-4">
                  {post.description}
                </p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-sm font-medium text-[#6d28d9] hover:text-[#5b21b6] transition-colors"
                >
                  Read more →
                </Link>
              </article>
            ))}
          </div>
        </div>
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
