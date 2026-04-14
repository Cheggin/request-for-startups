import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Convertify",
  description:
    "Free single-file conversion forever. Upgrade to Pro for batch conversion, priority support, and more.",
};

const FREE_FEATURES = [
  "Single-file conversion",
  "PNG, JPG, WebP output",
  "Quality controls",
  "No sign-up required",
  "Unlimited conversions",
  "100% browser-based privacy",
];

const PRO_FEATURES = [
  "Everything in Free",
  "Batch conversion (up to 20 files)",
  "ZIP download for batches",
  "Conversion history",
  "Priority support",
  "API access (100 req/hr)",
];

export default function PricingPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="mb-12 text-center" data-testid="pricing-hero">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
          Free for single-file conversion. Upgrade for power features.
        </p>
      </div>

      <div
        className="grid gap-6 md:grid-cols-2"
        data-testid="pricing-plans"
      >
        {/* Free Plan */}
        <Card
          className="flex flex-col"
          data-testid="plan-free"
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">Free</h2>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight text-foreground">
                $0
              </span>
              <span className="text-sm text-muted">/forever</span>
            </div>
            <p className="mt-2 text-sm text-muted">
              Perfect for quick, one-off conversions.
            </p>
          </div>

          <ul className="mb-8 flex flex-1 flex-col gap-3">
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="mt-0.5 shrink-0 text-success"
                >
                  <path
                    d="M4 8l3 3 5-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-foreground">{feature}</span>
              </li>
            ))}
          </ul>

          <Button variant="secondary" className="w-full" data-testid="plan-free-cta">
            Get started — it&apos;s free
          </Button>
        </Card>

        {/* Pro Plan */}
        <Card
          className="relative flex flex-col border-primary"
          data-testid="plan-pro"
        >
          <Badge
            variant="primary"
            className="absolute -top-2.5 left-4"
          >
            Most Popular
          </Badge>

          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">Pro</h2>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight text-foreground">
                $8
              </span>
              <span className="text-sm text-muted">/month</span>
            </div>
            <p className="mt-2 text-sm text-muted">
              For professionals who convert images daily.
            </p>
          </div>

          <ul className="mb-8 flex flex-1 flex-col gap-3">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="mt-0.5 shrink-0 text-primary"
                >
                  <path
                    d="M4 8l3 3 5-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-foreground">{feature}</span>
              </li>
            ))}
          </ul>

          <Button className="w-full" data-testid="plan-pro-cta">
            Upgrade to Pro
          </Button>
        </Card>
      </div>

      {/* FAQ */}
      <div className="mt-16" data-testid="pricing-faq">
        <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
          Frequently Asked Questions
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Is the free plan really unlimited?
            </h3>
            <p className="mt-1 text-sm text-muted">
              Yes. Single-file conversions are free with no daily limits. We
              don&apos;t throttle free users.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Do my images get uploaded to a server?
            </h3>
            <p className="mt-1 text-sm text-muted">
              Never. All conversion happens in your browser using the Canvas
              API. Your images never leave your device.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Can I cancel my Pro subscription?
            </h3>
            <p className="mt-1 text-sm text-muted">
              Absolutely. Cancel anytime from your account settings. You&apos;ll
              keep Pro features until the end of your billing period.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              What formats are supported?
            </h3>
            <p className="mt-1 text-sm text-muted">
              Input: PNG, JPG, WebP, SVG, GIF, BMP, TIFF. Output: PNG, JPG,
              WebP. More formats coming soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
