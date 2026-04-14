# agent-loop

**Status:** 🟡 In progress
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

Single-agent execution loop with mode switching (Research → Plan → Build → Verify). Each mode has its own system prompt and tool restrictions. Includes turn budget, wall-clock timeout, and plateau detection to prevent agents from spinning without progress.

## Checklist

- [ ] Mode state machine — Research → Plan → Build → Verify with explicit transitions
- [ ] Mode-specific system prompts — load different instructions per mode from .harness/prompts/
- [ ] Turn budget — configurable max turns per mode and per full loop cycle
- [ ] Wall-clock timeout — kill agent if elapsed time exceeds limit (default from agent config)
- [ ] Plateau detection — track improvement metric; if <3% improvement over 4 consecutive iterations, stop and report
- [ ] Mode transition criteria — define what triggers moving from one mode to the next
- [ ] Loop telemetry — emit structured events on mode enter/exit, budget consumption, plateau triggers
- [ ] Graceful stop — on budget/timeout/plateau, save current state before exiting
- [ ] Integration with agent config (.harness/agents/*.json) for per-agent loop parameters
- [ ] Unit tests for mode transitions, plateau detection, and budget enforcement

## Notes

- Plateau detection prevents infinite loops where the agent makes trivial changes without real progress
- Mode-specific system prompts are critical — Research mode should not have Write access, Verify mode should not have Edit access
- The loop is the core primitive that commander-orchestrator uses for each agent pane
