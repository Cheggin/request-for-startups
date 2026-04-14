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

const STATUS_STYLES = {
  configured: { dot: "bg-success", label: "Configured", text: "text-emerald-700" },
  missing: { dot: "bg-error", label: "Missing", text: "text-red-600" },
};

export default function SettingsPage() {
  const configured = API_KEYS.filter((k) => k.status === "configured").length;

  return (
    <div className="px-6 py-5 space-y-6 max-w-3xl">
      <h1 className="text-lg font-semibold text-foreground">Settings</h1>

      {/* API Keys */}
      <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-foreground">API Keys</h2>
          <span className="text-[11px] text-muted-foreground">
            {configured}/{API_KEYS.length} configured
          </span>
        </div>
        <div className="divide-y divide-border-subtle">
          {API_KEYS.map((key) => {
            const style = STATUS_STYLES[key.status];
            return (
              <div key={key.env} className="px-4 py-3 flex items-center justify-between hover:bg-surface-hover transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                  <div>
                    <span className="text-[13px] font-medium text-foreground">{key.name}</span>
                    <code className="text-[11px] text-muted-foreground ml-2 bg-background px-1.5 py-0.5 rounded">
                      {key.env}
                    </code>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[11px] font-medium ${style.text}`}>{style.label}</span>
                  {key.status === "missing" && (
                    <button className="text-[11px] font-medium text-accent-foreground bg-accent px-2.5 py-1 rounded-md hover:opacity-90 transition-opacity">
                      Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Startup Management */}
      <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle">
          <h2 className="text-[13px] font-semibold text-foreground">Startup Management</h2>
        </div>
        <div className="px-4 py-4 space-y-3">
          <p className="text-[12px] text-muted">
            Manage your startup projects. Each startup has its own Convex database, Vercel deployment, and agent configuration.
          </p>
          <div className="flex gap-2">
            <button className="text-[12px] font-medium text-accent-foreground bg-accent px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity">
              New Startup
            </button>
            <button className="text-[12px] font-medium text-foreground border border-border px-3 py-1.5 rounded-lg hover:bg-surface-hover transition-colors">
              Import Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
