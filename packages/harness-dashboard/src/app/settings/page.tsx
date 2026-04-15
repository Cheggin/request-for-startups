import { getSettingsSnapshot } from "@/lib/data";

export const dynamic = "force-dynamic";

function formatServiceState(configured: boolean, partiallyConfigured: boolean): { label: string; className: string } {
  if (configured) return { label: "Configured", className: "text-positive" };
  if (partiallyConfigured) return { label: "Partial", className: "text-caution" };
  return { label: "Missing", className: "text-negative" };
}

export default function SettingsPage() {
  const snapshot = getSettingsSnapshot();
  const configuredServices = snapshot.services.filter((s) => s.configured).length;

  return (
    <div className="px-6 py-5 max-w-6xl space-y-8">
      <h1 className="text-xl font-semibold text-text-primary leading-tight">Settings</h1>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-text-primary">Service Credentials</h2>
          <span className="text-xs text-text-tertiary tabular">{configuredServices}/{snapshot.services.length} configured</span>
        </div>
        <div className="border border-border-subtle rounded-md divide-y divide-border-subtle">
          {snapshot.services.map((service) => {
            const state = formatServiceState(service.configured, service.partiallyConfigured);
            return (
              <div key={service.name} className="px-4 py-3 hover:bg-surface-hover transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`w-1.5 h-1.5 rounded-full ${service.configured ? "bg-positive" : service.partiallyConfigured ? "bg-caution" : "bg-negative"}`} />
                  <span className="text-base font-medium text-text-primary">{service.name}</span>
                  <span className={`ml-auto text-xs font-medium ${state.className}`}>{state.label}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {service.envs.map((envName) => (
                    <code key={envName} className={`text-xs px-1.5 py-0.5 rounded font-mono ${service.configuredKeys.includes(envName) ? "bg-positive/10 text-positive" : "bg-bg text-text-tertiary"}`}>
                      {envName}
                    </code>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-text-primary mb-2">Harness Config</h2>
        <div className="border border-border-subtle rounded-md divide-y divide-border-subtle">
          {snapshot.harnessFiles.map((file) => (
            <div key={file.path} className="px-4 py-3 flex items-center gap-3 hover:bg-surface-hover transition-colors">
              <div className="min-w-0">
                <div className="text-base font-medium text-text-primary">{file.name}</div>
                <div className="text-xs text-text-tertiary font-mono truncate">{file.path}</div>
              </div>
              <span className="ml-auto text-xs text-text-tertiary">{file.summary}</span>
            </div>
          ))}
        </div>
      </section>

      {snapshot.startupConfigs.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">Startup Configs</h2>
          <div className="space-y-4">
            {snapshot.startupConfigs.map((config) => (
              <div key={config.path} className="border border-border-subtle rounded-md overflow-hidden">
                <div className="px-4 py-3 border-b border-border-subtle bg-surface">
                  <div className="text-base font-medium text-text-primary">{config.startupName}</div>
                  <div className="text-xs text-text-tertiary font-mono">{config.path}</div>
                </div>
                <div className="px-4 py-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(config.values).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="text-text-tertiary font-mono">{key}</span>
                      <span className="text-text-secondary">: {value || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
