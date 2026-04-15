---
name: gap-analysis
description: Compare a built product against a reference product. Count pages, features, tests, code depth. Output a scored report with specific gaps and a prioritized action plan.
version: 1.0.0
user-invocable: true
argument-hint: "[built product path] [reference product path]"
---

Compare a built product against a reference product to find what's missing, what's shallow, and what's ready. This is a structural audit, not a design critique — it measures completeness and depth by counting real artifacts.

## Arguments

Two arguments required:

1. **Built product path** — the product under review (your code)
2. **Reference product path** — the product to compare against (the benchmark)

If either path is missing, ask the user.

## Phase 1: Inventory Both Products

Scan both codebases and build a structural inventory. Do not skim — count everything.

### 1.1 Pages & Routes

Enumerate every user-facing route in both products.

- **For Next.js / React**: scan `app/` or `pages/` directories for route segments
- **For CLI tools**: scan command definitions and subcommands
- **For APIs**: scan route handlers, endpoint definitions
- **General**: look for router configs, navigation menus, sitemap files

Record for each route:
- Route path
- Whether it has real content or is a stub/placeholder
- Whether it has error handling (error boundary, 404, loading state)

### 1.2 Features & Functionality

Identify discrete features in both products. A "feature" is a user-facing capability, not a file.

**Discovery method** (run all):
- Read README, docs, and any product spec files
- Scan component directories for feature-sized modules
- Check for integrations (auth, payments, analytics, email, etc.)
- Look at package.json / go.mod dependencies for capability signals
- Check for background jobs, cron, webhooks, real-time features

Record for each feature:
- Feature name
- Implementation status: **complete** (working, tested), **partial** (exists but gaps), **stub** (placeholder/TODO), **missing** (not present)
- Depth rating 1-3: 1=surface (happy path only), 2=solid (handles errors, edge cases), 3=production (tested, monitored, documented)

### 1.3 Test Coverage

Count and categorize tests in both products.

| Metric | Built | Reference |
|--------|-------|-----------|
| Unit test files | ? | ? |
| Integration test files | ? | ? |
| E2E test files | ? | ? |
| Total test assertions (approx) | ? | ? |
| Test config present | ? | ? |
| CI test pipeline | ? | ? |

### 1.4 Code Depth Indicators

Measure implementation maturity signals:

- **Error handling**: try/catch density, error boundaries, custom error types, error reporting
- **Logging**: structured logging, log levels, request tracing
- **Validation**: input validation, schema validation (zod, joi, etc.), type safety
- **Auth & security**: authentication, authorization, CSRF, rate limiting, input sanitization
- **Database**: migrations, seeds, indexes, connection pooling
- **Observability**: health checks, metrics, monitoring hooks
- **Configuration**: env var management, feature flags, per-environment config
- **Documentation**: inline docs, API docs, README completeness, architecture docs

### 1.5 Infrastructure & DevEx

Compare developer experience and deployment maturity:

| Signal | Built | Reference |
|--------|-------|-----------|
| Package manager lockfile | ? | ? |
| Linting configured | ? | ? |
| Formatting configured | ? | ? |
| Pre-commit hooks | ? | ? |
| CI/CD pipeline | ? | ? |
| Docker / containerization | ? | ? |
| Environment examples (.env.example) | ? | ? |
| Contributing guide | ? | ? |
| Changelog | ? | ? |

## Phase 2: Gap Identification

For every item present in the reference but missing or shallow in the built product, create a gap entry.

### Gap Entry Format

```
**[G-##] Gap name**
- Category: Pages | Features | Tests | Code Depth | Infrastructure
- Severity: P0 (blocking) | P1 (major) | P2 (minor) | P3 (polish)
- Reference: [where this exists in the reference product]
- Built status: missing | stub | partial
- Effort estimate: S (hours) | M (days) | L (weeks)
- Impact: [why this matters — user-facing or structural]
```

### Severity Assignment

