"use client";

import { useState, useRef, useEffect } from "react";
import { useStartups } from "@/lib/use-data";
import type { RealStartup } from "@/lib/data";

const TYPE_BADGES: Record<string, string> = {
  b2c: "B2C",
  "b2b-saas": "B2B",
  devtool: "Dev",
  marketplace: "Mkt",
  fintech: "Fin",
  healthcare: "HC",
  ecommerce: "EC",
  "test-run": "Test",
};

export function StartupSwitcher() {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const { startups, loading } = useStartups();

  const selected = startups.find((s) => s.id === selectedId) || startups[0] || null;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (loading) {
    return (
      <div className="px-3 py-1.5 text-[13px] text-muted-foreground">
        Loading startups...
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="px-3 py-1.5 text-[13px] text-muted-foreground">
        No startups found
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-border hover:border-muted-foreground/30 transition-colors bg-surface"
      >
        <span className="w-2 h-2 rounded-full bg-success shrink-0" />
        <span className="text-[13px] font-medium text-foreground">
          {selected.name}
        </span>
        <span className="text-[10px] font-medium text-muted-foreground bg-background px-1.5 py-0.5 rounded">
          {TYPE_BADGES[selected.type] || selected.type}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6,9 12,15 18,9" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-64 bg-surface border border-border rounded-xl shadow-lg shadow-black/5 py-1.5 z-50">
          {startups.map((startup) => (
            <button
              key={startup.id}
              onClick={() => {
                setSelectedId(startup.id);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-hover transition-colors ${
                selected.id === startup.id ? "bg-surface-hover" : ""
              }`}
            >
              <span className="w-2 h-2 rounded-full shrink-0 bg-success" />
              <div className="flex-1 text-left">
                <div className="text-[13px] font-medium text-foreground">
                  {startup.name}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {startup.idea}
                </div>
              </div>
              <span className="text-[10px] font-medium text-muted-foreground bg-background px-1.5 py-0.5 rounded">
                {TYPE_BADGES[startup.type] || startup.type}
              </span>
            </button>
          ))}
          <div className="border-t border-border-subtle mt-1.5 pt-1.5">
            <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-surface-hover transition-colors text-muted text-[13px]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New startup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
