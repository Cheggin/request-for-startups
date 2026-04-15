import { getSettingsSnapshot } from "@/lib/data";

export const dynamic = "force-dynamic";

function formatServiceState(
  configured: boolean,
  partiallyConfigured: boolean
): { label: string; className: string } {
  if (configured) {
    return { label: "Configured", className: "text-positive" };
  }

  if (partiallyConfigured) {
    return { label: "Partial", className: "text-caution" };
  }

  return { label: "Missing", className: "text-negative" };
}

export default function SettingsPage() {
  const snapshot = getSettingsSnapshot();
  const configuredServices = snapshot.services.filter((service) => service.configured).length;

  return (
    <div className="px-6 py-5 max-w-6xl space-y-8">
      <h1 className="text-[18px] font-semibold text-text-primary leading-tight">
        Settings
      </h1>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[13px] font-semibold text-text-primary">
            Service Credentials
          </h2>
          <span className="text-[11px] text-text-tertiary tabular">
            {configuredServices}/{snapshot.services.length} configured
          </span>
        </div>
        <div className="border border-border-subtle rounded-md divide-y divide-border-subtle">
          {snapshot.services.map((service) => {
            const state = formatServiceState(
              service.configured,
              service.partiallyConfigured
            );

            return (
              <div
                key={service.name}
                className="px-4 py-3 hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      service.configured
                        ? "bg-positive"
                        : service.partiallyConfigured
                          ? "bg-caution"
                          : "bg-negative"
                    }`}
                  />
                  <span className="text-[13px] font-medium text-text-primary">
                    {service.name}
                  </span>
                  <span className={`ml-auto text-[11px] font-medium ${state.className}`}>
                    {state.label}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {service.envs.map((envName) => {
                    const isConfigured = service.configuredKeys.includes(envName);
                    return (
                      <code
                        key={envName}
                        className={`text-[11px] px-1.5 py-0.5 rounded font-mono ${
                          isConfigured
                            ? "bg-positive/10 text-positive"
                            : "bg-bg text-text-tertiary"
                        }`}
                      >
                        {envName}
                      </code>
                    );
                  })}
                </div>
                {service.sources.length > 0 && (
                  <p className="mt-2 text-[11px] text-text-tertiary font-mono">
                    {service.sources.join(", ")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-[13px] font-semibold text-text-primary mb-2">
          Harness Config
        </h2>
        <div className="border border-border-subtle rounded-md divide-y divide-border-subtle">
          {snapshot.harnessFiles.map((file) => (
            <div
              key={file.path}
              className="px-4 py-3 flex items-center gap-3 hover:bg-surface-hover transition-colors"
            >
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-text-primary">
                  {file.name}
                </div>
                <div className="text-[11px] text-text-tertiary font-mono truncate">
                  {file.path}
                </div>
              </div>
              <span className="ml-auto text-[11px] text-text-tertiary">
                {file.summary}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-[13px] font-semibold text-text-primary mb-2">
          Startup Configs
        </h2>
        {snapshot.startupConfigs.length === 0 ? (
          <div className="border border-border-subtle rounded-md px-4 py-5">
            <p className="text-[13px] text-text-secondary">
              No startup <code className="font-mono text-[12px] text-text-secondary bg-bg px-1 py-0.5 rounded">.harness/config.yml</code> files found.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {snapshot.startupConfigs.map((config) => (
              <div
                key={config.path}
                className="border border-border-subtle rounded-md overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-border-subtle bg-surface">
                  <div className="text-[13px] font-medium text-text-primary">
                    {config.startupName}
                  </div>
                  <div className="text-[11px] text-text-tertiary font-mono">
                    {config.path}
                  </div>
                </div>
                <div className="px-4 py-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(config.values).map(([key, value]) => (
                    <div key={key} className="text-[12px]">
                      <span className="text-text-tertiary font-mono">{key}</span>
                      <span className="text-text-secondary">: {value || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-[13px] font-semibold text-text-primary mb-2">
          Loop Registry
        </h2>
        {snapshot.loops.length === 0 ? (
          <div className="border border-border-subtle rounded-md px-4 py-5">
            <p className="text-[13px] text-text-secondary">No loops found.</p>
          </div>
        ) : (
          <div className="border border-border-subtle rounded-md overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-2 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
                    Loop
                  </th>
                  <th className="px-4 py-2 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-4 py-2 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
                    Interval
                  </th>
                  <th className="px-4 py-2 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {snapshot.loops.map((loop) => (
                  <tr
                    key={loop.name}
                    className="border-b border-border-subtle last:border-0 hover:bg-surface-hover transition-colors"
                  >
                    <td className="px-4 py-2.5 text-[13px] font-medium text-text-primary">
                      {loop.name}
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-text-secondary">
                      {loop.agent}
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-text-secondary font-mono">
                      {loop.interval}
                    </td>
                    <td className="px-4 py-2.5 text-[12px]">
                      <span
                        className={
                          loop.status === "running" ? "text-positive" : "text-text-tertiary"
                        }
                      >
                        {loop.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-[13px] font-semibold text-text-primary mb-2">
          Agent Definitions
        </h2>
        {snapshot.agents.length === 0 ? (
          <div className="border border-border-subtle rounded-md px-4 py-5">
            <p className="text-[13px] text-text-secondary">No agent definition files found.</p>
          </div>
        ) : (
          <div className="border border-border-subtle rounded-md overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-2 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-4 py-2 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-2 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
                    Tools
                  </th>
                  <th className="px-4 py-2 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
                    Writable
                  </th>
                  <th className="px-4 py-2 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
                    MCP
                  </th>
                </tr>
              </thead>
              <tbody>
                {snapshot.agents.map((agent) => (
                  <tr
                    key={agent.path}
                    className="border-b border-border-subtle last:border-0 hover:bg-surface-hover transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <div className="text-[13px] font-medium text-text-primary">
                        {agent.name}
                      </div>
                      <div className="text-[11px] text-text-tertiary font-mono">
                        {agent.path}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-text-secondary">
                      {agent.category}
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-text-secondary tabular">
                      {agent.allowedTools}
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-text-secondary tabular">
                      {agent.writableScopes}
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-text-secondary">
                      {agent.mcpServers.length > 0 ? agent.mcpServers.join(", ") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
