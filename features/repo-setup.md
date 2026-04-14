# repo-setup

**Status:** 🟢 Complete
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

Automated repository setup that creates a fully configured dev environment for every startup the harness builds. Separate from user onboarding — this is infrastructure, not human interaction. Every repo gets the same foundation.

## What gets created

Every harness-created repo includes:
- Taskfile.yml with standard tasks (dev, test, build, deploy, feature management)
- features/ directory for checklist-driven development
- .harness/ directory (stacks.yml, agent-categories.yml, agents/*.json)
- .claude/ directory (skills, settings with hooks)
- .mcp.json (cubic-channel + any agent-specific MCP servers)
- .github/workflows/ (CI/CD)
- .gitignore (secrets, node_modules, build outputs)
- Convex project initialized
- Vercel project linked
- Railway project linked
- Cubic GitHub App confirmed

## Checklist

- [ ] Repo setup script/skill that runs after user onboarding
- [ ] Taskfile.yml template (generated per-project with correct paths)
- [ ] features/ directory with initial feature checklists from spec
- [ ] .harness/ directory with stacks.yml, agent-categories.yml, agent configs
- [ ] .claude/settings.json with hooks (GateGuard, config protection, budget)
- [ ] .mcp.json with cubic-channel registered
- [ ] .github/workflows/ci.yml (lint, typecheck, test on PR)
- [ ] .gitignore template
- [ ] Convex project init + deploy
- [ ] Vercel project link
- [ ] Railway project link
- [ ] GitHub webhook configured for Cubic channel
- [ ] Validation — run `task test` to confirm everything works
- [ ] README.md generated with project-specific setup instructions

## Notes

- This is Step 1 in the new flow (after Step 0: User Onboarding)
- The Taskfile is the entry point for all development — agents use `task` commands
- Feature checklists are generated from the product spec (Step 3)
- Every agent session should be able to run `task feature:list` to see what needs doing
