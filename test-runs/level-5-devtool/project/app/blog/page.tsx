import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog-posts";

export const metadata: Metadata = {
  title: "Blog — json2ts",
  description:
    "Articles on TypeScript type generation, API safety, and developer tooling.",
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Blog</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Writing about TypeScript type generation, API safety, and developer
        workflows.
      </p>

      <div className="mt-12 space-y-10">
        {posts.map((post) => (
          <article key={post.slug} className="group">
            <Link href={`/blog/${post.slug}`} className="block">
              <time
                dateTime={post.date}
                className="text-sm text-muted-foreground"
              >
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              <h2 className="mt-2 text-xl font-semibold tracking-tight group-hover:text-accent transition-colors">
                {post.title}
              </h2>
              <p className="mt-2 text-muted-foreground">{post.description}</p>
              <span className="mt-3 inline-block text-sm font-medium text-accent">
                Read article &rarr;
              </span>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
