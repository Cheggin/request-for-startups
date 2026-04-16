# Plan: Skill Frontmatter Reorganization

## Task
Add frontmatter fields (group, prerequisites, next, workflows) to all 95 skills in `skills/*/SKILL.md`, then update README.md with a Skills section.

## Groups (95 skills total)
- **orchestration** (20): autopilot, ralph, team, ultrawork, ultraqa, loop-prompt, cancel, tmux-spawn, issue-creator, github-state-manager, context-reset-handler, tiered-memory, self-improve, agent-creator, debug, trace, deep-dive, trajectory-logging, error-classifier, startup-init
- **strategy** (8): plan, deep-interview, competitor-research, research, avoid-feature-creep, sprint-contracts, shape, brand-guidelines
- **design** (17): impeccable, critique, website-creation, layout, typeset, colorize, animate, bolder, quieter, delight, distill, overdrive, adapt, clarify, polish, asset-generation, optimize
- **build** (15): convex, convex-agents, convex-best-practices, convex-component-authoring, convex-cron-jobs, convex-file-storage, convex-functions, convex-http-actions, convex-migrations, convex-realtime, convex-schema-validator, convex-security-audit, convex-security-check, test-generator, stack-extend
- **quality** (9): audit, verify, slop-cleaner, visual-qa-pipeline, accessibility-checker, performance-benchmark, security-scanner, cubic-codebase-scan, eval-framework
- **ship** (5): deploy-pipeline, ci-cd-pipeline, seo-setup, legal-generator, dependency-manager
- **grow** (9): analytics-integration, landing-page-optimizer, programmatic-seo, seo-chat, social-intelligence, social-media, user-feedback-collector, data-driven-blog, blog-scaffolder
- **operate** (6): uptime-monitor, error-tracking, incident-response, log-aggregation, post-deploy-loop, cost-tracker
- **comms** (6): investor-updates, slack-course-correction, anti-ai-writing, readme-generator, contributing-guide, documentation-generator

## Always-load guards
- anti-ai-writing, verify, avoid-feature-creep

## Approach
- Batch by group, ~10-15 skills per batch
- After each batch: conventional commit
- Final: update README.md, commit

## Workflows (from analysis D)
1. full-startup-launch
2. landing-page
3. bug-fix
4. design-review
5. ship-feature
6. seo-content-growth
7. incident-response
8. continuous-improvement
