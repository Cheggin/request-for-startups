# packages/ inventory

This directory is pre-plugin legacy. The plugin surface lives in the repo root (`skills/`, `agents/`, `hooks/`, `chains/`, `commands/`, `.claude-plugin/`). Each subdirectory here is classified below so a future session can delete or port the right ones without hunting.

The stop condition for the current packaging loop is "all legacy-only functionality in packages/ and .harness/ is either ported or deleted". This file is the work ledger for that clause.

## Live — do not delete

These packages are actively wired into the harness or supply the TS source for `hooks/`'s compiled outputs.

- `hooks/` — TS sources for plugin hooks. The compiled output in the repo root's `hooks/` is a bun bundle of these; many are still wired via `.claude/settings.json` for project-local hooks. Cannot retire until every TS hook is either ported to `.claude/hooks/*.mjs` or deleted. **Ported already**: gateguard, skill-chain-enforcer (source lives here, compiled in plugin `hooks/`), completion-signal, validate-commit-msg, validate-issue-create, branch-enforcer, deploy-gate, metrics-gate, config-protection, scope-enforcer, inter-agent-signal. **Not yet ported**: auto-finish (655 lines, touches real git/gh).
- `harness-dashboard/` — Next.js dashboard for the harness itself. Distinct from the plugin; renders harness state, metrics, signals. Keep.
- `cubic-channel/` — Cubic code-review webhook receiver. Referenced from harness signals. Keep.
- `webhook-receiver/` — Universal multi-source webhook receiver. Keep.
- `eval-framework/` — pass@k eval harness. Still referenced by skills/eval-framework. Keep.

## Test-build artifacts — move to `test-runs/` or delete

These are startup builds that the harness produced for validation. Not harness infrastructure. Either move under `test-runs/` or delete.

- `tab-commander-site/` — test startup build. Actively being iterated on as of this classification (commits in the last 3 hours). Do NOT delete yet; confirm with the user first.
- `devin-widmer-site/` — test startup build. Zero commits in the last 30 days; untracked `handoffs/` files from earlier runs are on disk but not tracked. Likely retirable. Confirm with the user that no further work is planned before deleting.
- `website-template/` — prototype for the `website-creation` skill. Skill content long since migrated to `skills/website-creation/`. Candidate for deletion once confirmed no build tooling still imports it.

## Orphans from pre-plugin era — candidates for deletion

These lost their user-facing role when the plugin migration happened (commit 124e850 dropped the CLI layer). They may still import each other, so deletion order matters: delete leaves first.

- `idea-grader/` — one-off scoring experiment.

## Retired

- `cli/` — dropped in commit 124e850; the plugin surface replaced it.
- `status-dashboard/` — retired 2026-04-17; superseded by `harness-dashboard/`.
- `idea-grader/` — tracked tests retired 2026-04-17; implementation files were never committed.
- `research-store/` — retired 2026-04-17; replaced by the `research` skill's persistent knowledge store.
- `secret-manager/` — retired 2026-04-17; `.harness/secrets.env` has always been the authoritative secret store.
- `sentry-integration/` — retired 2026-04-17; replaced by the `error-tracking` skill.
- `task-classifier/` — retired 2026-04-17; experimental harness-tuning module, never wired into production.
- `config-optimizer/` — retired 2026-04-17; experimental harness-tuning module (budget-rate analyzer and recommendations) never wired into production.
- `adaptive-loadout/` — retired 2026-04-17; experimental startup-type → skill-manifest mapper never wired into production.
- `feature-decomposer/` — retired 2026-04-17; codegen experiment (decomposer + dependency graph) whose scope is now owned by the `shape` skill.
- `spec-generator/` — retired 2026-04-17; product-spec codegen experiment whose scope is now owned by the `shape` skill's interview output.
- `api-generator/` — retired 2026-04-17; API-route codegen whose scope is now owned by the `shape` skill + `convex-http-actions` for handler scaffolding.
- `schema-generator/` — retired 2026-04-17; Convex-schema codegen whose scope is now owned by the `convex-schema-validator` skill.
- `commander/` — retired 2026-04-17; orchestrator daemon replaced by the `commander` agent + `startup-init` skill.
- `github-state/` — retired 2026-04-17; replaced by the `github-state-manager` and `issue-creator` skills.
- `implementation-loop/` — retired 2026-04-17; per-feature build cycle replaced by the `autopilot` and `ralph` skills.
- `agent-loop/` — retired 2026-04-17; mode-switching runtime (mode loop, plateau detection, hook runner, self-improve, error classifier, agent loader) replaced by skill chains + `skill-chain-enforcer` hook.
- `repo-setup/` — retired 2026-04-17; scaffold + configure-services + setup-hooks replaced by the `startup-init` skill Phase 1 + Phase 5.
- `service-validator/` — retired 2026-04-17; validate-all + validators library replaced by the startup-init skill's Phase 1 service-connection checks.
- `fixed-boundary/` — retired 2026-04-17; `checkBoundary()` import-boundary + file-write-scope checker absorbed into `.claude/hooks/scope-enforcer.mjs` (which already reads the same `fileScope.writable/readonly/blocked` fields from `.harness/agents/<name>.json`).
- `figma-integration/` — retired 2026-04-17; design generation + screenshot capture + design-system extraction replaced by the figma plugin's skills (`figma:figma-generate-design`, `figma:figma-implement-design`, `figma:figma-generate-library`).
- `knowledge/` — retired 2026-04-17; ingest + query + lint + index-manager replaced by the wiki-* skills (`wiki-add`, `wiki-read`, `wiki-query`, `wiki-ingest`, `wiki-list`, `wiki-lint`, `wiki-delete`).
- `mention-monitor/` — tracked tests retired 2026-04-17; the implementation was never committed (untracked source). The harness-dashboard /mentions page now points users to the `social-intelligence` skill instead of the old bun run command.

## Deletion protocol

For each orphan candidate, a future iteration should:

1. `grep -rnE "(packages/<name>|@harness/<name>|from ['\"].*<name>)" --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=reference --exclude-dir=packages/<name>` to confirm zero imports from live code.
2. `git rm -r packages/<name>` and commit as `chore: retire packages/<name> (orphan from pre-plugin era)`.
3. Re-run `npm run validate` — should stay green (the validator doesn't walk packages/).
