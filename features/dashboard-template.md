# dashboard-template

**Status:** 🔴 Not started
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

User dashboard template for harness-built startups: sidebar navigation, data tables, charts, and settings page. Built with the canonical stack (Next.js + Convex). Responsive and dark mode supported. Reusable across any startup that needs a dashboard.

## Checklist

- [ ] Sidebar navigation — collapsible, icon + label, active state, mobile hamburger menu
- [ ] Dashboard layout — sidebar + main content area with header
- [ ] Data tables — sortable, filterable, paginated with Convex real-time queries
- [ ] Charts — line, bar, pie charts using a lightweight charting library
- [ ] Settings page — user profile, preferences, notification settings
- [ ] Responsive design — sidebar collapses to bottom nav or hamburger on mobile
- [ ] Dark mode — system preference detection + manual toggle, persisted in user settings
- [ ] Loading states — skeleton screens for tables and charts during data fetch
- [ ] Empty states — helpful messages when no data is available
- [ ] Breadcrumb navigation — show current location in the dashboard hierarchy
- [ ] Convex real-time integration — tables and charts update live without refresh
- [ ] Reusable component library — export dashboard components for use across pages
- [ ] Unit tests for navigation, responsive behavior, and data rendering

## Notes

- Built with the canonical stack: Next.js (App Router) + Convex + Tailwind
- Dark mode uses CSS variables for theming, not conditional class names
- Charts should use a lightweight library — avoid heavy dependencies like D3 unless needed
- The dashboard template assumes auth-flow-template is enabled for protected routes
- Sidebar nav items are configurable per project via a config file
