---
name: slop-cleaner
description: Clean AI-generated code slop with a regression-safe, deletion-first workflow
user-invocable: true
triggers:
  - slop
  - deslop
  - dead code
  - cleanup
  - anti-slop
  - code smell
group: quality
prerequisites: []
next: [verify]
workflows: [ship-feature, continuous-improvement]
---

# Slop Cleaner Skill

Use this skill to clean AI-generated code slop without drifting scope or changing intended behavior. This is the bounded cleanup workflow for code that works but contains dead code, duplication, needless abstraction, boundary violations, weak tests, or unnecessary dependencies.

## When to Use

- Codebase has accumulated AI-generated bloat (wrappers, duplication, dead code)
- Post-implementation cleanup pass
- Changed files need smell-focused review before merge
- Running with `--review` flag for report-only mode

## When NOT to Use

- Building new features (use build mode instead)
- Broad architectural redesign
- Generic formatting or style cleanup
- Behavior changes are intended

## Steps

### Step 1: Identify Changed Files

Determine the cleanup surface. Use one of:
- `git diff --name-only HEAD~N` for recent changes
- Explicit file list provided by caller
- `git diff --name-only main..HEAD` for branch changes

Do NOT silently expand scope beyond the identified files.

### Step 2: Classify Slop by Smell Type

Read each file and classify code into smell categories:

| Smell | Description | Priority |
|-------|-------------|----------|
| Dead code | Unused functions, unreachable branches, stale flags, commented-out blocks | 1 (safest to remove) |
| Duplication | Copy-pasted logic, repeated helpers, near-identical functions | 2 |
| Needless abstraction | Pass-through wrappers, single-use helpers, premature generalization | 3 |
| Boundary violations | Hidden coupling, wrong-layer imports, leaking side effects | 4 |
| Weak tests | Assert nothing meaningful, mock everything, snapshot-only | 5 |
| Unnecessary dependencies | Trivial package usage, stdlib duplicates | 6 |

### Step 3: Lock Behavior with Tests

Before editing any code:
1. Run the existing test suite: `bun test` or project-specific test command
2. Record the test results as baseline
3. If tests fail before cleanup, stop and report — do not clean code with a broken test suite

### Step 4: Delete Dead Code

First pass — safest changes:
- Remove unused imports
- Remove unused functions and variables
- Remove unreachable branches
- Remove commented-out code blocks
- Remove debug/console.log leftovers

Run tests after this pass.

### Step 5: Remove Duplication

Second pass:
- Identify repeated logic blocks
- Consolidate into existing utilities (do NOT create new helper files)
- Inline trivial wrappers that exist only for "reuse" that never materialized

Run tests after this pass.

### Step 6: Simplify Abstractions

Third pass — riskier changes:
- Inline single-use wrapper functions
- Flatten unnecessary indirection layers
- Remove speculative generalization (interfaces implemented by only one class, generics used in only one place)

Run tests after this pass.

### Step 7: Re-run Tests

Full test suite verification:
1. Run all tests
2. Compare against Step 3 baseline
3. If any test fails, revert the most recent pass and report the failure
4. Do not modify tests to accommodate cleanup changes

### Step 8: Report

Produce a structured report:

```
## Slop Cleaner Report

### Summary
- Files scanned: N
- Files modified: N
- Lines deleted: N
- Lines added: N
- Net delta: -N lines

### Changes by Smell Type
- Dead code: N removals
- Duplication: N consolidations
- Needless abstraction: N simplifications

### Test Verification
- Before: N tests passing
- After: N tests passing
- Regressions: none

### Remaining Risks
- [Any smells skipped due to uncertainty]
- [Any files that need human review]
```

## Anti-Patterns

These are explicit failures of the slop cleaning process. Avoid them:

1. **Bundling unrelated refactors** — Each pass targets one smell type. Do not mix dead code removal with naming changes with structural refactors in the same commit.

2. **Adding new abstractions while removing old ones** — The goal is net reduction in abstraction. Replacing one wrapper with a different wrapper is not cleanup, it is churn.

3. **Skipping test verification** — Every pass must be bookended by test runs. No exceptions. If you cannot run tests, switch to `--review` mode and report only.

4. **Expanding scope without permission** — If the caller specified files A, B, C, clean only A, B, C. Do not "while I'm here" into files D and E.

5. **Refactoring when deletion suffices** — If code is unused, delete it. Do not refactor unused code into "better" unused code.

6. **Creating new files during cleanup** — Cleanup reduces files, it does not add them. If you find yourself creating a new utility file to "consolidate," you are adding abstraction, not removing it.

## Review Mode (--review)

When invoked with `--review`, execute Steps 1-2 only. Produce a findings report without modifying any files:

```
## Slop Review Findings

### [filename]
- Line N-M: [smell type] — [description]
- Confidence: high/medium/low
- Recommended action: [delete/consolidate/inline/skip]
```

Review mode is for pre-merge audits and when you want a human to approve changes before execution.
