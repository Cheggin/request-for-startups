# stack-extend

**Status:** 🟡 In progress
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

A skill that lets agents (or the user) add new tools to the stack at any time. When an agent needs PostHog, Sentry, Stripe, or any new integration, this skill handles: adding to stacks.yml, installing the dependency, configuring it, updating agent configs, and tracking it.

## Checklist

- [ ] Skill file at skills/shared/stack-extend.md
- [ ] Reads current .harness/stacks.yml
- [ ] Adds new tool entry with correct category (backend, frontend, analytics, payments, monitoring, etc.)
- [ ] Installs the npm/pip/etc dependency
- [ ] Generates config boilerplate (env vars, init code, provider setup)
- [ ] Updates .env with placeholder for required API keys
- [ ] Updates relevant agent configs in .harness/agents/*.json (add MCP server or allowed tool)
- [ ] Creates GitHub Issue tracking the integration
- [ ] Posts investor update about new tool added
- [ ] Validates the tool works (import check, health check)
- [ ] Supports removing tools (stack-reduce) as well
- [ ] Common tool catalog with known configs (PostHog, Sentry, Stripe, Resend, Clerk, etc.)

## Notes

- This makes the stack living, not static
- Any agent can invoke this skill when it discovers a need during implementation
- The commander should approve stack changes (cost/complexity implications)
- Known tool catalog prevents agents from reinventing config for common tools
