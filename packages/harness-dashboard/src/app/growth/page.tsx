import { TrafficChart } from "@/components/charts/traffic-chart";
import { MetricCard } from "@/components/metrics/metric-card";
import { getGrowthSnapshot } from "@/lib/data";
import { formatNumber as fmt } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function GrowthPage() {
  const snapshot = getGrowthSnapshot();
  const sparkline = snapshot.traffic.map((point) => point.value);
  const totalTraffic = snapshot.traffic.reduce((sum, point) => sum + point.value, 0);
  const latestTraffic = snapshot.traffic[snapshot.traffic.length - 1]?.value ?? 0;

  return (
    <div className="px-6 py-5 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl heading-page text-text-primary leading-tight">Growth</h1>
        <span className="text-xs uppercase tracking-wider text-text-tertiary">
          {snapshot.source === "cache" ? "Cached metrics" : "No metrics"}
        </span>
      </div>

      {snapshot.traffic.length > 0 || snapshot.topPages.length > 0 ? (
        <>
          <section className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <MetricCard label="Traffic Volume" value={fmt(totalTraffic)} sparklineData={sparkline} />
            <MetricCard label="Latest Day" value={fmt(latestTraffic)} sparklineData={sparkline} />
            <MetricCard label="Top Pages" value={fmt(snapshot.topPages.length)} />
          </section>

          <section className="mb-6">
            <TrafficChart
              data={snapshot.traffic.map((point) => ({ date: new Date(point.date), value: point.value }))}
              title="Traffic"
              subtitle={snapshot.posthogConfigured ? "From cached analytics" : "From local metric caches"}
            />
          </section>

          {snapshot.topPages.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-text-primary mb-2">Top Pages</h2>
              <div className="border border-border-subtle rounded-md overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-4 py-2 text-xs font-medium text-text-tertiary uppercase tracking-wider">Page</th>
                      <th className="px-4 py-2 text-xs font-medium text-text-tertiary uppercase tracking-wider text-right">Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.topPages.map((page) => (
                      <tr key={page.path} className="border-b border-border-subtle last:border-0 hover:bg-surface-hover transition-colors">
                        <td className="px-4 py-2.5 text-sm font-mono text-text-secondary">{page.path}</td>
                        <td className="px-4 py-2.5 text-sm text-text-primary text-right tabular">{fmt(page.views)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      ) : (
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">Traffic</h2>
          <div className="border border-border-subtle rounded-md px-4 py-5">
            <p className="text-base text-text-secondary">No traffic data.</p>
            <p className="text-sm text-text-tertiary mt-1">
              Configure PostHog in <code className="font-mono text-sm text-text-secondary bg-bg px-1 py-0.5 rounded">.harness/secrets.env</code> or write cached metrics into a startup&apos;s <code className="font-mono text-sm text-text-secondary bg-bg px-1 py-0.5 rounded">.harness/metrics</code> directory.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
