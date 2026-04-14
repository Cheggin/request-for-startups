# Reference Repo Deep Dive: Adopt / Adapt / Reject

---

## 1. oh-my-claudecode (OMC)

**What it is:** Multi-agent orchestration plugin with 19 specialized agents, ~30 skills, full hook lifecycle, and persistent state via `.omc/` directory.

### ADOPT

- **Agent role separation with `disallowedTools`** -- Architect is READ-ONLY (`disallowedTools: Write, Edit`), Executor has write access. This is the best enforcement pattern because it uses Claude Code's native permission system rather than prompt-only guardrails. Apply to our harness: define agent roles with hard tool restrictions in frontmatter, not just instructions.
- **Commit trailers for decision context** -- `Constraint:`, `Rejected:`, `Directive:`, `Confidence:`, `Scope-risk:` trailers on every commit. This is the best commit protocol across all 5 repos because it preserves WHY decisions were made, not just WHAT changed. Directly adoptable.
- **SubagentStart/SubagentStop hooks with deliverable verification** -- `verify-deliverables.mjs` runs on SubagentStop. Only OMC does this. Catches agents that claim completion without evidence.

### ADAPT

- **PRD-driven persistence loop (Ralph skill)** -- `prd.json` with user stories, `passes: true/false` tracking, and progress.txt across iterations. The mechanism is right (structured acceptance criteria), but Ralph's 5-retry/3-same-error thresholds are hardcoded. Our harness needs configurable thresholds per task complexity tier.
- **Model routing (haiku/sonnet/opus)** -- Good idea, but OMC's routing is mostly prompt-instructed ("use haiku for quick lookups"). Our harness should make this declarative in the agent definition frontmatter with cost budgets.

### REJECT

- **19 agents with fine-grained role separation** -- analyst, planner, critic, architect, executor, verifier, tracer, scientist, etc. This is over-engineered. Most tasks need 3 roles max: planner, executor, reviewer. The role explosion creates routing confusion and prompt overhead.
- **Keyword-trigger skill detection** via `keyword-detector.mjs` on every UserPromptSubmit. Brittle magic -- "autopilot" triggers autopilot, "ralph" triggers ralph, "ulw" triggers ultrawork. Our harness should use explicit invocation, not keyword sniffing.
- **`.omc/` state sprawl** -- state/, sessions/, notepad.md, project-memory.json, plans/, research/, logs/. Too many persistence surfaces. A single state file with namespaced sections is more maintainable.

---

## 2. Archon

**What it is:** Remote agentic coding platform (Slack/Telegram/GitHub). Monorepo with Bun + TypeScript. The `.archon/` directory contains a DAG-based workflow engine with YAML-defined node graphs.

### ADOPT

- **DAG workflow definitions in YAML** -- `archon-adversarial-dev.yaml` defines nodes with `id`, `prompt`, `allowed_tools`, and implicit dependencies. This is the best workflow authoring format across all 5 repos. Declarative, versionable, and the node structure maps cleanly to parallel execution. Our harness should use this format.
- **Per-node hook injection** -- The `archon-architect.yaml` workflow shows PostToolUse hooks scoped to specific nodes ("lint after write on generator node, self-review on evaluator node"). Different trust levels per node. Directly adoptable for our harness's quality gates.
- **CLAUDE.md as engineering constraints, not aspirations** -- Archon's CLAUDE.md has the best engineering principles section: KISS, YAGNI, DRY+Rule-of-Three, Fail-Fast, all stated as implementation constraints with concrete examples. Not slogans. Copy this structure.

### ADAPT

- **Command library (36 default commands)** -- `archon-create-plan.md`, `archon-implement.md`, `archon-validate.md` form a plan-implement-validate pipeline. Each command has phased checkpoints (`PHASE_N_CHECKPOINT`). The phase structure is excellent, but the commands are too monolithic (archon-implement.md is 478 lines). Our harness should break these into composable phases of ~100 lines each.
- **`$ARTIFACTS_DIR` and `$WORKFLOW_ID` variables** -- Commands reference these for state passing between workflow steps. Good pattern, but needs a formal contract for what each variable contains.

### REJECT

- **Provider abstraction for Claude/Codex** -- `packages/providers/` abstracts across AI providers. For a startup harness focused on Claude Code, this is YAGNI. We should couple directly to Claude Code SDK.
- **E2E workflow YAML tests** (e2e-all-nodes.yaml, e2e-claude-smoke.yaml) -- Testing workflows by running them end-to-end is expensive and flaky. Our harness should test at the node level with mocked inputs/outputs.

---

## 3. get-shit-done (GSD)

**What it is:** A TypeScript SDK that wraps Claude Code with a state machine (`PhaseRunner`) driving discuss -> research -> plan -> execute -> verify -> advance. Has 31 agents, hooks, and a `.planning/` state directory.

### ADOPT

- **PhaseRunner as a typed state machine** -- `phase-runner.ts` is the best execution engine across all 5 repos. It has: typed step results (`PhaseStepResult`), human gate callbacks (`HumanGateCallbacks`), event emission (`GSDEventStream`), and config-driven step skipping. This is a real SDK, not just markdown instructions. Our harness should build its core loop on this pattern.
- **Plan types with `must_haves` contract** -- `types.ts` defines `MustHaveArtifact` (path, provides, min_lines, exports, contains) and `MustHaveKeyLink` (from, to, via, pattern). This is the best acceptance criteria format because it is machine-verifiable. Directly adoptable.
- **Soft workflow guard hook** -- `gsd-workflow-guard.js` detects edits outside a GSD workflow and injects an advisory warning (not a block). This is the right trust level for a developer tool -- nudge, don't block. Adopt this pattern for our harness.

### ADAPT

