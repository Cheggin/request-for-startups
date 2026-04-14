# Alignment Report

**Generated**: 2026-04-14
**Agent**: alignment
**Scope**: Full structural audit — skills, agents, hooks, manifests, SOUL.md, README, reference repos

---

## Check 1: Symlink Integrity

**RESULT: FAIL** (1 issue)

Every skill in `skills/` has a corresponding directory in `.claude/skills/` (93 = 93). However:

| Issue | Path | Fix |
|-------|------|-----|
| Regular file instead of symlink | `.claude/skills/startup-init/SKILL.md` | Replace with symlink to `skills/startup-init/SKILL.md` |

All other 92 skills have working symlinks that resolve correctly.

---

## Check 2: Agent-Categories ↔ Actual Skills

**RESULT: PASS** (with notes)

`agent-categories.yml` references these `skill_categories`: `design`, `coding`, `convex`, `content`, `growth`, `operations`, `agent`.

Skills are now flat (`skills/<name>/SKILL.md`) — no longer organized into category subdirectories. The categories are conceptual groupings documented in README. All 93 skills exist and the README categorization accounts for every skill:

| Category | README Claim | Actual | Status |
|----------|-------------|--------|--------|
| Init | 1 | 1 | PASS |
| Design | 17 | 17 | PASS |
| Coding | 12 | 12 | PASS |
| Convex | 13 | 13 | PASS |
| Content | 9 | 9 | PASS |
| Growth | 7 | 7 | PASS |
| Operations | 6 | 6 | PASS |
| Orchestration | 14 | 14 | PASS |
| Agent | 14 | 14 | PASS |
| **Total** | **93** | **93** | **PASS** |

**Note**: `agent-categories.yml` does not list "orchestration" as a `skill_category` — the orchestration agents only load "agent" skills. The 14 orchestration skills (autopilot, ralph, team, ultrawork, ultraqa, plan, deep-interview, deep-dive, cancel, trace, debug, self-improve, verify, agent-creator) are listed in README but have no corresponding category mapping in `agent-categories.yml`. These skills are available as Claude Code plugin skills but not routed to any agent category.

---

## Check 3: Agent-Categories ↔ Actual Agents

**RESULT: FAIL** (1 issue)

| Agent | In `agents/` | In `agent-categories.yml` | Status |
|-------|-------------|--------------------------|--------|
| website | YES | YES (coding) | PASS |
| backend | YES | YES (coding) | PASS |
| growth | YES | YES (growth) | PASS |
| writing | YES | YES (content) | PASS |
| docs | YES | YES (content) | PASS |
| ops | YES | YES (operations) | PASS |
| commander | YES | YES (orchestration) | PASS |
| researcher | YES | YES (orchestration) | PASS |
| harness-researcher | YES | YES (orchestration) | PASS |
| alignment | YES | YES (orchestration) | PASS |
| slop-cleaner | YES | YES (quality) | PASS |
| **paper-reader** | **YES** | **NO** | **FAIL** |

`paper-reader.md` exists in `agents/` but is not assigned to any category in `agent-categories.yml`. It has no skill routing, no ground truth rules, no required hooks.

---

## Check 4: Plugin Manifest Drift

**RESULT: FAIL** (3 issues)

### `.claude-plugin/plugin.json`
| Field | Claims | Actual | Status |
|-------|--------|--------|--------|
| Skills | "76 skills" | 93 skills | **STALE** |
| Agents | "10 agents" | 12 agents | **STALE** |
| Packages | "26 packages" (implied) | 27 packages | **STALE** |

### `.claude-plugin/marketplace.json`
| Field | Claims | Actual | Status |
|-------|--------|--------|--------|
| Description | "57 skills" | 93 skills | **STALE** |
| Description | "10 agents" | 12 agents | **STALE** |

---

## Check 5: Hook Wiring

**RESULT: FAIL** (3 missing hooks)

`agent-categories.yml` requires these hooks per category:

| Hook | Required By | In `settings.json` | Hook File Exists | Status |
|------|------------|-------------------|-----------------|--------|
| gateguard | coding, quality | YES | YES (`run-gateguard.ts`) | PASS |
| config-protection | coding | YES | YES (`run-config-protection.ts`) | PASS |
| scope-restriction | content, operations | NO | YES (`run-scope-enforcer.ts`) | **NOT WIRED** |
| deploy-gate | operations | NO | NO | **MISSING** |
| metrics-gate | growth | NO | NO | **MISSING** |
| budget-enforcer | (SOUL.md) | NO | YES (`run-budget-enforcer.ts`) | **NOT WIRED** |

