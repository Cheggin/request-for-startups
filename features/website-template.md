# website-template

**Status:** 🟡 In progress
**Agent:** website-dev
**Category:** coding
**Created:** 2026-04-13

## Description

Canonical Next.js website scaffold that the harness copies for every new startup. Includes all stack dependencies pre-configured.

## Checklist

- [x] Next.js 15 with App Router
- [x] Turbopack configured
- [x] TanStack Query provider wired
- [x] Zustand store scaffold
- [x] Tailwind CSS v4 configured
- [x] Convex schema + provider scaffold
- [x] Vitest configured
- [x] Playwright e2e configured
- [x] Build compiles with 0 errors
- [x] No Inter font, no sparkles, no !important
- [ ] Add common component stubs (Button, Input, Card)
- [ ] Add dark mode support
- [ ] Add SEO defaults (metadata, sitemap, robots)

## Notes

- System-ui font stack used instead of Inter
- .env.local placeholder for Convex URL — harness replaces during scaffold
