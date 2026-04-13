---
description: Start an autonomous UI-building loop that runs for hours or days
user_invocable: true
---

You are starting a ui-loop session. Follow every phase in order. Do not skip phases.

## Phase 0 — Clarify Before Building (MANDATORY)

Before writing any code, you MUST ask the user targeted clarifying questions. Do not skip this. Do not infer. Ask.

Present exactly ONE message with these questions. Use lettered options where possible so the user can respond quickly:

1. **Pages & Routes** — What pages does this need? (e.g., landing, dashboard, settings, auth)
2. **Visual Direction** — What should it look and feel like? Dark/light? Minimal/dense? Reference site?
3. **Data** — Is this static/mock data or connected to a real API/database? What entities exist?
4. **Components** — Any specific UI elements required? (charts, tables, forms, maps, etc.)
5. **Scope** — What's the MVP vs. nice-to-have? What should you build first?
6. **Tech** — Use the default stack (Next.js + Tailwind v4) or something else?

Include your RECOMMENDATION for each question based on the goal. The user can just say "go with your recommendations" to start immediately.

Wait for the user's response before proceeding.

Once you have answers, write them to `.ui-loop/spec.md` as the project brief before starting any code.

## Phase 1 — Plan (Page Planner)

Decompose the goal into a DAG of todos. Write them to `.ui-loop/todos.md` using this format:

```markdown
# Todos

## [TODO-1] <type>: <description>
- **Status:** queued | active | completed | skipped | parked | blocked
- **Scope:** src/path/to/scope
- **Priority:** 1-10 (lower = higher priority)
- **Exit condition:** <verifiable condition>
- **Blocked by:** [TODO-X] (if any)
- **Progress:** 0%
- **Notes:** (filled in during/after work)
```

Planning rules:
- Shared components first (nav, footer, layout), then page-specific work
- Exit conditions must be verifiable — "looks good" is not acceptable
- No two todos should touch the same file
- Prefer fewer well-scoped todos over many tiny ones

## Phase 2 — Build Loop

For each todo (in priority order, respecting dependencies):

### ORIENT
1. Read the CLAUDE.md rules and your `.ui-loop/spec.md`
2. Read the current todo from `.ui-loop/todos.md`

### UNDERSTAND (at least 1 file read)
- Read current code before modifying it
- Search for relevant files in the scope
- CRITICAL: Never modify a file you haven't read. Never assume file contents from a previous iteration. Search before creating — the component you need may already exist.

### EXECUTE
- Edit or write files within the assigned scope only
- Fix-First: broken imports, missing types, trivial lint issues in files you're editing — fix them directly

### VALIDATE
- Take a screenshot to validate the result visually
- Check for build errors
- Do NOT mark a todo complete before taking a screenshot

### COMPLETE
Update the todo in `.ui-loop/todos.md` with:
1. What changed (specific files and what was done to each)
2. What was verified (screenshot taken, build passed, etc.)
3. What remains (if not fully complete, what specific work is left)
4. Commit the changes: `[ui-loop] <type>: <description>`

Then move to the next todo.

## Loop Control Rules

These rules prevent wasted iterations. Follow them strictly:

### Plateau Detection
If your progress gain is less than ~3% for 4 consecutive iterations on a single todo, you are plateauing. Mark the todo as **parked** with notes on what remains, commit your progress, and move to the next todo.

### Stuck Detection
If you make less than 5% progress for 2 consecutive iterations, you are stuck. Either:
- Escalate using the STATUS/WHAT I TRIED/WHY THEY FAILED/RECOMMENDATION format
- Skip the todo and move on

### Repetition Detection
If you find yourself making the same changes 3 times in a row, STOP. You are in a loop. Escalate or skip.

### Re-planning
When all todos are done (or parked/skipped), evaluate:
1. Are there pages, components, or features in the goal that haven't been addressed?
2. Do any failed todos need retrying with a different approach or narrower scope?
3. Do any parked todos need a follow-up todo to finish the remaining work?
4. Is there polish work (responsive, accessibility, animations) that would meaningfully improve the result?

If yes, create new todos in `.ui-loop/todos.md` and continue. If the goal is sufficiently met, stop.

### Breadth Over Depth
- Cover all parts of the goal before polishing any one part
- Do NOT re-create todos that are already completed
- Do NOT create polish todos if core functionality isn't done

## Session Goal

> $ARGUMENTS

Start with Phase 0 (Clarify). Do not stop until the goal is fully met.
