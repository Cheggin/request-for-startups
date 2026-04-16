import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getStartupType,
  getAllSlugs,
  type StartupType,
} from "@/data/startup-types";

interface PageProps {
  params: Promise<{ type: string }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map((type) => ({ type }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type } = await params;
  const data = getStartupType(type);
  if (!data) return {};

  return {
    title: data.metaTitle,
    description: data.metaDescription,
    alternates: {
      canonical: `/for/${data.slug}`,
    },
    openGraph: {
      title: data.metaTitle,
      description: data.metaDescription,
      url: `/for/${data.slug}`,
      type: "website",
    },
  };
}

function JsonLd({ data }: { data: StartupType }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: data.metaTitle,
    description: data.metaDescription,
    url: `/for/${data.slug}`,
    mainEntity: {
      "@type": "SoftwareApplication",
      name: "The Startup Machine",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "macOS, Linux",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

function ExampleSection({ example }: { example: NonNullable<StartupType["example"]> }) {
  return (
    <section className="mt-16">
      <h2 className="text-2xl font-semibold tracking-tight">
        What it built: {example.name}
      </h2>
      <p className="mt-3 text-neutral-600">{example.oneLiner}</p>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div>
          <h3 className="text-lg font-medium">The problem</h3>
          <p className="mt-2 text-neutral-600 leading-relaxed">
            {example.problem}
          </p>
        </div>
        <div>
          <h3 className="text-lg font-medium">The solution</h3>
          <p className="mt-2 text-neutral-600 leading-relaxed">
            {example.solution}
          </p>
        </div>
      </div>

      <div className="mt-10">
        <h3 className="text-lg font-medium">Tech stack</h3>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="pb-2 font-medium text-neutral-500">Layer</th>
              <th className="pb-2 font-medium text-neutral-500">Technology</th>
            </tr>
          </thead>
          <tbody>
            {example.stack.map((row) => (
              <tr key={row.layer} className="border-b border-neutral-100">
                <td className="py-2 text-neutral-700">{row.layer}</td>
                <td className="py-2">{row.technology}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-10">
        <h3 className="text-lg font-medium">Generated routes</h3>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="pb-2 font-medium text-neutral-500">Route</th>
              <th className="pb-2 font-medium text-neutral-500">Description</th>
            </tr>
          </thead>
          <tbody>
            {example.routes.map((route) => (
              <tr key={route.path} className="border-b border-neutral-100">
                <td className="py-2 font-mono text-sm text-neutral-700">
                  {route.path}
                </td>
                <td className="py-2">{route.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {example.deployUrl && (
        <div className="mt-8">
          <a
            href={example.deployUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
          >
            See the live deploy
          </a>
        </div>
      )}
    </section>
  );
}

function ApproachSection({
  approach,
  proofPoints,
}: {
  approach: string[];
  proofPoints: string[];
}) {
  return (
    <section className="mt-16">
      <h2 className="text-2xl font-semibold tracking-tight">
        How the harness builds this
      </h2>
      <div className="mt-6 space-y-3">
        {approach.map((point, i) => (
          <p key={i} className="text-neutral-600 leading-relaxed">
            {point}
          </p>
        ))}
      </div>

      {proofPoints.length > 0 && (
        <div className="mt-10 rounded-lg border border-neutral-200 bg-neutral-50 p-6">
          <h3 className="text-lg font-medium">Specifics</h3>
          <ul className="mt-3 space-y-2">
            {proofPoints.map((point, i) => (
              <li key={i} className="text-neutral-700 text-sm">
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function CtaSection() {
  return (
    <section className="mt-20 rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-center">
      <h2 className="text-xl font-semibold">Start building</h2>
      <p className="mt-2 text-neutral-600">
        Install the harness, type your idea, and get a deployed product.
      </p>
      <pre className="mt-6 inline-block rounded-md bg-neutral-900 px-6 py-3 text-left text-sm text-neutral-100">
        <code>npx create-startup-harness my-startup</code>
      </pre>
    </section>
  );
}

function RelatedTypes({
  current,
  allSlugs,
}: {
  current: string;
  allSlugs: { slug: string; name: string }[];
}) {
  const others = allSlugs.filter((t) => t.slug !== current);
  return (
    <nav className="mt-16 border-t border-neutral-200 pt-8">
      <h2 className="text-lg font-medium">Other startup types</h2>
      <div className="mt-4 flex flex-wrap gap-3">
        {others.map((t) => (
          <a
            key={t.slug}
            href={`/for/${t.slug}`}
            className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 hover:border-neutral-400 transition-colors"
          >
            {t.name}
          </a>
        ))}
      </div>
    </nav>
  );
}

export default async function StartupTypePage({ params }: PageProps) {
  const { type } = await params;
  const data = getStartupType(type);
  if (!data) notFound();

  const allTypes = getAllSlugs().map((slug) => {
    const t = getStartupType(slug)!;
    return { slug: t.slug, name: t.name };
  });

  return (
    <>
      <JsonLd data={data} />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <header>
          <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
            {data.name}
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            {data.headline}
          </h1>
          <p className="mt-4 text-lg text-neutral-600 leading-relaxed">
            {data.description}
          </p>
        </header>

        {data.example && <ExampleSection example={data.example} />}

        <ApproachSection
          approach={data.harnessApproach}
          proofPoints={data.proofPoints}
        />

        <CtaSection />

        <RelatedTypes current={data.slug} allSlugs={allTypes} />
      </main>
    </>
  );
}
