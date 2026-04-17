---
name: issue-creator
description: Turn a one-line request into a schema-compliant GitHub issue draft or creation command. Use when the user gives a short bug report, feature request, refactor idea, or task summary and wants a normalized issue with title, type, severity, description, acceptance criteria, and verification steps.
user-invocable: true
argument-hint: "<one-line task description>"
group: orchestration
prerequisites: []
next: [github-state-manager]
workflows: [incident-response, ship-feature]
---

# Issue Creator

Turn a short request into a valid GitHub issue for this repo.

## Source Of Truth

Before drafting or creating an issue, read these files:

1. `.harness/issue-schema.md`
2. `.github/ISSUE_TEMPLATE/feature.yml`
3. `.github/ISSUE_TEMPLATE/bug.yml`

If you will actually run `gh issue create` or validate a command, also read:

4. `.claude/hooks/validate-issue-create.mjs`

Do not rely on memory. When sources disagree, use this precedence:

1. `.claude/hooks/validate-issue-create.mjs` for what the CLI hook will accept
2. `.harness/issue-schema.md` for the normalized body shape
3. `.github/ISSUE_TEMPLATE/*.yml` for wording and field intent

Important:

- The validator is the final authority for posted issues.
- Use lowercase title prefixes such as `[feat]`, `[fix]`, `[docs]`.
- Default to returning a draft. Only post with `gh issue create` when the user explicitly asks you to create the issue on GitHub.

## Goal

Given a one-liner, produce either:

- a ready-to-post issue draft, or
- a `gh issue create` command that passes the local issue validator

The output must be specific enough that another agent can pick it up without additional clarification.

## Workflow

### 1. Normalize the request

- Extract the single core change.
- If the one-liner bundles unrelated work, split it into multiple issues instead of forcing one large ticket.
- Preserve the user’s actual outcome. Do not invent implementation details unless they are needed to make acceptance criteria testable.
- Keep the issue outcome-focused. Translate vague wording into a concrete repo change, not a design document.

### 2. Do a minimal repo scan when it helps

- If the one-liner names a package, skill, command, hook, or feature, confirm the path with a quick repo scan before writing the issue.
- Use the scan to improve `Affected Packages`, title wording, estimate, and agent category.
- If the scope is still unclear after a quick scan, write `TBD after repo scan` instead of guessing.
- Do not stop to ask clarifying questions when a short scan can resolve the ambiguity.

### 3. Infer the required fields

#### Type

Choose exactly one:

- `fix`: broken behavior, incorrect output, failure, regression, flaky behavior
- `feat`: new capability, new workflow, new surface area
- `refactor`: internal cleanup without changing external behavior
- `test`: missing or improved automated coverage
- `docs`: documentation-only work
- `chore`: maintenance, cleanup, dependency or housekeeping work
- `perf`: performance improvement
- `ci`: pipeline, automation, or workflow config changes

When in doubt:

- behavior is wrong -> `fix`
- behavior is missing -> `feat`
- only wording/docs change -> `docs`
- only infra/tooling change -> `ci` or `chore`

#### Severity

Choose one:

- `P0`: system broken, blocks all work, deploy/build/data-loss level problem
- `P1`: feature broken or output unusable, but there is a workaround
- `P2`: enhancement, missing guardrail, quality improvement, normal bug with limited blast radius
- `P3`: low-impact polish, docs, or nice-to-have cleanup

Safe default: `P2`.

Never use `P0` or `P1` unless the one-liner clearly describes breakage.

#### Affected Packages

- Infer concrete paths when they are obvious from the request and repo structure.
- If the scope is unclear, keep the section but say `TBD after repo scan`.

#### Estimate

Use a rough size:

- `XS`: tiny copy or config tweak
- `S`: localized change in one area
- `M`: several related files or one new skill/workflow
- `L`: cross-package or multi-surface change
- `XL`: large multi-phase effort that likely should be split

If the request looks `XL`, prefer splitting into multiple issues.

#### Agent Category

Choose the primary owner:

- `coding`: product code, skills, packages, hooks, agents
- `content`: docs, copy, content artifacts
- `growth`: marketing, SEO, analytics, acquisition
- `operations`: deploy, infra, CI, monitoring, dependency upkeep
- `orchestration`: harness flow, coordination, state management
- `quality`: tests, evals, audits, validation

### 4. Write the issue

Use this exact structure:

```md
## Type
<type>

## Severity
<P0|P1|P2|P3>

## Description
<what needs to change and why; focus on outcome, not implementation trivia>

## Affected Packages
<comma-separated paths or TBD after repo scan>

## Acceptance Criteria
- [ ] <machine-verifiable outcome 1>
- [ ] <machine-verifiable outcome 2>
- [ ] <machine-verifiable outcome 3>

## Verification Steps
1. <step that proves criterion 1>
2. <step that proves criterion 2>
3. <step that proves criterion 3>

## Estimate
<XS|S|M|L|XL>

## Agent Category
<coding|content|growth|operations|orchestration|quality>
```

Use this title format exactly:

```text
[type] Imperative summary
```

Example:

```text
[feat] Add issue-creator skill for normalized GitHub tickets
```

When the one-liner describes a bug:

- keep `## Type` as `fix`
- use `## Description` to capture both the broken behavior and the expected outcome
- do not add extra sections that the validator does not require unless the user explicitly wants them

## Acceptance Criteria Rules

Every checkbox must be testable by another agent. Good criteria mention observable outcomes such as:

- file exists
- command passes
- validator accepts input
- output matches schema
- docs mention the new workflow

Avoid vague criteria such as:

- looks good
- is intuitive
- works better
- handles edge cases

### 5. Return a draft by default

If the user asked for a draft, return:

- the final title on its own line
- a blank line
- the full issue body in markdown

Do not call GitHub unless the user explicitly asked you to post the issue.

### 6. Create the issue when requested

If the user wants the issue posted, use `gh issue create` with a heredoc body so the local hook can parse it reliably.

The current validator accepts either `<<EOF` or `<<'EOF'`. Prefer `<<EOF` for consistency with the examples below.

```bash
gh issue create \
  --title "[type] Imperative summary" \
  --body "$(cat <<EOF
## Type
type

## Severity
P2

## Description
...

## Affected Packages
...

## Acceptance Criteria
- [ ] ...

## Verification Steps
1. ...

## Estimate
M

## Agent Category
coding
EOF
)"
```

## Final Checks

Before you finish, verify:

- title starts with `[type]`
- type is one of the allowed schema values
- severity is `P0` through `P3`
- body includes `## Description`
- body includes `## Acceptance Criteria`
- acceptance criteria include at least one checkbox
- body includes `## Verification Steps`
- estimate and agent category are present unless the user explicitly asked for a reduced draft
- the issue represents one logical change

## Anti-Patterns

- Turning a one-liner into a full design doc
- Asking for clarification before doing an obvious repo scan
- Writing implementation tasks instead of outcome-based acceptance criteria
- Marking enhancements as `P0` or `P1`
- Bundling multiple unrelated requests into one issue
- Omitting verification steps because “the acceptance criteria are enough”
- Posting with `gh issue create` before checking the local validator shape
