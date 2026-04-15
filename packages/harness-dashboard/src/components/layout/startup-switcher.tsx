"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useStartups } from "@/lib/use-data";

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

  const handleClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) handleClose();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [handleClose]);

  if (loading) {
    return (
      <div className="px-3 py-1.5 text-base text-text-tertiary">
        Loading startups...
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="px-3 py-1.5 text-base text-text-tertiary">
        No startups found
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-md border border-border hover:border-text-tertiary transition-colors bg-surface"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-positive shrink-0" />
        <span className="text-base font-medium text-text-primary">
          {selected.name}
        </span>
        <span className="text-xs font-medium text-text-tertiary bg-bg px-1.5 py-0.5 rounded">
          {TYPE_BADGES[selected.type] || selected.type}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-text-tertiary transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <polyline points="6,9 12,15 18,9" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select startup"
          className="absolute top-full left-0 mt-1 w-64 bg-surface border border-border rounded-md shadow-lg shadow-black/5 py-1 z-50"
        >
          {startups.map((startup) => (
            <button
              key={startup.id}
              role="option"
              aria-selected={selected.id === startup.id}
              onClick={() => {
                setSelectedId(startup.id);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-surface-hover transition-colors ${
                selected.id === startup.id ? "bg-surface-hover" : ""
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-positive" />
              <div className="flex-1 text-left min-w-0">
                <div className="text-base font-medium text-text-primary">
                  {startup.name}
                </div>
                <div className="text-xs text-text-tertiary truncate">
                  {startup.idea}
                </div>
              </div>
              <span className="text-xs font-medium text-text-tertiary bg-bg px-1.5 py-0.5 rounded shrink-0">
                {TYPE_BADGES[startup.type] || startup.type}
              </span>
            </button>
          ))}
          <div className="border-t border-border-subtle mt-1 pt-1">
            <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-surface-hover transition-colors text-text-secondary text-base">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
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
