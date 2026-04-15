# CEO Orchestration Learnings

Lessons from running the harness as CEO. These persist across cloned repos.

## Agent Spawning
- Use `claude --dangerously-skip-permissions` in tmux, never `lfg` (aliases don't load in non-interactive shells)
- Send prompt text and Enter as SEPARATE tmux send-keys calls — Claude Code TUI swallows combined Enter
- Wait 15-20s after spawning for Claude Code to load plugins before sending prompts
- Codex uses `codex --yolo` — can read SKILL.md files directly but can't invoke slash commands

## Parallel Agents
- NEVER run parallel agents on the same branch — they overwrite each other's commits
- Each agent must work on `agent/<name>/<issue-number>` feature branch
- Rebase on origin/main before pushing
- Create PRs instead of pushing to main
- Only the commander/CEO merges to main
- A branch-enforcer hook must block `git push` to main from agents

## Skill Invocation
- Agents must have skill manifests injected at spawn via `generateAgentPrompt()` in agent-loader.ts
- Without skill injection, agents freestyle everything — this is the #1 failure mode
- For Claude Code: `/startup-harness:<skill-name>` slash commands
- For Codex: `Read skills/<name>/SKILL.md then apply it to <target>`

## Monitoring
- CEO must run a continuous monitoring loop, not ad-hoc checks
- Poll all tmux panes every 60s: check for stuck, idle, permission prompts
- Auto-approve safe permission prompts
- Detect idle agents and redispatch from issue backlog
- Session analyzer: `tmux capture-pane -p -S -500` then grep for skill invocations, commits, issues

## Tmux Layout
- 2x4 grid per category: `harness:agents` (issue workers), `harness:loops` (persistent scanners)
- Name panes with `tmux select-pane -T` + `set-option -p allow-rename off`
- Codex overrides pane titles with spinner — set allow-rename off per-pane

## Review
- ALWAYS read `git diff` before committing agent work — never rubber-stamp
- Multiple agents editing same files = guaranteed duplication/regression
- Check: page sizes (under 150 lines), chart imports present, no duplicate content
- The CEO is the evaluator — evaluating means READING the code

## Dashboard
- Charts-first design — every dashboard page should lead with visx charts
- Light mode only, Geist font, no Inter, no sparkles, no glassmorphism
- Keep pages under 150 lines
- visx (Airbnb) chart components: TrafficChart, Sparkline — always import and render

## Issue Management
- All issues follow .harness/issue-schema.md: type, severity, acceptance criteria, verification
- CommitLint blocks non-conventional commits
- IssueLint blocks issues missing required fields
- Scanner loops create issues, fixer agents consume them
- Close issues with commit refs: `closes #42`
