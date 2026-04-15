---
name: session-analyzer
description: Capture tmux pane history and audit agent compliance — skill invocations, GitHub issues created, commits made, scope adherence. Outputs a per-pane compliance report.
user-invocable: true
argument-hint: "[pane-name|--all]"
---

# Session Analyzer

Audit agent tmux panes for compliance with harness operating rules.

## What It Checks

For each pane, capture the last 500 lines of tmux history and analyze:

### 1. Skill Invocations

Count lines matching `/startup-harness:` or `/oh-my-claudecode:` patterns. Agents MUST invoke skills via slash commands — freestyling is a violation.

- **Pass**: at least 1 skill invocation found
- **Fail**: 0 skill invocations when the pane was expected to run skills

### 2. GitHub Issue Activity

Count `gh issue create`, `gh issue comment`, `gh issue close`, and `gh issue edit` commands in the history. Agents that discover problems should file issues.

- Count each distinct `gh issue` command

### 3. Git Commits

Count `git commit` commands (excluding `git commit --amend` which may indicate sloppy work). Look for commit hashes in output too.

- Count each distinct commit

### 4. File Edits

Count tool invocations: `Edit`, `Write`, `Read`, `Bash`, `Grep`, `Glob` tool calls visible in the pane output. These indicate the agent was actively working.

- Count each tool call

### 5. Scope Adherence

Flag potential scope violations:

- Installing unexpected dependencies (`npm install`, `bun add` outside of expected packages)
- Touching files outside the agent's assigned area
- Running destructive commands (`rm -rf`, `git reset --hard`, `git push --force`)

### 6. Runtime Detection

Identify what runtime is running in the pane:

- **Claude Code**: look for `Claude Code`, `claude>`, tool call patterns
- **Codex**: look for `Codex`, `codex>` — note: Codex cannot invoke `/startup-harness:` skills
- **Gemini**: look for `Gemini`
- **Shell**: bare shell with no AI runtime

## Output Format

For each pane, produce a compliance report:

```
--- Pane: <name> (<runtime>) ---
Skills invoked:    3
Issues created:    1
Commits made:      2
Tool calls:        47
Scope flags:       0

Compliance: PASS
```

If skills = 0 and runtime supports skills (Claude Code):

```
Compliance: FAIL — no skill invocations (freestyle violation)
```

If runtime is Codex:

```
Compliance: N/A — Codex runtime cannot invoke skills
```

## How To Run

### CLI

```bash
harness analyze <pane-name>    # single pane
harness analyze --all          # all panes in session
```

### From Claude Code

```
/startup-harness:session-analyzer <pane-name>
/startup-harness:session-analyzer --all
```

## Workflow

1. Resolve target pane(s) — single name or `--all` for every pane in the harness tmux session
2. For each pane, run `tmux capture-pane -p -S -500 -t <target>`
3. Parse the captured output against the checklist above
4. Print the compliance report
5. If `--all`, print a summary table at the end with pass/fail counts

## Anti-Patterns

- Do not kill or modify panes — this is read-only analysis
- Do not send keys to any pane
- Do not create issues for compliance failures automatically — report them for the CEO to act on
- Do not count the CEO's own pane as non-compliant
