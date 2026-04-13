# contributing-guide

**Status:** 🔴 Not started
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

Auto-generate CONTRIBUTING.md for the startup repo. Covers how to set up the dev environment, coding standards, PR process, Cubic review process, and how agents work on the codebase.

## Checklist

- [ ] Dev environment setup — step-by-step instructions for cloning, installing, and running locally
- [ ] Prerequisites section — list required tools (Node.js, pnpm/yarn, Convex CLI, etc.)
- [ ] Coding standards — formatting rules, naming conventions, file structure guidelines
- [ ] PR process — how to create a PR, what to include in the description, review expectations
- [ ] Cubic review process — how AI-assisted code review works, what reviewers look for
- [ ] Agent workflow explanation — how agents modify the codebase, what fileScopes mean
- [ ] Feature checklist process — how features are tracked, how to update checklists
- [ ] Branch naming conventions — format for feature, fix, and chore branches
- [ ] Commit message format — conventional commits or project-specific format
- [ ] Testing requirements — what tests to write, how to run them, coverage expectations
- [ ] Auto-generation — CONTRIBUTING.md generated from project config, not manually written
- [ ] Template system — base template with project-specific values injected
- [ ] Regeneration on config change — update CONTRIBUTING.md when project config changes
- [ ] Unit tests for template rendering and config injection

## Notes

- The CONTRIBUTING.md should be useful for both human contributors and agents
- Auto-generation ensures the guide stays in sync with actual project configuration
- The Cubic review section is unique to harness-built projects — explain how it works clearly
- Agent workflow section helps human contributors understand why certain patterns exist
- Keep it concise — a 20-page contributing guide that nobody reads is worse than a 2-page one
