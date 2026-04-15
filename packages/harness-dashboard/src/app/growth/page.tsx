import { TrafficChart } from "@/components/charts/traffic-chart";
import { MetricCard } from "@/components/metrics/metric-card";
import { getGrowthSnapshot } from "@/lib/data";

export const dynamic = "force-dynamic";

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export default function GrowthPage() {
  const snapshot = getGrowthSnapshot();
  const sparkline = snapshot.traffic.map((point) => point.value);
  const totalTraffic = snapshot.traffic.reduce((sum, point) => sum + point.value, 0);
  const latestTraffic = snapshot.traffic[snapshot.traffic.length - 1]?.value ?? 0;

  return (
    <div className="px-6 py-5 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[18px] font-semibold text-text-primary leading-tight">
          Growth
        </h1>
        <span className="text-[11px] uppercase tracking-wider text-text-tertiary">
          {snapshot.source === "cache" ? "Cached metrics" : "No metrics"}
        </span>
      </div>

      {snapshot.traffic.length > 0 || snapshot.topPages.length > 0 ? (
        <>
          <section className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <MetricCard
              label="Traffic Volume"
              value={formatNumber(totalTraffic)}
              sparklineData={sparkline}
            />
            <MetricCard
              label="Latest Day"
              value={formatNumber(latestTraffic)}
              sparklineData={sparkline}
            />
            <MetricCard
              label="Top Pages"
              value={formatNumber(snapshot.topPages.length)}
              sparklineData={sparkline}
            />
          </section>

          <section className="mb-6">
            <TrafficChart
              data={snapshot.traffic.map((point) => ({
                date: new Date(point.date),
                value: point.value,
              }))}
              title="Traffic"
              subtitle={snapshot.posthogConfigured ? "Rendered from cached analytics" : "Rendered from local metric caches"}
            />
          </section>

          <section className="mb-6">
            <h2 className="text-[13px] font-semibold text-text-primary mb-2">
              Top Pages
            </h2>
            {snapshot.topPages.length === 0 ? (
              <div className="border border-border-subtle rounded-md px-4 py-5">
                <p className="text-[13px] text-text-secondary">No top-page metrics.</p>
                <p className="text-[12px] text-text-tertiary mt-1">
                  Cached growth data exists, but it does not contain page-level analytics.
                </p>
              </div>
            ) : (
              <div className="border border-border-subtle rounded-md overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-4 py-2 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
                        Page
                      </th>
                      <th className="px-4 py-2 text-[11px] font-medium text-text-tertiary uppercase tracking-wider text-right">
                        Views
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.topPages.map((page) => (
                      <tr
                        key={page.path}
                        className="border-b border-border-subtle last:border-0 hover:bg-surface-hover transition-colors"
                      >
                        <td className="px-4 py-2.5 text-[12px] font-mono text-text-secondary">
                          {page.path}
                        </td>
                        <td className="px-4 py-2.5 text-[12px] text-text-primary text-right tabular">
                          {formatNumber(page.views)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : (
        <section className="mb-6">
          <h2 className="text-[13px] font-semibold text-text-primary mb-2">Traffic</h2>
          <div className="border border-border-subtle rounded-md px-4 py-5">
            <p className="text-[13px] text-text-secondary">No traffic data.</p>
            <p className="text-[12px] text-text-tertiary mt-1">
              Configure PostHog in <code className="font-mono text-[12px] text-text-secondary bg-bg px-1 py-0.5 rounded">.harness/secrets.env</code> or write cached metrics into a startup&apos;s <code className="font-mono text-[12px] text-text-secondary bg-bg px-1 py-0.5 rounded">.harness/metrics</code> or <code className="font-mono text-[12px] text-text-secondary bg-bg px-1 py-0.5 rounded">.harness/analytics</code> directory.
            </p>
          </div>
        </section>
      )}

      <section className="mb-6">
        <h2 className="text-[13px] font-semibold text-text-primary mb-2">
          Social Mentions
        </h2>
        <div className="border border-border-subtle rounded-md px-4 py-5">
          <p className="text-[13px] text-text-secondary">No social data.</p>
          <p className="text-[12px] text-text-tertiary mt-1">
            Social intelligence still depends on Browser Use runs writing cached outputs for this dashboard to read.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-[13px] font-semibold text-text-primary mb-2">
          Data Source
        </h2>
        <div className="border border-border-subtle rounded-md px-4 py-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <span className={`text-[11px] font-medium px-2 py-1 rounded ${
              snapshot.posthogConfigured
                ? "bg-positive/10 text-positive"
                : "bg-negative/10 text-negative"
            }`}>
              PostHog {snapshot.posthogConfigured ? "configured" : "missing"}
            </span>
            <span className={`text-[11px] font-medium px-2 py-1 rounded ${
              snapshot.cacheFiles.length > 0
                ? "bg-accent/10 text-accent"
                : "bg-text-tertiary/10 text-text-tertiary"
            }`}>
              {snapshot.cacheFiles.length} cache file{snapshot.cacheFiles.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="space-y-1">
            {snapshot.notes.map((note) => (
              <p key={note} className="text-[12px] text-text-secondary">
                {note}
              </p>
            ))}
          </div>

          {snapshot.cacheFiles.length > 0 && (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary mb-2">
                Scanned Files
              </p>
              <div className="space-y-1">
                {snapshot.cacheFiles.slice(0, 8).map((filePath) => (
                  <p
                    key={filePath}
                    className="text-[11px] font-mono text-text-tertiary"
                  >
                    {filePath}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
