---
name: tmux-spawn
description: Reliable agent spawning in tmux with load-wait and verification
user-invocable: false
group: orchestration
prerequisites: []
next: []
workflows: [full-startup]
---

# tmux-spawn — Reliable Agent Dispatching

Encapsulates the correct pattern for spawning Claude Code agents in tmux panes. Every spawn in the harness MUST follow this 5-step protocol.

## The Problem

Naive tmux spawning fails silently in multiple ways:

1. **Non-interactive shell**: tmux runs commands in a non-login shell. `.zshrc`/`.bashrc` are not sourced, so `claude`, `lfg`, `nvm`, etc. are not on PATH.
2. **Enter not submitted**: `tmux send-keys "text" Enter` appends the literal string "Enter" to the text instead of pressing the Enter key. Text and Enter MUST be separate `send-keys` calls.
3. **Process exits before callback**: Using `setTimeout` in a CLI process to delay sending keys causes the process to exit before the timer fires. Must use synchronous sleep.
4. **No load verification**: Claude Code takes 10-30s to load plugins and MCP servers. Sending a prompt before it's ready drops the input silently.
5. **No activity verification**: Even after sending a prompt, the agent may not have started working (stuck at prompt, crashed, etc.).

## The 5-Step Protocol

### Step 1: Spawn window with login shell wrapping

```bash
# Wrap the command so .zshrc is sourced
tmux new-window -t harness -n <name> \
  '/bin/zsh -lc '\''[ -f ~/.zshrc ] && . ~/.zshrc; cd /path/to/repo && claude --dangerously-skip-permissions --model claude-opus-4-6'\'''
```

The `wrapWithLoginShell()` function in `packages/cli/src/lib/tmux.ts` handles this automatically.

### Step 2: Wait for Claude Code to fully load

Poll `capture-pane` output for ready indicators (`>`, `claude>`, `Claude Code`, `Tips:`).

```bash
# Poll until ready (max 30s)
until tmux capture-pane -t harness:<name> -p -S -10 2>/dev/null | grep -qE '>|claude>|Claude Code|Tips:'; do
  sleep 2
done
```

The `waitForReady()` function handles this with configurable timeout.

### Step 3: Send prompt text (NO Enter)

```bash
tmux send-keys -t harness:<name> 'your prompt text here'
```

### Step 4: Send Enter SEPARATELY

```bash
tmux send-keys -t harness:<name> Enter
```

The `sendKeys()` function in tmux.ts does steps 3+4 automatically.

### Step 5: Verify agent is running

After a brief pause (3s), capture pane output and check for activity indicators (tool calls, thinking, output generation) vs idle indicators (Tips, prompt).

```bash
sleep 3
tmux capture-pane -t harness:<name> -p -S -15 2>/dev/null
# Check for: Read, Edit, Bash, Grep, thinking, searching
# Warn if: Tips:, Available commands:
```

The `verifyRunning()` function handles this.

## API Reference

All functions are exported from `packages/cli/src/lib/tmux.ts`:

| Function | Purpose |
|---|---|
| `spawnPane(name, command)` | Spawns a tmux window with login shell wrapping |
| `sendKeys(name, text)` | Sends text + Enter as separate calls |
| `waitForReady(name, timeoutMs?, pollMs?)` | Polls for Claude Code ready state |
| `verifyRunning(name, waitMs?)` | Checks for agent activity after prompt |
| `sleepSync(ms)` | Synchronous sleep (safe in CLI context) |
| `wrapWithLoginShell(command)` | Internal: wraps command for .zshrc sourcing |

## Usage in Harness Commands

### Agent spawn (`harness agent spawn <name> <prompt>`)

```
spawnPane(name, "cd /repo && claude --dangerously-skip-permissions --model ...")
  -> waitForReady(name)
  -> sendKeys(name, prompt)
  -> verifyRunning(name)
```

### Loop start (`harness loop start <name>`)

```
spawnPane(paneName, "cd /repo && claude --dangerously-skip-permissions --model ...")
  -> waitForReady(paneName)
  -> sendKeys(paneName, "/loop 5m <prompt>")
  -> verifyRunning(paneName)
```

## Common Failures

| Symptom | Cause | Fix |
|---|---|---|
| `claude: command not found` | Non-login shell, PATH not set | `wrapWithLoginShell()` |
| Prompt visible but not submitted | Enter sent with text, not separately | `sendKeys()` two-step |
| Prompt sent but ignored | Claude Code not loaded yet | `waitForReady()` |
| No error but agent idle | `setTimeout` in CLI, process exited | `sleepSync()` |
