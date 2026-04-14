import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "@/lib/blog-posts";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: `${post.title} — json2ts`,
    description: post.description,
  };
}

export default async function BlogPost({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <Link
        href="/blog"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        &larr; Back to blog
      </Link>

      <header className="mt-8">
        <time
          dateTime={post.date}
          className="text-sm text-muted-foreground"
        >
          {new Date(post.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
          {" · "}
          {post.readTime}
        </time>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {post.description}
        </p>
      </header>

      <div className="prose mt-10">
        {renderMarkdown(post.content)}
      </div>
    </article>
  );
}

function renderMarkdown(content: string) {
  const lines = content.trim().split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={i}
          className="mt-10 mb-4 text-2xl font-bold tracking-tight"
        >
          {line.slice(3)}
        </h2>
      );
      i++;
      continue;
    }

    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="mt-8 mb-3 text-xl font-semibold">
          {line.slice(4)}
        </h3>
      );
      i++;
      continue;
    }

    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <pre
          key={`code-${i}`}
          className="my-6 overflow-x-auto rounded-lg bg-code-bg p-4 text-sm text-code-fg"
        >
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    if (line.startsWith("- **") || line.startsWith("**")) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        listItems.push(lines[i].slice(2));
        i++;
      }
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${i}`} className="my-4 space-y-2 pl-4">
            {listItems.map((item, j) => (
              <li key={j} className="text-muted-foreground">
                {renderInline(item)}
              </li>
            ))}
          </ul>
        );
        continue;
      }
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    elements.push(
      <p key={i} className="my-4 leading-relaxed text-muted-foreground">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return elements;
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*)|(`[^`]+`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1]) {
      parts.push(
        <strong key={match.index} className="font-semibold text-foreground">
          {match[1].slice(2, -2)}
        </strong>
      );
    } else if (match[2]) {
      parts.push(
        <code
          key={match.index}
          className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono"
        >
          {match[2].slice(1, -1)}
        </code>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}
