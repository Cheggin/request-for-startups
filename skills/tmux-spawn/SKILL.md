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

## The 6-Step Protocol

**All agents share ONE tmux window** named `agents` (by default). New spawns split that window and `select-layout tiled` keeps every pane equally sized in an alternating vertical/horizontal grid. You never have to flip between windows to watch the fleet.

### Step 1: Ensure the shared window exists (first spawn creates it, subsequent spawns reuse)

```bash
WIN=agents
SESSION=harness

# Does the window exist?
if ! tmux list-windows -t "$SESSION" 2>/dev/null | grep -qE "^[0-9]+: $WIN[\* ]"; then
  # First agent: create the window and the first pane. Name the pane via
  # @title so capture/target calls can find it.
  tmux new-window -t "$SESSION" -n "$WIN" \
    "/bin/zsh -lc '[ -f ~/.zshrc ] && . ~/.zshrc; cd $REPO && claude --dangerously-skip-permissions --model $MODEL'"
  tmux select-pane -t "$SESSION:$WIN" -T "$AGENT_NAME"
else
  # Subsequent agents: split the most recent pane in the same window,
  # then re-tile so every pane is equally sized.
  tmux split-window -t "$SESSION:$WIN" \
    "/bin/zsh -lc '[ -f ~/.zshrc ] && . ~/.zshrc; cd $REPO && claude --dangerously-skip-permissions --model $MODEL'"
  tmux select-pane -T "$AGENT_NAME"
  tmux select-layout -t "$SESSION:$WIN" tiled
fi
```

### Step 2: Target the NEW pane by title

All subsequent commands target the pane by its title (set in Step 1):

```bash
PANE=$(tmux list-panes -t "$SESSION:$WIN" -F '#{pane_title}:#{pane_id}' | grep "^$AGENT_NAME:" | head -1 | cut -d: -f2)
```

### Step 3: Wait for Claude Code to fully load

Poll `capture-pane` on that specific pane for ready indicators (`>`, `claude>`, `Claude Code`, `Tips:`).

```bash
until tmux capture-pane -t "$PANE" -p -S -10 2>/dev/null | grep -qE '>|claude>|Claude Code|Tips:'; do
  sleep 2
done
```

The `waitForReady()` function handles this with configurable timeout.

### Step 4: Send prompt text (NO Enter)

```bash
tmux send-keys -t "$PANE" 'your prompt text here'
```

### Step 5: Send Enter SEPARATELY

```bash
tmux send-keys -t "$PANE" Enter
```

The `sendKeys()` function does steps 4+5 automatically.

### Step 6: Verify agent is running + keep layout tidy

After a brief pause (3s), capture pane output and check for activity indicators. Then re-tile once in case the capture broadcast changed pane sizing.

```bash
sleep 3
tmux capture-pane -t "$PANE" -p -S -15 2>/dev/null
tmux select-layout -t "$SESSION:$WIN" tiled
# Check for: Read, Edit, Bash, Grep, thinking, searching
# Warn if: Tips:, Available commands:
```

## Why `tiled` (not manual -h / -v splits)

`tmux select-layout tiled` alternates vertical and horizontal splits automatically and resizes every pane equally. You get a 1x1 → 1x2 → 2x2 → 2x3 → 3x3 progression without having to pick split direction per agent. Manually alternating `-h` / `-v` while targeting specific panes produces slivers and gets out of sync with agents that exit.

## Common anti-patterns — never do these

- **`tmux new-window` per agent** — produces N separate windows you have to tab through. Use `split-window` on the shared window instead.
- **`tmux split-window -h` without `select-layout tiled`** — each new agent gets skinnier than the last. Re-tile after every split.
- **Targeting panes by index** (`$WIN.1`, `$WIN.2`) — indices shift when panes close. Use `@title` + `#{pane_title}` lookup.
- **Multiple shared windows** (`agents-1`, `agents-2`) — defeats the one-window requirement. One window, N panes.

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
