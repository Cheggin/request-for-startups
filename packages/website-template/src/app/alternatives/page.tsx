import type { Metadata } from "next";
import Link from "next/link";
import { getAllComparisons } from "@/lib/comparison-data";

export const metadata: Metadata = {
  title: "Startup Harness alternatives and comparisons",
  description:
    "See how Startup Harness compares to other scaffolding tools, boilerplates, and AI app builders. Evidence-sourced comparisons updated regularly.",
  alternates: {
    canonical: "/alternatives",
  },
  openGraph: {
    title: "Startup Harness alternatives and comparisons",
    description:
      "See how Startup Harness compares to other scaffolding tools, boilerplates, and AI app builders.",
    type: "website",
  },
};

export default function AlternativesPage() {
  const comparisons = getAllComparisons();

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
          <li aria-current="page">Alternatives</li>
        </ol>
      </nav>

      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Startup Harness alternatives and comparisons
        </h1>
        <p className="mt-4 text-lg leading-relaxed" style={{ color: "var(--color-muted)" }}>
          Honest, evidence-sourced comparisons to help you pick the right tool.
          Every claim links to its source so you can verify for yourself.
        </p>
      </header>

      <div className="grid gap-4">
        {comparisons.map((comparison) => (
          <Link
            key={comparison.slug}
            href={`/compare/${comparison.slug}`}
            className="group rounded-lg p-6 transition-colors"
            style={{ border: "1px solid var(--color-border)" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold group-hover:underline">
                  {comparison.headline}
                </h2>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>
                  {comparison.summary}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {comparison.criteria.slice(0, 3).map((c) => (
                    <span
                      key={c.name}
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: "var(--color-surface-alt)",
                        color: "var(--color-muted)",
                      }}
                    >
                      {c.name}
                    </span>
                  ))}
                  {comparison.criteria.length > 3 && (
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: "var(--color-surface-alt)",
                        color: "var(--color-muted)",
                      }}
                    >
                      +{comparison.criteria.length - 3} more
                    </span>
                  )}
                </div>
              </div>
              <span
                className="mt-1 shrink-0 text-sm"
                style={{ color: "var(--color-primary)" }}
                aria-hidden="true"
              >
                View comparison &rarr;
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Startup Harness alternatives and comparisons",
            description:
              "Evidence-sourced comparisons between Startup Harness and other tools.",
            mainEntity: {
              "@type": "ItemList",
              itemListElement: comparisons.map((c, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: c.headline,
                url: `/compare/${c.slug}`,
              })),
            },
          }),
        }}
      />
    </main>
  );
}
