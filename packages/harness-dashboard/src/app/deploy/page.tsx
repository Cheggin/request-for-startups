"use client";

import { useState, useEffect } from "react";

interface Deployment {
  name: string;
  url: string;
  state: string;
  createdAt: string;
}

/**
 * Deploy page — reads real deployment data from Vercel CLI via API route.
 */
export default function DeployPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDeployments() {
      try {
        const res = await fetch("/api/deployments");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setDeployments(data);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch");
      } finally {
        setLoading(false);
      }
    }
    fetchDeployments();
  }, []);

  return (
    <div className="px-6 py-5 space-y-5 max-w-6xl">
      <h1 className="text-lg font-semibold text-foreground">Deployment Health</h1>

      {loading ? (
        <p className="text-[12px] text-muted-foreground">Querying Vercel CLI...</p>
      ) : error ? (
        <div className="bg-surface border border-border-subtle rounded-xl px-4 py-8 text-center">
          <p className="text-[13px] text-muted">Deployment data unavailable</p>
          <p className="text-[12px] text-muted-foreground mt-1">
            Ensure <code className="bg-background px-1.5 py-0.5 rounded">vercel</code> CLI is authenticated.
            Run <code className="bg-background px-1.5 py-0.5 rounded">vercel login</code> to connect.
          </p>
        </div>
      ) : deployments.length === 0 ? (
        <div className="bg-surface border border-border-subtle rounded-xl px-4 py-8 text-center">
          <p className="text-[13px] text-muted">No deployments found</p>
          <p className="text-[12px] text-muted-foreground mt-1">
            Deploy a startup with <code className="bg-background px-1.5 py-0.5 rounded">vercel --prod</code> to see deployment data here.
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Project</th>
                <th className="px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">URL</th>
                <th className="px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">State</th>
                <th className="px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody>
              {deployments.map((d, i) => (
                <tr key={i} className="border-b border-border-subtle last:border-0 hover:bg-surface-hover/50 transition-colors">
                  <td className="px-4 py-3 text-[13px] font-medium text-foreground">{d.name}</td>
                  <td className="px-4 py-3">
                    {d.url ? (
                      <a
                        href={`https://${d.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] text-muted hover:text-foreground transition-colors font-mono"
                      >
                        {d.url}
                      </a>
                    ) : (
                      <span className="text-[12px] text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[12px] font-medium ${
                      d.state === "READY" ? "text-emerald-600" :
                      d.state === "ERROR" ? "text-red-500" : "text-muted"
                    }`}>
                      {d.state}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground">
                    {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
