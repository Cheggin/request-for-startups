"use client";

export default function CompetitorsPage() {
  return (
    <div className="px-6 py-5 max-w-5xl">
      <h1 className="text-[18px] font-semibold text-text-primary leading-tight mb-6">Competitors</h1>

      <div className="border border-border-subtle rounded-md px-4 py-5">
        <p className="text-[13px] text-text-secondary">No competitor data.</p>
        <p className="text-[12px] text-text-tertiary mt-1">
          Run the competitor research skill to scan competitor websites.
          Requires <code className="font-mono text-[12px] text-text-secondary bg-bg px-1 py-0.5 rounded">BROWSER_USE_API_KEY</code> for ongoing monitoring.
        </p>
      </div>
    </div>
  );
}
