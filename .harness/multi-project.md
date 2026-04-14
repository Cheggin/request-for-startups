# Multi-Project Support — Design Document

**Phase:** 4 (Evolution)
**Status:** Design only — not yet built
**Created:** 2026-04-13

---

## Overview

Support managing multiple startups from a single harness installation. Each project is an independent repo with its own `.harness/` configuration. The harness CLI can switch between projects. Shared learnings propagate across projects via the knowledge wiki and self-improvement engine.

---

## Architecture

### Project Isolation

Each project is a fully independent Git repository with its own:

- `.harness/` directory (agents, secrets, tool-catalog, stacks, cost tracking)
- `features/` directory (feature specs with checklists)
- `agents/` directory (project-specific agent definitions)
- `packages/` directory (project-specific packages)
- GitHub Issues and Project board
- Deployment pipeline and infrastructure

Projects share nothing by default. Isolation is enforced at the filesystem level — an agent working on Project A cannot read or write files in Project B's repo.

### Project Registry

A global registry file lives outside any individual project repo, at `~/.harness/projects.json`:

```json
{
  "projects": [
    {
      "name": "my-saas-app",
      "path": "/Users/me/projects/my-saas-app",
      "status": "active",
      "created": "2026-04-01",
      "type": "b2c"
    },
    {
      "name": "dev-tool-cli",
      "path": "/Users/me/projects/dev-tool-cli",
      "status": "active",
      "created": "2026-04-10",
      "type": "devtool"
    }
  ],
  "activeProject": "my-saas-app"
}
```

### Project Switching

When the CLI switches projects:

1. Save any in-progress agent state to the current project's `.harness/`
2. Update `activeProject` in the registry
3. Change working directory to the new project's repo
4. Load the new project's `.harness/` configuration
5. Resume any agents that were running in the target project

Switching is a clean context reset — no state leaks between projects.

### CLI Commands

```
harness project list              # List all registered projects with status
harness project switch <name>     # Switch active project context
harness project new <name> <path> # Register a new project
harness project archive <name>    # Archive a project (preserves data, stops agents)
harness project status            # Show status of all projects (unified view)
```

---

## Shared Learnings

### Cross-Project Knowledge Wiki

The self-improvement engine (already built) learns from each project. When a skill or pattern proves effective (confidence >= 0.8), it gets promoted to the global skill library:

- **Global skills** live at `~/.harness/skills/` (outside any project)
- **Project skills** live at `<project>/.harness/skills/` (project-specific)
- When an agent starts, it loads: project skills first, then global skills (project overrides global)

### Knowledge Transfer Protocol

1. After a project ships a feature successfully, the self-improvement engine extracts learnings
2. Learnings with confidence >= 0.8 are candidates for global promotion
3. Global promotion requires the learning to be generalizable (not project-specific)
4. The "overfitting test": if this project disappeared, would this skill still help?
5. Promoted skills get tagged with their origin project for traceability

---

## Resource Allocation

When running multiple projects simultaneously:

- Each project gets a budget allocation (tokens per day, max concurrent agents)
- A priority system determines which project gets resources first:
  - `critical`: deadline-driven, gets resources first
  - `normal`: standard priority (default)
  - `background`: only runs when no higher-priority work exists
- The harness never runs more agents than the machine can handle
- If a project exhausts its budget, its agents pause (not terminate)

---

## Cross-Project Status

The status dashboard (packages/status-dashboard) extends to show all projects:

```
=== All Projects ===

  my-saas-app     [active]   Phase 2: Quality   45% complete   $12.50 spent
  dev-tool-cli    [active]   Phase 1: Foundation 20% complete   $4.30 spent
  old-project     [archived] Phase 3: Scale      89% complete   $45.00 spent
```

---

## Project Templates

After a project is completed, it can become a template for new projects:

- Templates capture: stack choices, agent configurations, skill library, feature structure
- `harness project new --template <source-project> <name> <path>`
- Templates strip project-specific data (secrets, Issues, content) and keep structural patterns

---

## Isolation Guarantees

1. **Filesystem isolation**: Agents only see their project's repo (enforced by working directory)
2. **Git isolation**: Each project is a separate repo (no shared branches)
3. **Secret isolation**: Each project has its own `.harness/secrets.env`
4. **Budget isolation**: Each project has its own cost tracking
5. **Agent isolation**: Agent instances are bound to one project at a time

The only cross-project data flow is through the global skill library, which requires explicit promotion (not automatic sync).

---

## Open Questions

- Should the registry be a flat file or a lightweight database (SQLite)?
- How do we handle projects on remote machines (SSH/cloud)?
- Should cross-project cost aggregation feed into a single billing dashboard?
- What happens when two projects promote conflicting skills to global?

---

## Non-Goals (for now)

- Multi-machine orchestration (all projects on one machine for Phase 4)
- Real-time collaboration between projects (async knowledge transfer only)
- Shared infrastructure (each project deploys independently)
- Web-based project management UI (CLI-only for Phase 4)
