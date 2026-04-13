# cli-harness-manager

**Status:** 🔴 Not started
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

CLI tool for managing the harness: `harness status` shows all agents, features, and progress; `harness agent start/stop` controls agent execution; `harness feature new/list/status` manages feature checklists; `harness cost report` shows spend; `harness deploy` triggers deployment. Wraps Taskfile commands with a nicer interface.

## Checklist

- [ ] `harness status` — display all agents, their current state, and active tasks
- [ ] `harness agent list` — show all configured agents with their categories and scopes
- [ ] `harness agent start <name>` — start an agent in a new tmux pane
- [ ] `harness agent stop <name>` — gracefully stop a running agent
- [ ] `harness feature new <name>` — create a new feature checklist from template
- [ ] `harness feature list` — show all features with status and completion percentage
- [ ] `harness feature status <name>` — show detailed checklist progress for a feature
- [ ] `harness cost report` — aggregate cost data from trajectory logs, break down by agent
- [ ] `harness deploy` — trigger deployment pipeline (staging or production)
- [ ] `harness init` — initialize harness in an existing repo (create .harness/ structure)
- [ ] `harness health` — run all health checks and report issues
- [ ] Shell completion — bash/zsh autocompletion for all commands and arguments
- [ ] Colored terminal output — green for healthy, yellow for warnings, red for errors
- [ ] Wraps Taskfile commands — delegates to `task` under the hood for consistency
- [ ] Unit tests for CLI argument parsing and command execution

## Notes

- The CLI is a convenience wrapper — all underlying logic lives in the Taskfile
- `harness status` is the most important command — should give a complete overview at a glance
- Cost report pulls from trajectory logs and calculates spend per agent per feature
- Deploy command respects the CI/CD pipeline — it triggers the workflow, not a direct deploy
- Consider implementing as a simple shell script initially, upgrade to a proper CLI later
