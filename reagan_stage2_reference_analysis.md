# Stage 2: Analytical Deep Dive -- 5 Reference Repos

Source-code-level analysis. Every claim below is backed by reading actual implementation files, not READMEs.

---

## 1. oh-my-claudecode (OMC)

**What it is:** Multi-agent orchestration layer with 19 specialized agents, 35+ skills, and a comprehensive hook system that intercepts every Claude Code lifecycle event.

### ADOPT

**XML agent prompt structure with frontmatter metadata.** Every agent (`agents/*.md`) uses a consistent pattern: YAML frontmatter (`name`, `description`, `model`, `level`, `disallowedTools`) followed by an `<Agent_Prompt>` XML block containing `<Role>`, `<Why_This_Matters>`, `<Success_Criteria>`, `<Constraints>`, `<Investigation_Protocol>`, `<Tool_Usage>`, `<Execution_Policy>`, `<Output_Format>`, `<Failure_Modes_To_Avoid>`, `<Examples>`, `<Final_Checklist>`. This is the best agent prompt structure because it is simultaneously machine-parseable (frontmatter for routing) and LLM-optimized (XML tags for attention). Apply directly -- adopt this exact XML schema for all agent definitions.

**disallowedTools for role enforcement.** `code-reviewer.md` and `architect.md` set `disallowedTools: Write, Edit` in frontmatter, making them structurally read-only. This is better than prompt-based "you must not edit" because the tool is literally unavailable. Apply to any reviewer/auditor agent.

**3-failure circuit breaker.** Both `executor.md` and `debugger.md` enforce: "After 3 failed attempts on the same issue, escalate to architect agent with full context." This prevents infinite retry loops. Apply as a universal agent rule.

### ADAPT

**Hook-enforced keyword detection** (`hooks.json` -> `keyword-detector.mjs` on every `UserPromptSubmit`). OMC intercepts every user message and pattern-matches keywords like "autopilot", "ralph", "ulw" to auto-invoke skills. For our use case, adapt this to detect project-phase keywords (e.g., "plan", "build", "review") rather than skill names, routing to the appropriate workflow phase instead of arbitrary skill invocation.

**Level hierarchy (1-4) for agent tiers.** Agents have `level: 2` (executor) or `level: 3` (architect, reviewer) or `level: 4` (skills like ralph/autopilot). This controls delegation depth. Adapt by simplifying to 3 levels: worker (implements), advisor (reads-only, reviews), orchestrator (coordinates workers).

### REJECT

**Persistent mode / "boulder never stops" pattern.** The `Stop` hook runs `persistent-mode.cjs` which re-injects "The boulder never stops" to prevent Claude from halting during ralph/ultrawork loops. This is clever but fragile -- it fights the model's natural stopping behavior through hook injection rather than structured task decomposition. Prefer explicit continuation tokens in task state over hook-based persistence hacking.

**Skill proliferation (35+ skills).** The sheer number creates a discovery problem. Many skills overlap (`autopilot` vs `ralph` vs `ultrawork` vs `team`). Prefer fewer, composable primitives over many named workflows.

---

## 2. Archon

**What it is:** Remote agentic coding platform (Bun + TypeScript + SQLite/PostgreSQL) with a DAG-based workflow engine, worktree isolation, and multi-provider support (Claude SDK, Codex SDK).

### ADOPT

**Error classification with retry logic.** `executor-shared.ts` defines `FATAL_PATTERNS` (auth errors, 401/403) and `TRANSIENT_PATTERNS` (timeout, rate limit, 429/503) with a `classifyError()` function. Fatal errors fail immediately; transient errors retry with configurable `maxRetries` and `delayMs` per node. This is the best error handling pattern because it prevents wasting retries on unrecoverable errors while recovering from network flakes. The DAG executor defaults to 2 retries with 3s delay. Adopt this three-category classification (FATAL/TRANSIENT/UNKNOWN) with the consecutive-unknown-error threshold (3 consecutive UNKNOWNs = abort).

**Zod schema validation for workflow definitions.** `loader.ts` uses `dagNodeSchema.safeParse(raw)` to validate every workflow node at load time. Schema errors are collected and reported with human-readable paths (`Node 'build': 'retry.maxRetries' Expected number`). Apply to validate any agent/workflow configuration at load time rather than discovering errors at runtime.

### ADAPT

**DAG-based workflow execution.** `dag-executor.ts` runs nodes in topological layers -- independent nodes within a layer execute concurrently via `Promise.allSettled`, with `$nodeId.output` variable substitution between nodes. For our use case, adapt the DAG concept but use a simpler wave-based model (like GSD does) rather than full topological sort, since our workflows are more linear with occasional parallelism.

**Worktree isolation per conversation.** `packages/isolation/` provides `WorktreeProvider` that creates git worktrees per task, enabling parallel development without branch conflicts. Adapt for our multi-agent scenario: each executor agent gets its own worktree, but share a single worktree for sequential tasks to reduce overhead. The factory pattern (`configureIsolation` + singleton `getIsolationProvider`) is clean.

