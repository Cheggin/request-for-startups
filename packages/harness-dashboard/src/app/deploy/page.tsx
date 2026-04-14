"use client";

import { useState, useEffect } from "react";

interface Deployment {
  name: string;
  url: string;
  state: string;
  createdAt: string;
}

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
    <div className="px-6 py-5 max-w-5xl">
      <h1 className="text-[18px] font-semibold text-text-primary leading-tight mb-6">Deployment Health</h1>

      {loading ? (
        <p className="text-[13px] text-text-tertiary">Querying Vercel CLI...</p>
      ) : error ? (
        <div className="border border-border-subtle rounded-md px-4 py-5">
          <p className="text-[13px] text-text-secondary">Deployment data unavailable.</p>
          <p className="text-[12px] text-text-tertiary mt-1">
            Ensure <code className="font-mono text-[12px] text-text-secondary bg-bg px-1 py-0.5 rounded">vercel</code> CLI is authenticated.
            Run <code className="font-mono text-[12px] text-text-secondary bg-bg px-1 py-0.5 rounded">vercel login</code> to connect.
          </p>
        </div>
      ) : deployments.length === 0 ? (
        <div className="border border-border-subtle rounded-md px-4 py-5">
          <p className="text-[13px] text-text-secondary">No deployments found.</p>
          <p className="text-[12px] text-text-tertiary mt-1">
            Deploy a startup with <code className="font-mono text-[12px] text-text-secondary bg-bg px-1 py-0.5 rounded">vercel --prod</code> to see deployment data here.
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
              {deployments.map((d, i) => (
                <tr key={i} className="border-b border-border-subtle last:border-0 hover:bg-surface-hover transition-colors">
                  <td className="px-4 py-2.5 text-[13px] font-medium text-text-primary">{d.name}</td>
                  <td className="px-4 py-2.5">
                    {d.url ? (
                      <a
                        href={`https://${d.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] text-text-secondary hover:text-text-primary transition-colors font-mono"
                      >
                        {d.url}
                      </a>
                    ) : (
                      <span className="text-[12px] text-text-tertiary">&mdash;</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[12px] font-medium ${
                      d.state === "READY" ? "text-positive" :
                      d.state === "ERROR" ? "text-negative" : "text-text-tertiary"
                    }`}>
                      {d.state}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-text-tertiary tabular">
                    {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "&mdash;"}
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