- **Research gate** -- `research-gate.ts` + `checkResearchGate()` gates execution on whether research has been done. Good concept, but GSD's implementation couples it to the phase runner. Our harness should make research gates a configurable middleware, not a hardcoded step.
- **Context engine with truncation** -- `context-engine.ts` + `context-truncation.ts` manage context window budgets. Necessary for long-running tasks, but GSD's implementation is specific to their prompt format. We need a generic version.

### REJECT

- **31 agents with `gsd-` prefix on everything** -- gsd-executor, gsd-planner, gsd-verifier, gsd-debugger, gsd-code-reviewer, gsd-ui-auditor, gsd-nyquist-auditor (!). Same over-engineering problem as OMC. The "nyquist auditor" is a real tell -- this is scope creep disguised as thoroughness.
- **`.planning/` directory separate from `.claude/`** -- Creates confusion about where state lives. Our harness should use `.claude/harness/` to stay within Claude Code's native convention.

---

## 4. everything-claude-code (ECC)

**What it is:** Claude Code plugin -- 34+ skills, extensive hooks, command library, rules system, and an eval harness. Distributed as a marketplace plugin.

### ADOPT

- **`run-with-flags.js` hook runner with profiles** -- The best hook management system across all 5 repos. Hooks declare which profiles they belong to (`"minimal,standard,strict"`), and `ECC_HOOK_PROFILE` env var controls which run. `ECC_DISABLED_HOOKS` disables individual hooks by ID. Our harness needs this exact mechanism.
- **Eval harness skill with pass@k metrics** -- `eval-harness/SKILL.md` defines capability evals, regression evals, and three grader types (code-based, model-based, human). `pass@k` (at least one success in k attempts) and `pass^k` (all k succeed) metrics. This is the right eval framework for agent reliability. Adopt the metric definitions and grader taxonomy.
- **Config protection hook** -- `config-protection.js` blocks modifications to linter/formatter config files, steering the agent to fix code instead of weakening configs. This is a brilliant guardrail that prevents a common agent failure mode. Directly adoptable.

### ADAPT

- **Stop hooks for batched format+typecheck** -- `stop:format-typecheck` accumulates edited files during a response and runs format+typecheck once at Stop instead of after every Edit. Smart optimization, but the inline Node.js bootstrap code in hooks.json is horrific (400+ char single-line scripts for plugin root discovery). Our harness should use the same batch-at-stop strategy with a clean runner script.
- **Governance capture** -- `governance-capture.js` on both Pre and PostToolUse captures secrets, policy violations, and approval requests. Good for enterprise, but needs to be opt-in and lightweight for startup use.

### REJECT

- **34+ skills covering every possible domain** -- android-clean-architecture, investor-materials, video-editing, x-api, fal-ai-media. This is a skill marketplace, not a focused harness. Most skills are thin wrappers around prompts. Our harness should ship with 5-7 core skills and a skill creation mechanism.
- **Fact-forcing gate (`gateguard-fact-force.js`)** -- Blocks first Edit/Write per file and demands investigation. Sounds safe but in practice creates friction that makes the agent slower without proportional quality gain. We should use targeted guards (config protection) not blanket gates.

---

## 5. Multica

**What it is:** AI-native task management platform (Linear competitor). Go backend + pnpm monorepo frontend. Agents are first-class assignees on issues.

### ADOPT

- **CLAUDE.md as the single source of truth for architecture** -- The best CLAUDE.md across all 5 repos. Hard rules for package boundaries (`packages/core/` = zero react-dom, `packages/ui/` = zero business logic), state management rules (TanStack Query owns server state, Zustand owns client state, WS events invalidate queries never stores), and explicit "footguns to avoid" sections. Our harness's CLAUDE.md should follow this structure: hard constraints with rationale, not guidelines.
- **Worktree-per-conversation isolation** -- Each agent conversation gets its own git worktree with its own database. `make dev` auto-detects worktrees. This is the best parallel development pattern because it eliminates branch conflicts entirely. Our harness should adopt worktree isolation for concurrent agent tasks.
- **AGENTS.md as a thin pointer to CLAUDE.md** -- Multica's AGENTS.md is 48 lines that say "read CLAUDE.md." This is correct -- one source of truth, not two competing instruction files.

### ADAPT

- **`make check` as single verification command** -- Runs typecheck, unit tests, Go tests, E2E. Simple and right, but our harness needs structured output (JSON) from verification, not just exit codes, so we can feed results back into the agent loop.
- **Package boundary rules as hard constraints** -- The dependency direction rules (`views/ -> core/ + ui/`, never the reverse) should be enforced by our harness via import analysis hooks, not just documented.

### REJECT

- **No agent orchestration layer** -- Multica is an application that uses agents, not an agent framework. There is no reusable orchestration pattern to extract. The value is in the CLAUDE.md discipline, not the architecture.
- **Go + TypeScript split** -- Adds operational complexity. For a startup harness, pick one language for the entire stack.

---

## Summary: Top 5 Patterns to Build Into Our Harness

| Priority | Pattern | Source | Mechanism |
|----------|---------|--------|-----------|
| 1 | DAG workflow definitions in YAML with per-node hooks | Archon | `.harness/workflows/*.yaml` with node-scoped tool permissions and hooks |
| 2 | Typed state machine execution engine | GSD | PhaseRunner pattern with typed step results, event streams, human gates |
| 3 | Hook profiles with runtime gating | ECC | `run-with-flags.js` pattern -- minimal/standard/strict profiles, per-hook disable |
| 4 | Machine-verifiable acceptance criteria | GSD | `must_haves` with artifact paths, exports, contains patterns |
| 5 | Agent roles with hard tool restrictions | OMC | `disallowedTools` in agent frontmatter, not prompt-only guardrails |
