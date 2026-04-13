# ui-loop

Claude Code plugin — autonomous AI agent that builds UIs in a loop. Runs for hours or days, writing code, taking screenshots, evaluating against a design spec, and iterating until the UI is right.

## Install

```bash
# Add the marketplace
/plugin marketplace add Cheggin/ui-loop

# Install the plugin
/plugin install ui-loop
```

Or test locally during development:
```bash
claude --plugin-dir /path/to/ui-loop
```

## Usage

In Claude Code, run:

```
/ui-loop:loop Build a dashboard with real-time analytics
```

The agent will:
1. **Clarify** — Ask targeted questions about pages, visual direction, data, components, scope, and tech stack
2. **Plan** — Decompose the goal into a prioritized todo DAG
3. **Build** — Work through each todo: read code, edit files, take screenshots, validate, commit
4. **Loop** — Detect plateaus, skip stuck work, re-plan when the queue is empty

Check progress at any time:

```
/ui-loop:loop-status
```

## How It Works

ui-loop is a prompt system, not a runtime. It gives Claude Code:

- **CLAUDE.md** — Design system rules, prohibitions, thinking patterns for 7 agent roles, framework-specific instructions
- **/loop skill** — The build protocol: clarify → plan → build → validate → commit → loop
- **/loop-status skill** — Status check against `.ui-loop/todos.md`
- **Session hook** — Creates `.ui-loop/` directory on startup

All agent state lives in your project as plain markdown:
- `.ui-loop/todos.md` — The todo queue
- `.ui-loop/spec.md` — Project brief from Phase 0 clarification
- `.ui-loop/progress.md` — Session progress log

## Agent Roles

The agent adopts different thinking patterns depending on the phase:

| Role | When | Focus |
|------|------|-------|
| **Orchestrator** | Planning, dispatching | Decompose, sequence by dependency, budget awareness |
| **Page Planner** | Creating todos | Shared-first ordering, verifiable exit conditions |
| **Build** | Implementing | Read before write, smallest change, visual verification |
| **QA** | Reviewing | Systematic checklist, zero console errors |
| **Auditor** | Progress evaluation | Compare built vs requested, actionable recommendations |
| **Design Spec** | Generating specs | Internal consistency, edge case coverage |
| **Inspiration** | Analyzing references | Extract the system not the surface |

## Loop Control

Built-in heuristics prevent wasted iterations:

- **Plateau**: < 3% progress for 4 iterations → park todo, move on
- **Stuck**: < 5% progress for 2 iterations → escalate or skip
- **Repetition**: Same changes 3x → stop, you're in a loop
- **Breadth over depth**: Cover all parts of the goal before polishing any one

## Supported Frameworks

Next.js (App Router), Vite + React, Remix, SvelteKit, Astro, Nuxt. Default is Next.js + Tailwind v4.

## License

MIT
