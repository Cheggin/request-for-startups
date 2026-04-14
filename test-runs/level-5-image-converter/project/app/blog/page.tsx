import Link from "next/link";
import { blogPosts } from "@/lib/blog-posts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Practical guides on image formats, compression, and web performance from the Convertify team.",
  alternates: {
    canonical: "/blog",
  },
};

export default function BlogIndexPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Blog
      </h1>
      <p className="mt-3 text-lg text-muted">
        Guides on image formats, compression, and web performance.
      </p>

      <div className="mt-10 flex flex-col gap-8">
        {blogPosts.map((post) => (
          <article key={post.slug} className="group">
            <Link href={`/blog/${post.slug}`} className="block">
              <time
                dateTime={post.date}
                className="text-sm text-muted"
              >
                {new Date(post.date + "T00:00:00").toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              <h2 className="mt-1 text-xl font-semibold text-foreground group-hover:text-primary">
                {post.title}
              </h2>
              <p className="mt-2 text-muted leading-relaxed">
                {post.description}
              </p>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
