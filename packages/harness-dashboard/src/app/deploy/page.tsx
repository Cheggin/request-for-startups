import { getDeployments } from "@/lib/data";

export const dynamic = "force-dynamic";

function formatCreatedAt(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function getStateColor(state: string): string {
  const n = state.toUpperCase();
  if (n.includes("READY") || n.includes("SUCCESS")) return "bg-positive";
  if (n.includes("ERROR") || n.includes("FAIL")) return "bg-negative";
  if (n.includes("BUILD") || n.includes("QUEUE")) return "bg-caution";
  return "bg-text-tertiary";
}

function getStateText(state: string): string {
  const n = state.toUpperCase();
  if (n.includes("READY") || n.includes("SUCCESS")) return "text-positive";
  if (n.includes("ERROR") || n.includes("FAIL")) return "text-negative";
  return "text-text-tertiary";
}

export default function DeployPage() {
  const deployments = getDeployments();

  return (
    <div className="px-6 py-5">
      <div className="flex items-baseline gap-3 mb-5">
        <h1 className="text-lg heading-page text-text-primary leading-tight">Deployments</h1>
        {deployments.length > 0 && (
          <span className="text-sm text-text-tertiary tabular">{deployments.length}</span>
        )}
      </div>

      {deployments.length === 0 ? (
        <div className="rounded-lg border border-border-subtle bg-surface px-5 py-8 text-center">
          <p className="text-sm font-semibold text-text-secondary">No deployments found</p>
          <p className="text-xs text-text-tertiary mt-1">
            Authenticate with <code className="font-mono bg-bg px-1 py-0.5 rounded">vercel login</code> to see deploy history.
          </p>
        </div>
      ) : (
        <div className="relative pl-4">
          {/* Timeline line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border-subtle" />

          <div className="space-y-0">
            {deployments.map((deployment, index) => (
              <div key={`${deployment.name}:${deployment.url}:${index}`} className="relative flex items-start gap-4 py-3">
                {/* Timeline dot */}
                <span className={`absolute left-[-13px] top-4 w-2.5 h-2.5 rounded-full border-2 border-bg ${getStateColor(deployment.state)}`} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-text-primary">{deployment.name}</span>
                    <span className={`text-xs font-medium ${getStateText(deployment.state)}`}>
                      {deployment.state || "unknown"}
                    </span>
                    <span className="text-xs text-text-tertiary tabular ml-auto shrink-0">
                      {formatCreatedAt(deployment.createdAt)}
                    </span>
                  </div>
                  {deployment.url && (
                    <a
                      href={`https://${deployment.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-text-secondary hover:text-accent transition-colors mt-0.5 inline-block"
                    >
                      {deployment.url}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