- `scope-restriction` / `scope-enforcer`: Implementation exists at `packages/hooks/src/run-scope-enforcer.ts` but is NOT registered in `.claude/settings.json` hooks.
- `deploy-gate`: Required by operations category. Neither implementation nor hook wiring exists.
- `metrics-gate`: Required by growth category. Neither implementation nor hook wiring exists.
- `budget-enforcer`: Referenced in SOUL.md as core enforcement. Implementation exists but is NOT wired in settings.json.

---

## Check 6: SOUL.md Accuracy

**RESULT: FAIL** (1 issue)

The "Built so far" line at SOUL.md:82 reads:
> Built so far: Cubic webhook channel, website scaffold, onboarding skill (`/startup-init`) in progress

**Actual state**: 93 skills built, 27 packages with 590+ tests, 12 agents, harness dashboard, full CLI with 12 command groups, Level 5 end-to-end validation passing. The "in progress" label is severely outdated. This section should reflect the current scope.

All other SOUL.md content (worldview, opinions, influences, phases, vocabulary) remains accurate and aligned with the codebase.

---

## Check 7: Skills in Wrong Categories

**RESULT: PASS**

Reviewed all 93 skills against their README category assignments. No miscategorizations found. Design skills are design-related, coding skills are coding-related, etc.

---

## Check 8: Dead Files & Empty Directories

**RESULT: WARNING** (minor)

### Empty Directories
| Path | Risk |
|------|------|
| `test-runs/image-converter/project/` | Empty — likely leftover from test run cleanup |
| `packages/website-template/public/` | Empty — expected for template scaffold |
| `.omc/plans/` | OMC internal — ignore |
| `.omc/state/sessions/` | OMC internal — ignore |

### Stale Planning Docs (20+ `reagan_*` files in root)
These are personal planning docs (per CLAUDE.md naming convention). Not drift — working as intended.

### Git-Tracked Deletions Not Committed
The git status shows many deleted files under `skills/shared/` and `skills/coding/` (old category-based structure). These deletions are staged but not committed, indicating the migration from category-based to flat skills is in progress.

---

## Check 9: Reference Repo Patterns to Adopt

**RESULT: 3 recommendations**

### 1. AGENTS.md index file (from oh-my-claudecode, gstack)
Both oh-my-claudecode and gstack maintain an `AGENTS.md` at repo root that indexes all agents with their capabilities, model, level, and routing rules. We have `agent-categories.yml` but no human-readable agent index.

**Recommendation**: Generate `AGENTS.md` from `agent-categories.yml` + `agents/*.md` frontmatter. Adds discoverability without duplicating data.

### 2. CHANGELOG.md (from gstack, everything-claude-code)
Multiple reference repos maintain structured changelogs. We have none — changes are only tracked via git log.

**Recommendation**: Add `CHANGELOG.md` following Keep a Changelog format. Update on each significant release.

### 3. Plugin skill validation (from anthropic-skills)
The `anthropic-skills` repo has a `spec/` directory with validation schemas for skill format. We have no automated validation that skill SKILL.md files conform to Claude Code plugin format.

**Recommendation**: Add a static eval tier that validates all `skills/*/SKILL.md` files have required frontmatter (name, description, trigger conditions).

---

## Summary

| Check | Result | Issues |
|-------|--------|--------|
| 1. Symlink integrity | FAIL | startup-init is regular file |
| 2. Categories ↔ skills | PASS | Orchestration skills not mapped in YAML |
| 3. Categories ↔ agents | FAIL | paper-reader not in categories |
| 4. Plugin manifest | FAIL | Counts stale (57/76 → 93 skills) |
| 5. Hook wiring | FAIL | 3 required hooks missing/unwired |
| 6. SOUL.md accuracy | FAIL | "Built so far" severely outdated |
| 7. Wrong categories | PASS | — |
| 8. Dead files | WARN | Empty dirs, uncommitted deletions |
| 9. Reference patterns | INFO | 3 patterns to adopt |

**Total: 4 FAIL, 1 WARN, 2 PASS, 2 INFO**
