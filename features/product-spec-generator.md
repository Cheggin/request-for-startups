# product-spec-generator

**Status:** 🔴 Not started
**Agent:** planner
**Category:** operations
**Created:** 2026-04-13

## Description

Planner agent takes the research report + startup idea and generates a comprehensive product spec. The spec defines pages, features, data models, API routes, and user flows. Each feature gets testable acceptance criteria. The product spec is the single source of truth that drives all downstream work — design, test generation, implementation, and QA.

## Checklist

- [ ] Research report parser — ingest research-report.md and extract competitive insights
- [ ] Startup idea parser — accept idea description, target audience, and value proposition
- [ ] Page inventory — list every page the product needs with purpose and priority
- [ ] Feature definitions — each feature has a name, description, user story, and acceptance criteria
- [ ] Data model definitions — entities, fields, types, relationships, constraints
- [ ] API route definitions — endpoint, method, input schema, output schema, auth requirements
- [ ] User flow definitions — step-by-step flows for core journeys (signup, onboarding, main action)
- [ ] Acceptance criteria format — Given/When/Then or equivalent testable format
- [ ] Priority assignment — P0 (MVP), P1 (launch), P2 (post-launch) for every feature
- [ ] Dependency mapping — which features depend on which other features
- [ ] product-spec.md output — single structured markdown file with all sections
- [ ] Spec validation — check for orphan pages (no features), orphan models (no routes), missing acceptance criteria
- [ ] GitHub Issue creation — post spec summary as an issue for review
- [ ] Spec diffing — if spec is regenerated, show what changed

## Notes

- The product spec is the contract between planning and execution — ambiguity here causes downstream failures
- Acceptance criteria must be specific enough to generate tests from — "works correctly" is not acceptable
- Data models should map directly to Convex schema — use Convex-compatible types
- API routes should map directly to Next.js API routes or Convex functions
- User flows should be concrete enough to generate Playwright e2e tests
- P0 features define the MVP — the harness builds P0 first, then P1, then P2
