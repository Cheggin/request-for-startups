import { TrafficChart } from "@/components/charts/traffic-chart";
import { Sparkline } from "@/components/charts/sparkline";
import { getGrowthSnapshot } from "@/lib/data";
import { formatNumber as fmt } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function GrowthPage() {
  const snapshot = getGrowthSnapshot();
  const sparkline = snapshot.traffic.map((point) => point.value);
  const totalTraffic = snapshot.traffic.reduce((sum, point) => sum + point.value, 0);
  const latestTraffic = snapshot.traffic[snapshot.traffic.length - 1]?.value ?? 0;
  const hasData = snapshot.traffic.length > 0 || snapshot.topPages.length > 0;

  return (
    <div className="px-8 py-6 max-w-[1200px]">
      <div className="flex items-baseline justify-between mb-5">
        <h1 className="text-lg heading-page text-text-primary leading-tight">Growth</h1>
        <span className="text-xs uppercase tracking-wider text-text-tertiary">
          {snapshot.source === "cache" ? "Cached metrics" : "No metrics"}
        </span>
      </div>

      {hasData ? (
        <>
          {/* Hero chart first */}
          <section className="mb-6">
            <TrafficChart
              data={snapshot.traffic.map((point) => ({ date: new Date(point.date), value: point.value }))}
              title="Traffic"
              subtitle={snapshot.posthogConfigured ? "From cached analytics" : "From local metric caches"}
            />
          </section>

          {/* Metric row below chart */}
          <section className="grid grid-cols-3 gap-3 mb-6">
            <div className="rounded-lg border border-border-subtle bg-surface px-4 py-3">
              <p className="label-section text-text-tertiary mb-0.5">Total Visitors</p>
              <div className="flex items-end justify-between">
                <p className="text-2xl number-hero text-text-primary">{fmt(totalTraffic)}</p>
                {sparkline.length >= 2 && (
                  <Sparkline data={sparkline} width={64} height={28} color="var(--text-primary)" />
                )}
              </div>
            </div>
            <div className="rounded-lg border border-border-subtle bg-surface px-4 py-3">
              <p className="label-section text-text-tertiary mb-0.5">Latest Day</p>
              <p className="text-2xl number-hero text-text-primary">{fmt(latestTraffic)}</p>
            </div>
            <div className="rounded-lg border border-border-subtle bg-surface px-4 py-3">
              <p className="label-section text-text-tertiary mb-0.5">Top Pages</p>
              <p className="text-2xl number-hero text-text-primary">{fmt(snapshot.topPages.length)}</p>
            </div>
          </section>

          {/* Top pages as compact list */}
          {snapshot.topPages.length > 0 && (
            <section>
              <h2 className="label-section text-text-tertiary mb-2">Top Pages</h2>
              <div className="rounded-lg border border-border-subtle bg-surface divide-y divide-border-subtle">
                {snapshot.topPages.map((page) => (
                  <div key={page.path} className="flex items-center justify-between px-3 py-2 hover:bg-surface-hover transition-colors">
                    <span className="text-sm font-mono text-text-secondary truncate">{page.path}</span>
                    <span className="text-sm font-semibold text-text-primary tabular shrink-0 ml-3">{fmt(page.views)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-border-subtle bg-surface px-5 py-8 text-center">
          <p className="text-sm font-semibold text-text-secondary">No traffic data</p>
          <p className="text-xs text-text-tertiary mt-1">
            Configure PostHog in <code className="font-mono bg-bg px-1 py-0.5 rounded text-text-secondary">.harness/secrets.env</code> or write cached metrics into a startup&apos;s <code className="font-mono bg-bg px-1 py-0.5 rounded text-text-secondary">.harness/metrics</code> directory.
          </p>
        </div>
      )}
    </div>
  );
}
