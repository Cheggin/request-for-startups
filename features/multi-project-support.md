# multi-project-support

**Status:** 🟢 Complete
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

Support managing multiple startups from a single harness installation. Each project is an independent repo with its own configuration. Commander can switch context between projects. Shared learnings propagate across projects via the self-improvement engine.

## Checklist

- [ ] Project registry — maintain list of all managed projects with repo paths and status
- [ ] Project switching — commander can switch active project context
- [ ] Independent configs — each project has its own .harness/ directory and agent configs
- [ ] Independent feature tracking — each project has its own features/ directory
- [ ] Shared skill library — global skills available to all projects (from self-improvement-engine)
- [ ] Cross-project cost tracking — aggregate and compare costs across projects
- [ ] Cross-project status — unified view of all projects in status-dashboard
- [ ] Project templates — create new projects from templates based on previous successful builds
- [ ] Resource allocation — distribute agent capacity across projects (priority-based)
- [ ] Project archival — archive completed or abandoned projects without deleting data
- [ ] CLI support — `harness project list/switch/new/archive` commands
- [ ] Isolation guarantee — agents working on one project cannot accidentally modify another
- [ ] Unit tests for project switching, isolation, and cross-project aggregation

## Notes

- Each project must be fully independent — no shared state except the global skill library
- Project switching changes the working directory and loads that project's config
- Cross-project learning is the key value — patterns that work in project A benefit project B
- Resource allocation matters when running multiple projects simultaneously — avoid overloading the machine
- The harness itself lives outside any individual project repo
