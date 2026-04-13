# readme-generator

**Status:** 🔴 Not started
**Agent:** coding
**Category:** coding
**Created:** 2026-04-13

## Description

Auto-generate a README.md for the startup repository. Includes what the product does, how to set up the dev environment, how to contribute, the tech stack, and an architecture overview. Updated automatically when features or stack change.

## Checklist

- [ ] Generate README.md from product spec and .harness/stacks.yml
- [ ] "What it does" section — plain-language product description
- [ ] "Tech stack" section — list all major dependencies and services
- [ ] "Getting started" section — step-by-step local dev setup
- [ ] "Architecture overview" section — high-level system diagram or description
- [ ] "Contributing" section — how agents and humans contribute
- [ ] "Project structure" section — key directories explained
- [ ] Badges — build status, deploy status, test coverage
- [ ] README regenerated when features are added or stack changes
- [ ] No stale information — validated against actual project state
- [ ] Links to documentation site (if documentation-generator feature is active)

## Notes

- The README is the first thing anyone sees — keep it clear and concise
- Architecture overview can reference a Mermaid diagram in the repo
- Regeneration should be triggered by hooks or as part of the CI pipeline
