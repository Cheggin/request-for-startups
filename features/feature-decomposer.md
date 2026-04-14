# feature-decomposer

**Status:** 🟡 In progress
**Agent:** planner
**Category:** operations
**Created:** 2026-04-13

## Description

Takes the product spec and breaks it into individual features. Each feature becomes a GitHub Issue with acceptance criteria. Features are ordered by dependency so the build system knows what to implement first. Each feature gets a features/*.md checklist file. This is the bridge between the spec and implementation — without it, the coding agents have no work items.

## Checklist

- [ ] Product spec parser — ingest product-spec.md and extract feature definitions
- [ ] Feature isolation — split compound features into atomic, independently shippable units
- [ ] Dependency ordering — topological sort of features based on dependency mapping
- [ ] GitHub Issue creation — one issue per feature with title, description, acceptance criteria, labels
- [ ] Issue labeling — priority (P0/P1/P2), category (frontend/backend/fullstack), size (S/M/L)
- [ ] Feature checklist generation — create features/*.md for each feature with checklist items
- [ ] Checklist item granularity — each item is a single, verifiable task (not "build the thing")
- [ ] Cross-feature linking — issues reference their dependencies and dependents
- [ ] Milestone assignment — group features into milestones (MVP, Launch, Post-launch)
- [ ] Feature file naming convention — kebab-case matching the GitHub Issue title
- [ ] Idempotency — re-running the decomposer updates existing issues/files, doesn't create duplicates
- [ ] Validation — every spec feature maps to at least one issue, no orphan issues

## Notes

- Atomic features are key — a feature should be implementable in a single agent session
- If a feature touches both frontend and backend, it still gets one issue but the checklist has items for both
- Dependency ordering prevents the coding agent from trying to build a feature before its dependencies exist
- The feature checklist files are what agents actually work from — issues are for tracking and visibility
- Decomposer should err on the side of smaller features — easier to parallelize and verify
- This step must complete before any coding, design, or test generation begins
