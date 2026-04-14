"use client";

export default function GrowthPage() {
  return (
    <div className="px-6 py-5 max-w-5xl">
      <h1 className="text-[18px] font-semibold text-text-primary leading-tight mb-6">Growth</h1>

      <section className="mb-6">
        <h2 className="text-[13px] font-semibold text-text-primary mb-2">Traffic</h2>
        <div className="border border-border-subtle rounded-md px-4 py-5">
          <p className="text-[13px] text-text-secondary">No traffic data.</p>
          <p className="text-[12px] text-text-tertiary mt-1">
            Connect PostHog (<code className="font-mono text-[12px] text-text-secondary bg-bg px-1 py-0.5 rounded">NEXT_PUBLIC_POSTHOG_KEY</code>) to see real traffic data.
          </p>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-[13px] font-semibold text-text-primary mb-2">Social Mentions</h2>
        <div className="border border-border-subtle rounded-md px-4 py-5">
          <p className="text-[13px] text-text-secondary">No social data.</p>
          <p className="text-[12px] text-text-tertiary mt-1">
            Connect Browser Use (<code className="font-mono text-[12px] text-text-secondary bg-bg px-1 py-0.5 rounded">BROWSER_USE_API_KEY</code>) and run the social intelligence skill to collect mentions.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-[13px] font-semibold text-text-primary mb-2">Top Pages</h2>
        <div className="border border-border-subtle rounded-md px-4 py-5">
          <p className="text-[13px] text-text-secondary">No page analytics.</p>
          <p className="text-[12px] text-text-tertiary mt-1">
            Page-level analytics require PostHog. Run <code className="font-mono text-[12px] text-text-secondary bg-bg px-1 py-0.5 rounded">harness init</code> to configure.
          </p>
        </div>
      </section>
    </div>
  );
}
