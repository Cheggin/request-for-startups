"use client";

import { useState } from "react";

export function InstallCommand() {
  const [copied, setCopied] = useState(false);
  const command = "npm i -g json2ts";

  const copy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="inline-flex items-center gap-3 rounded-lg border border-border bg-code-bg px-4 py-2.5 font-mono text-sm text-code-fg">
      <span className="text-muted-foreground">$</span>
      <span>{command}</span>
      <button
        onClick={copy}
        className="ml-2 rounded p-1 text-muted-foreground transition-colors hover:text-code-fg"
        aria-label="Copy install command"
      >
        {copied ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 8.5l3 3 7-7" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="5" y="5" width="9" height="9" rx="1.5" />
            <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" />
          </svg>
        )}
      </button>
    </div>
  );
}