### REJECT

**YAGNI enforcement as a principle rather than a mechanism.** CLAUDE.md states YAGNI/KISS/DRY as engineering principles, but there is no structural enforcement (no hook, no gate, no lint rule). Principles without enforcement are aspirational. Prefer GateGuard-style forced investigation (from ECC) over stated principles.

**Provider abstraction complexity.** The `IAgentProvider` / `IPlatformAdapter` / `IWorkflowStore` / `IIsolationStore` interface stack adds significant indirection for what is currently a 2-provider system (Claude + Codex). Over-abstracted for the current scale.

---

## 3. get-shit-done (GSD)

**What it is:** Phase-based project execution framework with 70+ workflows, structured state management, wave-based parallelism, research gates, and machine-verifiable plan frontmatter.

### ADOPT

**Wave-based parallel execution with dependency analysis.** `execute-phase.md` implements: discover plans -> analyze dependencies -> group into waves -> spawn parallel agents per wave -> checkpoint between waves -> aggregate results. This is the best parallelism model for project work because waves naturally express "these tasks are independent, but must complete before the next batch." The advance guard pattern (wave N+1 prep starts while wave N verifies) optimizes latency.

**4-type gate taxonomy.** `references/gates.md` defines exactly 4 gate types: Pre-flight (block entry if preconditions unmet), Revision (loop back with feedback, bounded by iteration cap with stall detection), Escalation (surface to human), Abort (stop to prevent damage). The selection heuristic is clean: "Start with pre-flight. If after work, revision. If unresolvable, escalate. If dangerous, abort." Adopt this taxonomy verbatim.

**Phase-scoped context loading with adaptive enrichment.** `execute-phase.md` reads `CONTEXT_WINDOW` size and adjusts: >= 500K context gets richer prompts (prior SUMMARY.md files, RESEARCH.md), < 200K gets thinned prompts (~40% less static overhead). This is the best context management pattern because it adapts to the model's capacity rather than assuming one size fits all.

### ADAPT

**Research gate before planning.** `plan-phase.md` integrates: Research (gsd-phase-researcher) -> Plan (gsd-planner) -> Verify (gsd-plan-checker, max 3 revision iterations). Adapt by making the research phase optional but triggered automatically when the phase touches unfamiliar domains, rather than requiring explicit `--research` / `--skip-research` flags.

**Checkpoint system (human-verify 90%, decision 9%, human-action 1%).** `references/checkpoints.md` formalizes exactly when humans must intervene. The golden rule "if Claude CAN automate it, Claude MUST automate it" with auth-gate dynamic checkpoints is excellent. Adapt the checkpoint types but simplify the XML task format to JSON for easier machine parsing.

### REJECT

**70+ workflow files.** The workflow count creates a massive surface area. `do.md` is literally a dispatcher that pattern-matches user intent to route to the correct `/gsd-*` command. This routing layer exists because there are too many entry points. Prefer fewer workflows with parameterized behavior over many specialized workflows.

