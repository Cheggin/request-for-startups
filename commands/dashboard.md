# Dashboard

Launch the Fleet Dashboard for live agent fleet monitoring.

## Setup

```bash
cd dashboard && npm install && npm run dev
```

Opens at http://localhost:3000

## What it monitors

- **Agent fleet**: running/idle/stuck status for all tmux panes, with nudge capability
- **Skill chains**: phase progress for the active skill-chain flow
- **Hook traces**: signal events from `.harness/signals/`
- **Git activity**: commit heatmap over the last 7 days

## Requirements

- tmux must be running with agent panes
- CEO pane must have title set: `tmux select-pane -T CEO`
