"use client";

import { TrafficChart } from "@/components/charts/traffic-chart";

/**
 * Growth page — will show real data from PostHog, Browser Use scraping, etc.
 * Currently shows structure with "No data" states until sources are wired.
 */
export default function GrowthPage() {
  return (
    <div className="px-6 py-5 space-y-6 max-w-6xl">
      <h1 className="text-lg font-semibold text-foreground">Growth</h1>

      {/* Traffic — requires PostHog connection */}
      <div>
        <h2 className="text-[14px] font-semibold text-foreground mb-3">Traffic</h2>
        <div className="bg-surface border border-border-subtle rounded-xl px-4 py-8 text-center">
          <p className="text-[13px] text-muted">No traffic data</p>
          <p className="text-[12px] text-muted-foreground mt-1">
            Connect PostHog (<code className="bg-background px-1.5 py-0.5 rounded">NEXT_PUBLIC_POSTHOG_KEY</code>) to see real traffic data
          </p>
        </div>
      </div>

      {/* Social Mentions — requires Browser Use connection */}
      <div>
        <h2 className="text-[14px] font-semibold text-foreground mb-3">Social Mentions</h2>
        <div className="bg-surface border border-border-subtle rounded-xl px-4 py-8 text-center">
          <p className="text-[13px] text-muted">No social data</p>
          <p className="text-[12px] text-muted-foreground mt-1">
            Connect Browser Use (<code className="bg-background px-1.5 py-0.5 rounded">BROWSER_USE_API_KEY</code>) and run the social intelligence skill to collect mentions from Reddit, Twitter/X, LinkedIn, and HN
          </p>
        </div>
      </div>

      {/* Top Pages — requires PostHog connection */}
      <div>
        <h2 className="text-[14px] font-semibold text-foreground mb-3">Top Pages</h2>
        <div className="bg-surface border border-border-subtle rounded-xl px-4 py-8 text-center">
          <p className="text-[13px] text-muted">No page analytics</p>
          <p className="text-[12px] text-muted-foreground mt-1">
            Page-level analytics require PostHog. Run <code className="bg-background px-1.5 py-0.5 rounded">harness init</code> to configure.
          </p>
        </div>
      </div>
    </div>
  );
}
