# onboarding-skill

**Status:** 🟡 In progress
**Agent:** onboarding-dev
**Category:** coding
**Created:** 2026-04-13

## Description

The `/startup-init` Claude Code skill that orchestrates the full onboarding flow: service connections, idea intake, research, spec, design, scaffold, TDD, implementation, deploy.

## Checklist

- [x] SKILL.md created at .claude/skills/startup-init/
- [x] Step 0: Service connection wizard (GitHub, Vercel, Railway, Convex, Cubic, Slack, Figma)
- [x] Step 0: Webhook secret generation + storage
- [x] Step 0: Slack destination config (DM/channel/group)
- [ ] Step 1: Intake (ask for startup idea)
- [ ] Step 2: Research (web search competitors, market analysis)
- [ ] Step 3: Spec generation (product spec with features + acceptance criteria)
- [ ] Step 4: Design (Figma MCP design generation)
- [ ] Step 5: Scaffold (init repo with stacks.yml, set up Cubic pipeline)
- [ ] Step 6: TDD (write tests first for each feature)
- [ ] Step 7: Implementation loop (build → test → Cubic → visual QA → ship)
- [ ] Step 8: Deploy (Vercel + Railway)
- [ ] Investor update templates for each milestone
- [ ] Agent category awareness (coding vs content vs growth)

## Notes

- Step 0 tested live — validated real connections to all services
- Cubic removed API key requirement — fully automated via GitHub App
- Skill references .harness/agent-categories.yml for ground truth rules
