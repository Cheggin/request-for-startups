const API_KEYS = [
  { name: "PostHog", env: "NEXT_PUBLIC_POSTHOG_KEY", status: "configured" as const },
  { name: "Sentry", env: "SENTRY_DSN", status: "configured" as const },
  { name: "Stripe", env: "STRIPE_SECRET_KEY", status: "configured" as const },
  { name: "Browser Use", env: "BROWSER_USE_API_KEY", status: "configured" as const },
  { name: "Fal.ai", env: "FAL_KEY", status: "configured" as const },
  { name: "Convex", env: "NEXT_PUBLIC_CONVEX_URL", status: "configured" as const },
  { name: "Vercel", env: "VERCEL_TOKEN", status: "missing" as const },
  { name: "Resend", env: "RESEND_API_KEY", status: "missing" as const },
];

export default function SettingsPage() {
  const configured = API_KEYS.filter((k) => k.status === "configured").length;

  return (
    <div className="px-6 py-5 max-w-3xl">
      <h1 className="text-[18px] font-semibold text-text-primary leading-tight mb-6">Settings</h1>

      {/* API Keys */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[13px] font-semibold text-text-primary">API Keys</h2>
          <span className="text-[11px] text-text-tertiary tabular">
            {configured}/{API_KEYS.length} configured
          </span>
        </div>
        <div className="border border-border-subtle rounded-md divide-y divide-border-subtle">
          {API_KEYS.map((key) => (
            <div key={key.env} className="px-4 py-2.5 flex items-center justify-between hover:bg-surface-hover transition-colors">
              <div className="flex items-center gap-3">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  key.status === "configured" ? "bg-positive" : "bg-negative"
                }`} />
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-text-primary">{key.name}</span>
                  <code className="text-[11px] text-text-tertiary bg-bg px-1.5 py-0.5 rounded font-mono">
                    {key.env}
                  </code>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[11px] font-medium ${
                  key.status === "configured" ? "text-positive" : "text-negative"
                }`}>
                  {key.status === "configured" ? "Configured" : "Missing"}
                </span>
                {key.status === "missing" && (
                  <button className="text-[11px] font-medium text-accent-foreground bg-accent px-2.5 py-1 rounded-md hover:bg-accent-hover transition-colors">
                    Add
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Startup Management */}
      <section>
        <h2 className="text-[13px] font-semibold text-text-primary mb-2">Startup Management</h2>
        <div className="border border-border-subtle rounded-md px-4 py-4">
          <p className="text-[12px] text-text-secondary mb-3">
            Manage your startup projects. Each startup has its own Convex database, Vercel deployment, and agent configuration.
          </p>
          <div className="flex gap-2">
            <button className="text-[12px] font-medium text-accent-foreground bg-accent px-3 py-1.5 rounded-md hover:bg-accent-hover transition-colors">
              New Startup
            </button>
            <button className="text-[12px] font-medium text-text-primary border border-border px-3 py-1.5 rounded-md hover:bg-surface-hover transition-colors">
              Import Project
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
