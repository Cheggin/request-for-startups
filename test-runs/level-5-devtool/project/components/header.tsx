"use client";

import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/playground", label: "Playground" },
  { href: "/docs", label: "Docs" },
  { href: "/pricing", label: "Pricing" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-mono text-lg font-bold tracking-tight">
          <span className="text-accent">{"{ }"}</span>
          <span>json2ts</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://github.com/json2ts/json2ts"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            GitHub
          </a>
        </nav>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border md:hidden"
          aria-label="Toggle menu"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            {mobileOpen ? (
              <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
            ) : (
              <path d="M1 2.75A.75.75 0 011.75 2h12.5a.75.75 0 010 1.5H1.75A.75.75 0 011 2.75zm0 5A.75.75 0 011.75 7h12.5a.75.75 0 010 1.5H1.75A.75.75 0 011 7.75zm0 5a.75.75 0 011.75-.75h12.5a.75.75 0 010 1.5H1.75a.75.75 0 01-.75-.75z" />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <nav className="border-t border-border px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <a
              href="https://github.com/json2ts/json2ts"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              GitHub
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
