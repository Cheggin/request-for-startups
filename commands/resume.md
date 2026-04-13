# onboarding-resume

**Status:** 🔴 Not started
**Agent:** harness-dev
**Category:** operations
**Created:** 2026-04-13

## Description

If onboarding is interrupted — network failure, user closes terminal, context limit hit — the harness can resume from where it left off. State is saved after each step completion. On resume, the harness reads the saved state and skips completed steps, picking up exactly where it stopped. No user input is re-requested, no work is duplicated.

## Checklist

- [ ] State file definition — .harness/onboarding-state.json with step statuses and collected data
- [ ] State persistence — write state to disk after every step completion
- [ ] Step registry — ordered list of all onboarding steps with unique IDs
- [ ] Resume detection — on startup, check if onboarding-state.json exists and is incomplete
- [ ] Step skip logic — completed steps are skipped entirely, no re-prompting
- [ ] Partial step recovery — if a step was interrupted mid-execution, re-run it from the start
- [ ] User data preservation — collected inputs (API keys, project name, etc.) survive restart
- [ ] Network failure handling — detect network errors and save state before crashing
- [ ] Context limit handling — detect approaching context limit and checkpoint state
- [ ] Terminal close handling — use signal handlers (SIGINT, SIGTERM) to save state on exit
- [ ] Resume confirmation — on resume, show user what was completed and what remains
- [ ] Clean start option — allow user to restart onboarding from scratch (delete state file)
- [ ] State file validation — verify state file integrity on resume (detect corruption)

## Notes

- The state file is the only thing that matters for resume — if it's lost, onboarding restarts
- Step IDs must be stable across harness versions — renaming a step breaks resume
- User data in the state file may include API keys — state file must be in .gitignore
- Resume should feel seamless — the user should not notice they're resuming vs. starting fresh
- This pattern applies beyond onboarding — the implementation loop should use similar state persistence
- Context limit is the most common interruption — the harness should checkpoint proactively