**Heavy reliance on filesystem state.** STATE.md, ROADMAP.md, REQUIREMENTS.md, PLAN.md, SUMMARY.md, CONTEXT.md, RESEARCH.md, REVIEWS.md per phase creates a complex filesystem protocol. State should be in a single structured file (like Archon's SQLite) rather than scattered markdown files.

---

## 4. everything-claude-code (ECC)

**What it is:** Claude Code plugin with 50+ agents, 150+ skills, comprehensive hook system, GateGuard fact-forcing, continuous learning with confidence scoring, and eval harness with pass@k metrics.

### ADOPT

**GateGuard fact-forcing gate (3-stage: DENY -> FORCE -> ALLOW).** `skills/gateguard/SKILL.md` is the single most impactful quality mechanism across all 5 repos. It blocks the first Edit/Write per file and demands: (1) list ALL importers of this file, (2) list public functions affected, (3) show data file structure, (4) quote the user instruction verbatim. A/B testing shows +2.25 points average improvement. This works because "investigation creates awareness that self-evaluation never did." Adopt the 3-stage gate pattern. The key insight: asking "are you sure?" always gets "yes", but asking "list every file that imports this module" forces actual investigation.

**Continuous learning with confidence scoring.** `skills/continuous-learning-v2/SKILL.md` defines atomic "instincts" (trigger + action + confidence 0.3-0.9 + domain tag + evidence). Hooks capture 100% of tool calls (not probabilistic skill-based observation). Instincts are project-scoped by default (via git remote hash), promoted to global when seen in 2+ projects with confidence >= 0.8. This is the best learning system because it is atomic (one behavior per instinct), evidence-backed, and scope-aware.

### ADAPT

**Eval harness with pass@k metrics.** `skills/eval-harness/SKILL.md` defines eval-driven development: capability evals (can it do X?), regression evals (did we break Y?), with pass@k (at least 1 success in k attempts) and pass^k (all k succeed). Recommended thresholds: pass@3 >= 0.90 for capabilities, pass^3 = 1.00 for release-critical regressions. Adapt by building eval definitions into the plan phase (define pass criteria before coding) rather than as a separate skill invocation.

**3-layer quality gate (pre-tool + post-tool + stop).** The hooks.json implements: PreToolUse gates (gateguard-fact-force, config-protection, block-no-verify, commit-quality), PostToolUse gates (quality-gate, console-warn, design-quality-check, edit-accumulator), Stop gates (batch format+typecheck, check-console-log, evaluate-session, cost-tracker). Adapt by selecting the highest-value gates (gateguard, config-protection, batch-format-at-stop) rather than running all 20+ hooks.

### REJECT

**150+ skills.** The skill count is unmanageable. Skills range from essential (`gateguard`, `continuous-learning-v2`) to hyper-niche (`carrier-relationship-management`, `customs-trade-compliance`, `visa-doc-translate`). Most users will never need 95% of these. This is a marketplace problem, not a framework problem.

**Inline Stop hook scripts.** The `hooks.json` Stop hooks contain 30+ line inline Node.js scripts that resolve plugin root paths through 6+ fallback locations. This is brittle, hard to debug, and impossible to test in isolation. Hooks should reference script files, not inline code.

---

## 5. multica

**What it is:** AI-native task management platform (Linear-like) with agents as first-class assignees. Go backend + monorepo frontend (pnpm workspaces + Turborepo).

### ADOPT

**No-duplication rule with decision tree.** `CLAUDE.md` enforces: (1) Does it depend on Next.js/Electron APIs? Keep in app. (2) Does it depend on `next/navigation` or `react-router-dom`? Keep in app's `platform/` layer. (3) Everything else belongs in `packages/core/` or `packages/views/`. This 3-question decision tree eliminates ambiguity about where code lives. Adopt this pattern for any monorepo: define hard package boundaries with a simple decision tree, not vague guidelines.

**React Query + Zustand strict split.** "TanStack Query owns all server state. Zustand owns all client state." With hard rules: never duplicate server data into Zustand, WS events invalidate queries (never write to stores directly), mutations are optimistic by default. This is the best state management pattern for real-time apps because it creates a single source of truth for each state category.

### ADAPT

**Agents as team assignees (polymorphic assignee model).** `assignee_type` + `assignee_id` on issues allows both human members and AI agents to be assigned work. Agents render with distinct styling (purple background, robot icon). Adapt for our system: treat agent task assignments as first-class entities with the same status tracking as human tasks, enabling unified dashboards.

**Worktree isolation with shared PostgreSQL.** Each git worktree gets its own database name and unique ports via `.env.worktree`, sharing a single PostgreSQL container. `make dev` auto-detects worktrees. Adapt the auto-detection pattern but use SQLite per worktree (simpler than managing PG database-per-worktree) for development scenarios.

### REJECT

**Internal Packages pattern (no pre-compilation).** All shared packages export raw `.ts`/`.tsx` files, relying on the consuming app's bundler. While this gives "zero-config HMR and instant go-to-definition", it couples all packages to the consuming bundler's TypeScript config and creates implicit build dependencies. For a 2-app monorepo this is fine; for a larger ecosystem, prefer explicit package builds.

**pnpm catalog for version pinning.** `pnpm-workspace.yaml` defines `catalog:` references for shared deps. This is a pnpm-specific pattern that doesn't transfer to other package managers and adds cognitive overhead for contributors unfamiliar with the catalog concept.

---

## Cross-Repo Synthesis: Top Mechanisms to Adopt

| Rank | Mechanism | Source | Why Best-in-Class |
|------|-----------|--------|-------------------|
| 1 | GateGuard 3-stage fact-forcing | ECC | Only mechanism with A/B evidence (+2.25 pts). Forces investigation, not self-evaluation. |
| 2 | 4-type gate taxonomy | GSD | Clean, complete, with selection heuristic. Every validation maps to exactly one type. |
| 3 | Error classification (FATAL/TRANSIENT/UNKNOWN) | Archon | Prevents wasting retries on unrecoverable errors. 3-consecutive-unknown abort is smart. |
| 4 | XML agent prompt structure with disallowedTools | OMC | Machine-parseable frontmatter + LLM-optimized XML. disallowedTools is structural enforcement. |
| 5 | Wave-based parallel execution | GSD | Natural parallelism model for project work. Advance guard optimizes latency. |
| 6 | Continuous learning with confidence scoring | ECC | Atomic instincts, project-scoped, evidence-backed, auto-promotion at 0.8+ in 2+ projects. |
| 7 | 3-failure circuit breaker | OMC | Universal anti-infinite-loop. Simple, effective, widely applicable. |
| 8 | Adaptive context loading by window size | GSD | Adapts to model capacity. Rich prompts for 1M, thinned for 200K. |
| 9 | No-duplication decision tree | multica | 3-question tree eliminates where-does-this-go ambiguity in monorepos. |
| 10 | React Query + Zustand strict split | multica | Single source of truth per state category. Hard rules prevent drift. |