- **P0 Blocking** — Core functionality missing. Product cannot serve its primary use case without this.
- **P1 Major** — Important capability absent. Users will hit this gap in normal usage.
- **P2 Minor** — Nice-to-have feature or depth. Users can work around it.
- **P3 Polish** — Refinement the reference has that elevates quality but isn't functionally required.

## Phase 3: Scoring

### Dimension Scores (0-4 each)

Score each dimension by comparing built vs reference:

| Score | Meaning |
|-------|---------|
| 0 | Not started — no meaningful implementation |
| 1 | Skeletal — basic structure exists, mostly stubs |
| 2 | Partial — some working features, significant gaps |
| 3 | Substantial — most features present, lacks depth |
| 4 | Parity — matches or exceeds reference in this dimension |

### Completeness Score

| # | Dimension | Score | Built Count | Reference Count | Parity % |
|---|-----------|-------|-------------|-----------------|----------|
| 1 | Pages / Routes | ? | ? | ? | ?% |
| 2 | Features | ? | ? | ? | ?% |
| 3 | Tests | ? | ? | ? | ?% |
| 4 | Code Depth | ? | ? | ? | ?% |
| 5 | Infrastructure | ? | ? | ? | ?% |
| **Total** | | **??/20** | | | **?%** |

**Rating bands**: 18-20 Parity (ready to ship), 14-17 Substantial (close, focused work needed), 10-13 Partial (significant gaps), 6-9 Early (major build-out required), 0-5 Skeletal (starting point only)

### Feature Parity Matrix

Create a side-by-side matrix of the top features:

| Feature | Reference | Built | Status | Gap ID |
|---------|-----------|-------|--------|--------|
| [name] | [depth 1-3] | [depth 0-3] | complete/partial/stub/missing | G-## |

## Phase 4: Report

### Executive Summary

```
Gap Analysis: [built product] vs [reference product]
Completeness Score: ??/20 ([rating band])
Total gaps found: ?? (P0: ?, P1: ?, P2: ?, P3: ?)
Parity estimate: ??% overall

Top 3 critical gaps:
1. [G-##] ...
2. [G-##] ...
3. [G-##] ...
```

### Detailed Gap List

List all gaps grouped by category, ordered by severity within each group.

### What's Already Strong

List areas where the built product matches or exceeds the reference. These are strengths to protect.

### Recommended Build Order

Prioritize gaps into a build sequence. Order by:
1. P0 gaps first (blocking)
2. P1 gaps that unblock other work
3. Clusters of related gaps that can be addressed together
4. Quick wins (high impact, low effort)

For each recommended action, suggest which skill to use:
- `/startup-harness:website-creation` — for missing pages
- `/startup-harness:test-generator` — for test gaps
- `/startup-harness:security-scanner` — for auth/security gaps
- `/startup-harness:deploy-pipeline` — for CI/CD gaps
- `/startup-harness:documentation-generator` — for docs gaps
- `/startup-harness:debug` — for error handling gaps
- `/startup-harness:optimize` — for performance gaps

### Effort Estimate

| Priority | Gap Count | Estimated Effort |
|----------|-----------|-----------------|
| P0 | ? | ? |
| P1 | ? | ? |
| P2 | ? | ? |
| P3 | ? | ? |
| **Total** | **?** | **?** |

After presenting the report, tell the user:

> Run the recommended skills in build order to close gaps systematically.
> Re-run `/gap-analysis` after each pass to track progress toward parity.

## Rules

**DO**:
- Count real artifacts — files, routes, test cases, error handlers
- Compare like-for-like (don't penalize a CLI for lacking pages)
- Note where the built product does something the reference doesn't
- Be specific about what's missing — file paths, feature names, not vague categories

**NEVER**:
- Inflate gap counts with trivial differences (variable naming, code style)
- Compare UI aesthetics — this is structural, not visual
- Penalize intentional scope differences (if the built product explicitly excludes something, note it but don't score it as a gap)
- Generate fake counts — if you can't count it precisely, say "approximately" with your methodology
- Skip the reference scan — always inventory both products fully before comparing
