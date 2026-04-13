# agent-categories

**Status:** 🟡 In progress
**Agent:** harness-dev
**Category:** coding
**Created:** 2026-04-13

## Description

The category-level ground truth system. Each category (coding, content, growth, operations) defines non-negotiable rules that all agents in that category inherit. Per-agent configs add tool scope, file restrictions, and budgets on top.

## Checklist

- [x] agent-categories.yml — category definitions with ground truth rules
- [x] Per-agent config templates (.harness/agents/*.json) — 6 agents defined
- [ ] Category loader — code that reads agent-categories.yml and applies rules
- [ ] Per-agent .mcp.json generator — creates scoped .mcp.json from agent config
- [ ] Per-agent settings.json generator — creates scoped settings with hooks from agent config
- [ ] Validation — ensure every agent maps to exactly one category
- [ ] Tests for category loader and config generators

## Notes

- Categories: coding (website, backend, ops), content (writing, social-media), growth (growth, analytics), operations (ops, deploy)
- Ops agent belongs to both coding and operations — inherits from both
- Agent configs stored in .harness/agents/*.json with mcpServers, allowedTools, fileScope, hooks, rules
