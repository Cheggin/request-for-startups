import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getComparisonData,
  getAllComparisonSlugs,
  getRelatedComparisons,
} from "@/lib/comparison-data";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllComparisonSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = getComparisonData(slug);
  if (!data) return {};

  return {
    title: data.title,
    description: data.metaDescription,
    alternates: {
      canonical: `/compare/${slug}`,
    },
    openGraph: {
      title: data.title,
      description: data.metaDescription,
      type: "website",
    },
  };
}

export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getComparisonData(slug);
  if (!data) notFound();

  const related = getRelatedComparisons(slug);

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5" style={{ color: "var(--color-muted)" }}>
          <li>
            <Link href="/" className="hover:underline" style={{ color: "var(--color-primary)" }}>
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/alternatives" className="hover:underline" style={{ color: "var(--color-primary)" }}>
              Alternatives
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{data.competitorName}</li>
        </ol>
      </nav>

      {/* Header */}
      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {data.headline}
        </h1>
        <p className="mt-4 text-lg leading-relaxed" style={{ color: "var(--color-muted)" }}>
          {data.summary}
        </p>
        <p className="mt-3 text-sm" style={{ color: "var(--color-muted)" }}>
          Last updated: {new Date(data.lastUpdated).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </header>

      {/* Comparison table */}
      <section className="mb-12">
        <h2 className="mb-6 text-xl font-semibold">Side-by-side comparison</h2>
        <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid var(--color-border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "var(--color-surface)" }}>
                <th className="px-4 py-3 text-left font-semibold" style={{ borderBottom: "1px solid var(--color-border)" }}>
                  Criteria
                </th>
                <th className="px-4 py-3 text-left font-semibold" style={{ borderBottom: "1px solid var(--color-border)" }}>
                  Startup Harness
                </th>
                <th className="px-4 py-3 text-left font-semibold" style={{ borderBottom: "1px solid var(--color-border)" }}>
                  {data.competitorName}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.criteria.map((criterion, i) => (
                <tr
                  key={criterion.name}
                  style={{
                    backgroundColor: i % 2 === 0 ? "transparent" : "var(--color-surface)",
                    borderBottom: i < data.criteria.length - 1 ? "1px solid var(--color-border)" : undefined,
                  }}
                >
                  <td className="px-4 py-3 font-medium align-top">{criterion.name}</td>
                  <td className="px-4 py-3 align-top" style={{ color: "var(--color-muted)" }}>
                    {criterion.ourProduct}
                  </td>
                  <td className="px-4 py-3 align-top" style={{ color: "var(--color-muted)" }}>
                    {criterion.competitor}
                    <br />
                    <a
                      href={criterion.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-xs hover:underline"
                      style={{ color: "var(--color-primary)" }}
                    >
                      Source ({criterion.sourceDate})
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Strengths grid */}
      <section className="mb-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg p-6" style={{ backgroundColor: "var(--color-success-light)", border: "1px solid var(--color-border)" }}>
          <h3 className="font-semibold" style={{ color: "var(--color-success)" }}>
            Startup Harness strengths
          </h3>
          <ul className="mt-4 space-y-2">
            {data.ourStrengths.map((s) => (
              <li key={s} className="flex gap-2 text-sm">
                <span className="mt-0.5 shrink-0" style={{ color: "var(--color-success)" }}>+</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg p-6" style={{ backgroundColor: "var(--color-primary-light)", border: "1px solid var(--color-border)" }}>
          <h3 className="font-semibold" style={{ color: "var(--color-primary)" }}>
            {data.competitorName} strengths
          </h3>
          <ul className="mt-4 space-y-2">
            {data.competitorStrengths.map((s) => (
              <li key={s} className="flex gap-2 text-sm">
                <span className="mt-0.5 shrink-0" style={{ color: "var(--color-primary)" }}>+</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Best for */}
      <section className="mb-12">
        <h2 className="mb-6 text-xl font-semibold">Which one is right for you?</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg p-6" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-muted)" }}>
              Choose Startup Harness if
            </h3>
            <p className="mt-2 text-sm leading-relaxed">{data.bestFor.ourProduct}</p>
          </div>
          <div className="rounded-lg p-6" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-muted)" }}>
              Choose {data.competitorName} if
            </h3>
            <p className="mt-2 text-sm leading-relaxed">{data.bestFor.competitor}</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mb-12 rounded-lg p-8 text-center" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <h2 className="text-xl font-semibold">Ready to try Startup Harness?</h2>
        <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
          Go from idea to deployed product with agent-assisted development.
        </p>
        <a
          href="https://github.com/reaganhsu/request-for-startups"
          className="mt-6 inline-block rounded-lg px-6 py-3 text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {data.ctaText}
        </a>
      </section>

      {/* Related comparisons */}
      {related.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 text-lg font-semibold">More comparisons</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {related.map((route) => (
              <Link
                key={route.slug}
                href={`/compare/${route.slug}`}
                className="group rounded-lg p-4 transition-colors"
                style={{ border: "1px solid var(--color-border)" }}
              >
                <span className="text-sm font-medium group-hover:underline">
                  vs {route.competitorName}
                </span>
                <span className="mt-1 block text-xs" style={{ color: "var(--color-muted)" }}>
                  {route.summary.slice(0, 100)}...
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: data.title,
            description: data.metaDescription,
            dateModified: data.lastUpdated,
            mainEntity: {
              "@type": "Table",
              about: `Comparison between Startup Harness and ${data.competitorName}`,
            },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: "/",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Alternatives",
                  item: "/alternatives",
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: `vs ${data.competitorName}`,
                },
              ],
            },
          }),
        }}
      />
    </main>
  );
}
