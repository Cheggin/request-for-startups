---
name: contributing-guide
description: Auto-generate a CONTRIBUTING.md covering dev setup, coding standards, and PR process
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

Auto-generate a CONTRIBUTING.md for the startup repository. The guide covers dev environment setup, coding standards, PR process, and how agents interact with the codebase. It is generated from project configuration so it stays in sync with the actual project state.

## Steps

1. Read the project configuration files (package.json, tsconfig, linter configs, etc.) to determine the tech stack, required tools, and coding standards.
2. Identify prerequisites (Node.js version, package manager, CLI tools, environment variables).
3. Generate a step-by-step dev environment setup section from the actual project setup process.
4. Document coding standards by reading linter and formatter configurations.
5. Define the PR process including branch naming conventions, commit message format, and review expectations.
6. Document the agent workflow explaining how automated agents modify the codebase.
7. Write the CONTRIBUTING.md using a template system with project-specific values injected.
8. Validate that the generated guide matches the current project state (no stale references).
9. Set up regeneration hooks so CONTRIBUTING.md updates when project config changes.

## Examples

Good:
- "Prerequisites section lists Node.js >= 20, pnpm 9.x, and the Convex CLI with install commands for each."
- "PR process section specifies branch format as 'feat/short-description' and requires conventional commit messages."
- "Dev setup section includes 'pnpm install && pnpm dev' with expected output described."

Bad:
- "Setup section says 'install dependencies' without specifying the package manager or command."
- "Contributing guide manually written and already outdated compared to the actual project config."
- "No mention of how agents interact with the codebase, confusing human contributors."

## Checklist

- [ ] Prerequisites section listing all required tools with version requirements
- [ ] Step-by-step dev environment setup instructions
- [ ] Coding standards derived from linter and formatter configs
- [ ] PR process with branch naming, commit format, and review expectations
- [ ] Agent workflow explanation for how automated agents modify the codebase
- [ ] Commit message format documented (conventional commits or project-specific)
- [ ] Testing requirements with commands to run tests and coverage expectations
- [ ] CONTRIBUTING.md generated from project config, not manually written
- [ ] Template system with project-specific values injected
- [ ] Regeneration triggered when project configuration changes
