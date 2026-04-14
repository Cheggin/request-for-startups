"use client";

import Link from "next/link";
import { useState } from "react";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      data-testid="header"
      className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground"
          data-testid="logo"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            aria-hidden="true"
          >
            <rect width="28" height="28" rx="6" fill="#6366f1" />
            <path
              d="M8 14l4 4 8-8"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Convertify
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex" data-testid="desktop-nav">
          <Link
            href="/"
            className="text-sm font-medium text-muted hover:text-foreground"
          >
            Converter
          </Link>
          <Link
            href="/blog"
            className="text-sm font-medium text-muted hover:text-foreground"
          >
            Blog
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-medium text-muted hover:text-foreground"
          >
            Pricing
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-surface md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          data-testid="mobile-menu-toggle"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            {mobileOpen ? (
              <>
                <line x1="4" y1="4" x2="16" y2="16" />
                <line x1="16" y1="4" x2="4" y2="16" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="17" y2="6" />
                <line x1="3" y1="10" x2="17" y2="10" />
                <line x1="3" y1="14" x2="17" y2="14" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav
          className="border-t border-border bg-white px-4 py-3 md:hidden"
          data-testid="mobile-nav"
        >
          <Link
            href="/"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-surface hover:text-foreground"
            onClick={() => setMobileOpen(false)}
          >
            Converter
          </Link>
          <Link
            href="/blog"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-surface hover:text-foreground"
            onClick={() => setMobileOpen(false)}
          >
            Blog
          </Link>
          <Link
            href="/pricing"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-surface hover:text-foreground"
            onClick={() => setMobileOpen(false)}
          >
            Pricing
          </Link>
        </nav>
      )}
    </header>
  );
}
