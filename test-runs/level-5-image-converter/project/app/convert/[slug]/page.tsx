import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RouteConverter } from "@/components/converter/route-converter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getConversionData,
  getAllConversionSlugs,
  getRelatedConversions,
} from "@/lib/conversion-data";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllConversionSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = getConversionData(slug);
  if (!data) return {};

  return {
    title: data.title,
    description: data.metaDescription,
    openGraph: {
      title: data.title,
      description: data.metaDescription,
      type: "website",
    },
  };
}

export default async function ConversionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getConversionData(slug);
  if (!data) notFound();

  const related = getRelatedConversions(slug);

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {data.headline}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">{data.description}</p>
      </div>

      {/* Converter widget */}
      <section className="mb-12">
        <RouteConverter defaultFormat={data.targetFormat} />
      </section>

      {/* Conversion details */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Size and use cases */}
        <Card>
          <h2 className="text-lg font-semibold text-foreground">
            What to expect
          </h2>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">
              {data.typicalSizeChange}
            </span>
            <span className="text-sm text-muted">typical file size change</span>
          </div>

          <h3 className="mt-6 text-sm font-semibold text-foreground">
            Common use cases
          </h3>
          <ul className="mt-2 space-y-2">
            {data.useCases.map((useCase) => (
              <li key={useCase} className="flex gap-2 text-sm text-muted">
                <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {useCase}
              </li>
            ))}
          </ul>
        </Card>

        {/* Pros and cons */}
        <Card>
          <h2 className="text-lg font-semibold text-foreground">
            {data.targetLabel} format trade-offs
          </h2>

          <h3 className="mt-4 text-sm font-semibold text-success">
            Advantages
          </h3>
          <ul className="mt-2 space-y-2">
            {data.prosOfTarget.map((pro) => (
              <li key={pro} className="flex gap-2 text-sm text-muted">
                <span className="mt-0.5 shrink-0 text-success">+</span>
                {pro}
              </li>
            ))}
          </ul>

          <h3 className="mt-5 text-sm font-semibold text-error">
            Limitations
          </h3>
          <ul className="mt-2 space-y-2">
            {data.consOfTarget.map((con) => (
              <li key={con} className="flex gap-2 text-sm text-muted">
                <span className="mt-0.5 shrink-0 text-error">&ndash;</span>
                {con}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Browser support */}
      <Card className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">
          Browser support
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(data.browserSupport).map(([browser, supported]) => (
            <Badge
              key={browser}
              variant={supported ? "success" : "muted"}
            >
              {browser.charAt(0).toUpperCase() + browser.slice(1)}
              {supported ? " ✓" : " ✗"}
            </Badge>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">{data.browserSupportNote}</p>
      </Card>

      {/* Related conversions */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-foreground">
            Related conversions
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((route) => (
              <Link
                key={route.slug}
                href={`/convert/${route.slug}`}
                className="group rounded-lg border border-border p-4 transition-colors hover:border-border-hover hover:bg-surface"
              >
                <span className="text-sm font-medium text-foreground group-hover:text-primary">
                  {route.sourceLabel} to {route.targetLabel}
                </span>
                <span className="mt-1 block text-xs text-muted">
                  {route.typicalSizeChange}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Schema markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: `Convertify — ${data.sourceLabel} to ${data.targetLabel} converter`,
            description: data.metaDescription,
            applicationCategory: "Multimedia",
            operatingSystem: "Any",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            browserRequirements: "Requires a modern web browser with Canvas API support",
          }),
        }}
      />
    </div>
  );
}
