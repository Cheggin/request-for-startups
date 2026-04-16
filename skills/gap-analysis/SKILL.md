---
name: gap-analysis
description: Compare a harness-built product against a reference product in the same category. Scores feature count, code depth, test coverage, page count, and UX complexity. Use after building a product to identify what's missing vs production-grade open source.
user-invocable: true
argument-hint: "<built-product-path> [--category saas|cli|chrome-extension]"
group: quality
prerequisites: []
next: [self-improve, plan]
workflows: [continuous-improvement]
---

# Gap Analysis

Compare a harness-built product against a real open-source reference product to identify gaps in feature depth, test coverage, and code quality.

## Inputs

1. **Built product path** — the directory of the harness-built product (e.g., `test-runs/level-5-image-converter/project`)
2. **Category** (optional) — `saas`, `cli`, or `chrome-extension`. Auto-detected from `.harness/founder-profile.yml` if present.

## Reference Library

References are defined in `.harness/product-references.yml` and cloned to `reference/products/`. Each category has 1-2 production-grade open-source products as ground truth.

## Analysis Process

### Step 1: Identify Category and Reference

1. Read the built product's `.harness/founder-profile.yml` or `--category` flag
2. Look up matching references in `.harness/product-references.yml`
3. If multiple references exist for the category, use the closest match by stack

### Step 2: Measure Both Products

Run these measurements on both the built product and the reference product:

**Feature Count**
- Count unique routes/pages (Next.js: `app/**/page.tsx`, `pages/**/*.tsx`)
- Count API endpoints (`app/api/**/route.ts`, `pages/api/**`)
- Count database models/tables (Convex schemas, Prisma models, SQL migrations)
- Count integration points (webhooks, OAuth, external API calls)

**Code Depth**
- Total lines of source code (exclude `node_modules`, `.git`, lockfiles)
- Number of source files
- Average file size
- Directory depth (max nesting level)

**Test Coverage**
- Count test files (`**/*.test.*`, `**/*.spec.*`, `**/test/**`, `**/__tests__/**`)
- Count test assertions (`expect(`, `assert(`, `it(`, `test(`)
- Ratio: test files / source files

**Page Count** (web apps only)
- Count rendered pages/routes
- Count unique layouts
- Count client components vs server components

**UX Complexity** (web apps only)
- Count form inputs across all pages
- Count interactive components (modals, dropdowns, tabs, accordions)
- Count distinct user flows (auth, CRUD, settings, billing)

### Step 3: Score the Gap

For each metric, compute:
```
gap_percent = ((reference_value - built_value) / reference_value) * 100
```

Produce a scored report:

| Metric | Built | Reference | Gap |
|--------|-------|-----------|-----|
| Routes/Pages | ? | ? | ?% |
| API Endpoints | ? | ? | ?% |
| Test Files | ? | ? | ?% |
| Source Files | ? | ? | ?% |
| Lines of Code | ? | ? | ?% |

**Overall gap score**: weighted average (feature count 30%, test coverage 25%, code depth 20%, page count 15%, UX complexity 10%)

### Step 4: Identify Specific Gaps

List the top 5 specific features/patterns present in the reference but missing in the built product:

1. What the reference has that the built product lacks
2. Why it matters for production readiness
3. Estimated effort to close the gap (S/M/L)

### Step 5: Generate Improvement Targets

Output a structured list of improvement targets that can feed into `/plan` or `/self-improve`:

```yaml
targets:
  - area: test-coverage
    current: 12 test files
    reference: 847 test files
    gap: 98%
    priority: P0
    action: "Generate tests for all routes and API endpoints"
  - area: feature-count
    current: 9 pages
    reference: 45 pages
    gap: 80%
    priority: P1
    action: "Add missing CRUD pages, settings, billing"
```

## Output

Save the report to `.harness/gap-analysis-{timestamp}.yml` in the built product's directory.

Print a summary to the terminal showing:
- Overall gap score (0-100, where 0 = identical to reference)
- Top 3 gaps by severity
- Recommended next skill to run

## Rules

- Never mock measurements — count real files. If a metric can't be measured, report "N/A" with explanation.
- Compare against the closest reference by stack. Don't compare a CLI tool to a SaaS app.
- Gap scores above 90% are expected for MVP products — the point is to show what "production" looks like, not to shame the build.
- Focus on actionable gaps. "Reference has 10x more code" is not useful. "Reference has billing, auth, team management — built product has none" is useful.
