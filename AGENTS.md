# Agents

13 agent definitions in `agents/`. Each agent is a blank Claude Code session whose identity comes from its loaded skills and ground-truth rules.

## Agent Index

| Agent | Role | Model | Level | Restrictions |
|-------|------|-------|-------|-------------|
| **commander** | Orchestrator — dispatches work, manages agents, synthesizes updates | opus | 4 | No Write, Edit |
| **ops** | Operations — CI/CD, monitoring, incidents, infrastructure | opus | 3 | — |
| **researcher** | Gathers knowledge, runs experiments, produces research briefs | opus | 3 | — |
| **harness-researcher** | Researches improvements to the harness itself | opus | 3 | — |
| **paper-reader** | Reads papers, extracts findings, updates knowledge wiki | opus | 3 | — |
| **website** | Frontend — builds UI from designs, runs visual QA | opus | 2 | — |
| **backend** | Backend — Convex schema, API routes, server logic | opus | 2 | — |
| **growth** | Growth/analytics — PostHog, SEO, metrics, experiments | opus | 2 | — |
| **deploy** | Production deployments, rollbacks, health verification | opus | 2 | — |
| **docs** | API references, SDK guides, code examples, changelogs | opus | 2 | — |
| **alignment** | Monitors repo structure, detects drift and inconsistencies | opus | 2 | — |
| **slop-cleaner** | Monitors and cleans AI-generated slop from codebase | opus | 2 | No WebFetch, WebSearch |
| **writing** | Docs, blog posts, social media, README | opus | 1 | No Edit |

## Levels

- **Level 4**: Full orchestration — can spawn agents, manage projects, access all systems
- **Level 3**: Research + planning — can read broadly, run experiments, query external sources
- **Level 2**: Execution — builds, deploys, reviews within scoped directories
- **Level 1**: Content only — writes text, cannot modify code

## How Agents Work

An agent's identity comes from which skills are loaded. A "website agent" is just a Claude Code session with design + coding + convex skills loaded. Agent-to-skill mapping is defined in `.harness/agent-categories.yml`.

Agents are spawned in tmux panes via `harness agent spawn <name>` or the `tmux-spawn` skill. The commander dispatches tasks to agents and tracks completion via GitHub Issues.
