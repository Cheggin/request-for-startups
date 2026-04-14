"use client";

/**
 * Competitors page — will show real data from Browser Use scraping.
 * Currently shows "No data" until competitor monitor skill runs.
 */
export default function CompetitorsPage() {
  return (
    <div className="px-6 py-5 space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Competitors</h1>
      </div>

      <div className="bg-surface border border-border-subtle rounded-xl px-4 py-8 text-center">
        <p className="text-[13px] text-muted">No competitor data</p>
        <p className="text-[12px] text-muted-foreground mt-1">
          Run the competitor research skill to scan competitor websites for pricing, features, and changes.
          Requires <code className="bg-background px-1.5 py-0.5 rounded">BROWSER_USE_API_KEY</code> for ongoing monitoring.
        </p>
      </div>
    </div>
  );
}
