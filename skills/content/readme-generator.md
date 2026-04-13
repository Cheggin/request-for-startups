---
name: readme-generator
description: Auto-generate a README.md with product overview, tech stack, setup instructions, and architecture
category: content
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

## Purpose

Auto-generate a README.md for the startup repository that stays in sync with the project state. The README includes what the product does, the tech stack, how to set up the dev environment, an architecture overview, and how to contribute. It is regenerated when features or the stack change.

## Steps

1. Read the product spec to extract a plain-language description of what the product does.
2. Read project configuration files (package.json, stacks.yml, etc.) to list the tech stack and major dependencies.
3. Generate a "Getting started" section with step-by-step local dev setup instructions derived from the actual project setup process.
4. Create an architecture overview section describing the high-level system design.
5. Add a project structure section explaining key directories and their purpose.
6. Add a contributing section summarizing how agents and humans contribute (linking to CONTRIBUTING.md if it exists).
7. Generate badges for build status, deploy status, and test coverage.
8. Link to the documentation site if the documentation-generator skill is active.
9. Validate that the README contains no stale information by checking against the actual project state.
10. Configure regeneration so the README updates when features are added or the stack changes.

## Examples

Good:
- "Product description in two sentences explaining what the app does and who it is for."
- "Tech stack section listing Next.js 15, Convex, Tailwind CSS 4, and Clerk with links to each."
- "Getting started section with numbered steps: clone, install, configure env, run dev server."

Bad:
- "README with only a project title and no description or setup instructions."
- "Tech stack section listing 'React' without specifying the framework version or related tools."
- "Setup instructions that reference a script that no longer exists in the repo."

## Checklist

- [ ] Product description section in plain language
- [ ] Tech stack section listing all major dependencies and services
- [ ] Getting started section with step-by-step local dev setup
- [ ] Architecture overview section with high-level system description
- [ ] Project structure section explaining key directories
- [ ] Contributing section with link to CONTRIBUTING.md
- [ ] Badges for build status, deploy status, and test coverage
- [ ] README regenerated when features are added or stack changes
- [ ] No stale information validated against actual project state
- [ ] Links to documentation site if documentation-generator is active
