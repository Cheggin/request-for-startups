import { getDeployments } from "@/lib/data";

export const dynamic = "force-dynamic";

function formatCreatedAt(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function getStateColor(state: string): string {
  const normalized = state.toUpperCase();
  if (normalized.includes("READY") || normalized.includes("SUCCESS")) return "text-positive";
  if (normalized.includes("ERROR") || normalized.includes("FAIL")) return "text-negative";
  return "text-text-tertiary";
}

export default function DeployPage() {
  const deployments = getDeployments();

  return (
    <div className="px-6 py-5 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[18px] font-semibold text-text-primary leading-tight">Deployments</h1>
        {deployments.length > 0 && (
          <span className="text-[12px] text-text-tertiary tabular">{deployments.length} result{deployments.length === 1 ? "" : "s"}</span>
        )}
      </div>

      {deployments.length === 0 ? (
        <div className="border border-border-subtle rounded-md px-4 py-5">
          <p className="text-[13px] text-text-secondary">No deployments found.</p>
          <p className="text-[12px] text-text-tertiary mt-1">
            The dashboard reads deployments from <code className="font-mono text-[12px] text-text-secondary bg-bg px-1 py-0.5 rounded">vercel ls --json</code>. Authenticate with <code className="font-mono text-[12px] text-text-secondary bg-bg px-1 py-0.5 rounded">vercel login</code>.
          </p>
        </div>
      ) : (
        <div className="border border-border-subtle rounded-md overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-2 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">Project</th>
                <th className="px-4 py-2 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">URL</th>
                <th className="px-4 py-2 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">State</th>
                <th className="px-4 py-2 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody>
              {deployments.map((deployment, index) => (
                <tr key={`${deployment.name}:${deployment.url}:${index}`} className="border-b border-border-subtle last:border-0 hover:bg-surface-hover transition-colors">
                  <td className="px-4 py-2.5 text-[13px] font-medium text-text-primary">{deployment.name}</td>
                  <td className="px-4 py-2.5">
                    {deployment.url ? (
                      <a href={`https://${deployment.url}`} target="_blank" rel="noopener noreferrer" className="text-[12px] text-text-secondary hover:text-text-primary transition-colors font-mono">
                        {deployment.url}
                      </a>
                    ) : (
                      <span className="text-[12px] text-text-tertiary">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[12px] font-medium ${getStateColor(deployment.state)}`}>{deployment.state || "unknown"}</span>
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-text-tertiary tabular">{formatCreatedAt(deployment.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
