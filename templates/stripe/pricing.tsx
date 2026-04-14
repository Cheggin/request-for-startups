"use client";

/**
 * Pricing page component.
 *
 * Displays tier cards with a monthly/annual toggle.
 * Clicking a plan navigates to Embedded Checkout.
 *
 * Usage:
 *   <PricingPage />
 */

import { useState } from "react";
import { PLANS, type PricingPlan } from "./constants";

// ---------------------------------------------------------------------------
// Pricing page
// ---------------------------------------------------------------------------

export function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Simple, transparent pricing
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          Choose the plan that fits your team. Upgrade or downgrade anytime.
        </p>
      </div>

      {/* Billing toggle */}
      <div className="mt-10 flex items-center justify-center gap-3">
        <span
          className={`text-sm font-medium ${!annual ? "text-gray-900" : "text-gray-500"}`}
        >
          Monthly
        </span>
        <button
          role="switch"
          aria-checked={annual}
          onClick={() => setAnnual(!annual)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
            annual ? "bg-indigo-600" : "bg-gray-200"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              annual ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <span
          className={`text-sm font-medium ${annual ? "text-gray-900" : "text-gray-500"}`}
        >
          Annual{" "}
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
            Save 17%
          </span>
        </span>
      </div>

      {/* Plan cards */}
      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} annual={annual} />
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Plan card
// ---------------------------------------------------------------------------

interface PlanCardProps {
  plan: PricingPlan;
  annual: boolean;
}

function PlanCard({ plan, annual }: PlanCardProps) {
  const displayPrice = annual ? plan.annualPrice : plan.monthlyPrice;
  const priceId = annual ? plan.annualPriceId : plan.monthlyPriceId;
  const period = annual ? "/year" : "/month";
  const isFree = plan.id === "free";
  const isEnterprise = plan.id === "enterprise";

  function handleSelect() {
    if (isFree) {
      // Free tier — just redirect to signup
      window.location.href = "/signup";
      return;
    }
    if (isEnterprise) {
      // Enterprise — redirect to contact form
      window.location.href = "/contact";
      return;
    }
    if (priceId) {
      // Navigate to checkout with the selected price
      window.location.href = `/checkout?price=${priceId}`;
    }
  }

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-8 ${
        plan.highlighted
          ? "border-indigo-600 shadow-lg ring-1 ring-indigo-600"
          : "border-gray-200"
      }`}
    >
      {plan.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
          Most Popular
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
      <p className="mt-1 text-sm text-gray-500">{plan.description}</p>

      <div className="mt-6">
        <span className="text-4xl font-bold tracking-tight text-gray-900">
          ${displayPrice}
        </span>
        {!isFree && (
          <span className="ml-1 text-sm text-gray-500">{period}</span>
        )}
      </div>

      {plan.trialDays > 0 && (
        <p className="mt-2 text-xs text-gray-500">
          {plan.trialDays}-day free trial
        </p>
      )}

      <ul className="mt-8 flex flex-1 flex-col gap-3">
        {plan.features.map((feature) => (
          <li key={feature.text} className="flex items-start gap-2 text-sm">
            {feature.included ? (
              <svg
                className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="mt-0.5 h-4 w-4 shrink-0 text-gray-300"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            )}
            <span
              className={feature.included ? "text-gray-700" : "text-gray-400"}
            >
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleSelect}
        className={`mt-8 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
          plan.highlighted
            ? "bg-indigo-600 text-white hover:bg-indigo-700"
            : "bg-gray-50 text-gray-900 ring-1 ring-inset ring-gray-200 hover:bg-gray-100"
        }`}
      >
        {plan.cta}
      </button>
    </div>
  );
}
