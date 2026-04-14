"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Surveys", href: "/dashboard/surveys" },
  { label: "Trends", href: "/dashboard/trends" },
  { label: "Team", href: "/dashboard/team" },
] as const;

const NAV_ICONS: Record<string, React.ReactNode> = {
  Dashboard: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.8" />
      <rect x="11" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.8" />
      <rect x="1" y="11" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.8" />
      <rect x="11" y="11" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.8" />
    </svg>
  ),
  Surveys: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <line x1="5" y1="6" x2="13" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="5" y1="9" x2="11" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="5" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Trends: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <polyline points="2,13 6,9 9,11 13,6 16,8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="2" y1="16" x2="16" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Team: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1 15c0-2.76 2.46-5 5.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12.5" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M17 15c0-2.76-2.46-5-5.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/surveys": "Surveys",
  "/dashboard/trends": "Trends",
  "/dashboard/team": "Team",
};

function isActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageTitle = PAGE_TITLES[pathname] ?? "Dashboard";

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar — desktop only */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-sidebar-bg border-r border-sidebar-border">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-sidebar-border">
          <span className="text-lg font-semibold tracking-tight text-primary">PulseCheck</span>
          <p className="text-xs text-muted-foreground mt-0.5">Engineering Team</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Main navigation">
          {NAV_LINKS.map(({ label, href }) => {
            const active = isActive(href, pathname);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/70 hover:bg-sidebar-border hover:text-foreground",
                ].join(" ")}
                aria-current={active ? "page" : undefined}
              >
                {NAV_ICONS[label]}
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-primary">AC</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Alex Chen</p>
              <p className="text-xs text-muted-foreground truncate">alex@company.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="shrink-0 h-14 flex items-center px-6 border-b border-border bg-background">
          <h1 className="text-base font-semibold text-foreground">{pageTitle}</h1>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          {children}
        </main>
      </div>

      {/* Bottom nav — mobile only */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-background border-t border-border flex items-center z-20"
        aria-label="Mobile navigation"
      >
        {NAV_LINKS.map(({ label, href }) => {
          const active = isActive(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex flex-col items-center justify-center flex-1 gap-1 text-[11px] font-medium transition-colors py-1",
                active ? "text-primary" : "text-muted-foreground",
              ].join(" ")}
              aria-current={active ? "page" : undefined}
            >
              <span className={active ? "text-primary" : "text-muted-foreground"}>
                {NAV_ICONS[label]}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
