import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing — json2ts",
  description: "Free CLI tool, Pro and Team plans with REST API access for converting JSON to TypeScript.",
};

const TIERS = [
  {
    name: "Free",
    subtitle: "For individual developers",
    price: "$0",
    period: "forever",
    cta: "Install CLI",
    ctaHref: "/docs",
    highlighted: false,
    features: [
      { text: "CLI tool", included: true },
      { text: "Web playground", included: true },
      { text: "REST API — 100 req/day", included: true },
      { text: "1 API key", included: true },
      { text: "Batch conversion", included: false },
      { text: "Custom naming templates", included: false },
      { text: "Priority support", included: false },
    ],
  },
  {
    name: "Pro",
    subtitle: "For power users and small teams",
    price: "$12",
    period: "/mo",
    cta: "Start Free Trial",
    ctaHref: "#",
    highlighted: true,
    features: [
      { text: "CLI tool", included: true },
      { text: "Web playground", included: true },
      { text: "REST API — 10,000 req/day", included: true },
      { text: "5 API keys", included: true },
      { text: "Batch conversion", included: true },
      { text: "Custom naming templates", included: true },
      { text: "Email support", included: true },
    ],
  },
  {
    name: "Team",
    subtitle: "For organizations at scale",
    price: "$29",
    period: "/mo per seat",
    cta: "Contact Sales",
    ctaHref: "#",
    highlighted: false,
    features: [
      { text: "CLI tool", included: true },
      { text: "Web playground", included: true },
      { text: "REST API — 50,000 req/day", included: true },
      { text: "Unlimited API keys", included: true },
      { text: "Batch conversion", included: true },
      { text: "Custom naming templates", included: true },
      { text: "Slack + Email support", included: true },
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Simple, transparent pricing</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          The CLI is free forever. Pay only if you need the REST API at scale.
        </p>
      </div>

      <div className="mt-16 grid gap-8 lg:grid-cols-3">
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className={`relative rounded-2xl border p-8 ${
              tier.highlighted
                ? "border-accent bg-accent/5 shadow-lg shadow-accent/10"
                : "border-border"
            }`}
          >
            {tier.highlighted && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                Most Popular
              </span>
            )}
            <h2 className="text-xl font-bold">{tier.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{tier.subtitle}</p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight">{tier.price}</span>
              <span className="text-sm text-muted-foreground">{tier.period}</span>
            </div>
            <Link
              href={tier.ctaHref}
              className={`mt-8 block w-full rounded-lg py-3 text-center text-sm font-medium transition-colors ${
                tier.highlighted
                  ? "bg-accent text-accent-foreground hover:bg-accent/90"
                  : "border border-border hover:bg-muted"
              }`}
            >
              {tier.cta}
            </Link>
            <ul className="mt-8 space-y-3">
              {tier.features.map((feature) => (
                <li key={feature.text} className="flex items-start gap-3 text-sm">
                  {feature.included ? (
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 8.5l3.5 3.5L13 4.5" />
                    </svg>
                  ) : (
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M4 8h8" />
                    </svg>
                  )}
                  <span className={feature.included ? "" : "text-muted-foreground"}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-xl border border-border bg-muted/30 p-8 text-center">
        <h3 className="text-xl font-bold">Need more?</h3>
        <p className="mt-2 text-muted-foreground">
          Enterprise plans with custom rate limits, SLA guarantees, and dedicated support are available.
        </p>
        <a
          href="mailto:sales@json2ts.dev"
          className="mt-4 inline-flex h-10 items-center rounded-lg border border-border px-6 text-sm font-medium transition-colors hover:bg-muted"
        >
          Contact Sales
        </a>
      </div>
    </div>
  );
}
