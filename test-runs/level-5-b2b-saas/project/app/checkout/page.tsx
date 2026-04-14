"use client";

import Link from "next/link";
import { useState } from "react";

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/webhooks/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-action": "create-checkout" },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || "price_pro_monthly",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

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
          <Link href="/" className="text-sm text-[#64748b] hover:text-[#0f172a] transition-colors">
            ← Back to home
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-16 px-6">
        <div className="max-w-md w-full">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-[#0f172a] tracking-tight mb-3">
              Upgrade to Pro
            </h1>
            <p className="text-[#64748b]">
              Unlimited members, custom questions, and full trend history for your team.
            </p>
          </div>

          <div className="card">
            <div className="flex items-end gap-1 mb-1">
              <span className="text-4xl font-bold text-[#0f172a]">$12</span>
              <span className="text-sm text-[#94a3b8] mb-1.5">/ team / month</span>
            </div>
            <p className="text-sm text-[#64748b] mb-6">Billed monthly. Cancel anytime.</p>

            <ul className="flex flex-col gap-2.5 mb-8">
              {[
                "Unlimited team members",
                "Custom question sets",
                "Full trend history",
                "Segment by department or role",
                "Slack + email digest",
                "Priority support",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-sm text-[#0f172a]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="btn-primary w-full py-3 rounded-xl font-semibold text-sm text-center disabled:opacity-60"
            >
              {loading ? "Redirecting to payment..." : "Subscribe to Pro"}
            </button>

            <p className="text-xs text-[#94a3b8] text-center mt-4">
              Secure payment via Stripe. You can cancel your subscription at any time.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
