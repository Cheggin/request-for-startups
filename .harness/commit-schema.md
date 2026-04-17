# Commit Message Schema

Based on [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/).

## Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

## Types

| Type | When | SemVer |
|------|------|--------|
| `feat` | New feature or capability | MINOR |
| `fix` | Bug fix | PATCH |
| `docs` | Documentation only | — |
| `style` | Formatting, whitespace, semicolons (no logic change) | — |
| `refactor` | Code change that neither fixes a bug nor adds a feature | — |
| `perf` | Performance improvement | — |
| `test` | Adding or fixing tests | — |
| `build` | Build system or external dependencies | — |
| `ci` | CI/CD configuration | — |
| `chore` | Maintenance, tooling, config (no production code change) | — |
| `revert` | Reverts a previous commit | — |

## Scopes

Scope maps to the area of the codebase changed. Use the most specific scope that applies:

| Scope | Area |
|-------|------|
| `agent-loop` | packages/agent-loop |
| `cli` | packages/cli |
| `commander` | packages/commander |
| `hooks` | packages/hooks |
| `github-state` | packages/github-state |
| `eval` | packages/eval-framework |
| `impl-loop` | packages/implementation-loop |
| `spec` | packages/spec-generator |
| `knowledge` | packages/knowledge |
| `repo-setup` | packages/repo-setup |
| `services` | packages/service-validator |
| `webhook` | packages/webhook-receiver |
| `boundary` | packages/fixed-boundary |
| `cubic` | packages/cubic-channel |
| `dashboard` | packages/harness-dashboard |
| `skills` | skills/ (any skill change) |
| `agents` | agents/ (any agent definition) |
| `harness` | .harness/ config |
| `plugin` | .claude-plugin/ |
| `readme` | README.md, SOUL.md |
| `templates` | templates/ |

Multiple scopes: use the primary one. If truly cross-cutting, omit scope.

## Breaking Changes

Two ways to signal:

1. **`!` after scope**: `feat(cli)!: remove --legacy flag`
2. **Footer**: `BREAKING CHANGE: --legacy flag removed, use --modern instead`

Both trigger a MAJOR version bump.

## Rules

1. Type is **required** and lowercase
2. Scope is **optional** but encouraged
3. Description is **required**, lowercase first letter, no period at end, imperative mood ("add" not "added")
4. Body wraps at 100 characters per line
5. Footer tokens use `-` for spaces (e.g., `Reviewed-by:`)
6. Max subject line: 72 characters (type + scope + description)

## Examples

```
feat(skills): add startup-init to plugin cache

fix(hooks): prevent config-protection from blocking read-only access

docs(readme): update skill count to 93

refactor(agent-loop): extract mode-switching into separate module

test(eval): add pass@k metric for reliability scoring

chore(plugin): sync marketplace name with known_marketplaces

feat(cli)!: replace harness init with interactive wizard

BREAKING CHANGE: harness init now requires --type flag
```
