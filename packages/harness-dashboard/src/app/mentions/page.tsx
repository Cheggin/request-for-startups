import { MetricCard } from "@/components/metrics/metric-card";
import { getMentionSnapshot } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import { MentionTable } from "./mention-table";
import { ResponseQueue } from "./response-queue";

export const dynamic = "force-dynamic";

const PLATFORM_LABELS: Record<string, string> = {
  hn: "Hacker News",
  reddit: "Reddit",
  twitter: "Twitter/X",
  linkedin: "LinkedIn",
};

export default function MentionsPage() {
  const snapshot = getMentionSnapshot();
  const queuedCount = snapshot.responseQueue.filter((r) => r.status === "queued").length;
  const postedCount = snapshot.responseQueue.filter((r) => r.status === "posted").length;

  return (
    <div className="px-6 py-5 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl heading-page text-text-primary leading-tight">
          Mentions
        </h1>
        <span className="text-xs uppercase tracking-wider text-text-tertiary">
          {snapshot.source === "cache"
            ? `Updated ${snapshot.lastUpdated ? new Date(snapshot.lastUpdated).toLocaleDateString() : "recently"}`
            : "No data"}
        </span>
      </div>

      {snapshot.mentions.length > 0 ? (
        <>
          <section className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
            <MetricCard
              label="Total Mentions"
              value={formatNumber(snapshot.mentions.length)}
            />
            <MetricCard
              label="Platforms"
              value={Object.keys(snapshot.platformCounts)
                .map((p) => PLATFORM_LABELS[p] ?? p)
                .join(", ")}
            />
            <MetricCard
              label="Response Queue"
              value={formatNumber(queuedCount)}
            />
            <MetricCard
              label="Responses Posted"
              value={formatNumber(postedCount)}
            />
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {Object.entries(snapshot.sentimentCounts).map(([sentiment, count]) => (
              <div
                key={sentiment}
                className="border border-border-subtle rounded-md px-4 py-3"
              >
                <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
                  {sentiment}
                </p>
                <p className="text-lg font-semibold tabular text-text-primary">
                  {formatNumber(count)}
                </p>
              </div>
            ))}
          </section>

          <section className="mb-6">
            <h2 className="text-base font-semibold text-text-primary mb-2">
              Top Mentions
            </h2>
            <MentionTable mentions={snapshot.mentions.slice(0, 25)} />
          </section>

          {snapshot.responseQueue.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-text-primary mb-2">
                Response Queue
              </h2>
              <ResponseQueue items={snapshot.responseQueue.slice(0, 20)} />
            </section>
          )}
        </>
      ) : (
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">
            Community Mentions
          </h2>
          <div className="border border-border-subtle rounded-md px-4 py-5">
            <p className="text-base text-text-secondary">No mention data.</p>
            <p className="text-sm text-text-tertiary mt-1">
              Run the mention monitor to start collecting data:
            </p>
            <code className="block mt-2 font-mono text-sm text-text-secondary bg-bg px-3 py-2 rounded">
              bun run packages/mention-monitor/src/index.ts
            </code>
          </div>
        </section>
      )}
    </div>
  );
}
