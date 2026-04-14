# Issue Creation Schema

Normalized format for all GitHub Issues created by agents or humans.

## Required Fields

| Field | Format | Description |
|-------|--------|-------------|
| **Title** | `[TYPE] Short imperative description` | e.g., `[feat] Add commit message validation hook` |
| **Type** | `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci` | Matches commit types |
| **Severity** | `P0`, `P1`, `P2`, `P3` | See severity matrix below |
| **Description** | Markdown paragraph | What and why — not how |
| **Acceptance Criteria** | Checklist | Machine-verifiable conditions for done |
| **Verification** | Checklist | How to confirm the criteria are met |

## Optional Fields

| Field | Format | Description |
|-------|--------|-------------|
| **Affected Packages** | Comma-separated | Which packages/skills this touches |
| **Blocked By** | Issue references | Dependencies that must close first |
| **Estimate** | `XS`, `S`, `M`, `L`, `XL` | Rough size (XS = <30min, XL = >1 day) |
| **Agent Category** | `coding`, `content`, `growth`, `operations`, `orchestration`, `quality` | Which agent type should handle this |

## Severity Matrix

| Level | Meaning | Response | Examples |
|-------|---------|----------|----------|
| **P0** | System broken, blocking all work | Fix immediately, drop everything | Build fails, deploy down, data loss |
| **P1** | Feature broken, workaround exists | Fix within current session | Test flaky, skill not loading, wrong output |
| **P2** | Enhancement, improves quality | Schedule in next batch | Refactor, add missing test, improve logging |
| **P3** | Nice to have, low impact | Backlog | Docs improvement, style fix, minor UX tweak |

## Issue Body Template

```markdown
## Type
<!-- feat | fix | refactor | test | docs | chore | perf | ci -->

## Severity
<!-- P0 | P1 | P2 | P3 -->

## Description
<!-- What needs to change and why. Link to relevant code or prior issues. -->

## Affected Packages
<!-- e.g., packages/hooks, skills/verify -->

## Acceptance Criteria
- [ ] Criterion 1 (machine-verifiable)
- [ ] Criterion 2
- [ ] Criterion 3

## Verification Steps
1. Step to verify criterion 1
2. Step to verify criterion 2
3. Step to verify criterion 3

## Estimate
<!-- XS | S | M | L | XL -->
```

## Labels

Issues should be labeled with:
- Type label: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
- Severity label: `P0`, `P1`, `P2`, `P3`
- Agent category label (optional): `coding`, `content`, `growth`, `operations`

## Rules

1. Every issue MUST have type, severity, description, and acceptance criteria
2. Acceptance criteria MUST be machine-verifiable (not "looks good" — use "tests pass", "build succeeds", "output matches X")
3. One issue per logical change — don't bundle unrelated work
4. Link to blocking issues with `Blocked by #N`
5. Close issues with a commit that references them: `fix(hooks): validate commit messages, closes #42`
