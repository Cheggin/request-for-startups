# Multi-Agent Startup Harness: Comprehensive Pattern Analysis

**Date:** 2026-04-13
**Sources:** 12 reference repos + 3 Anthropic articles
**Method:** Parallel deep source-code analysis (5 scientist agents), cross-validated by synthesis agent

---

## Executive Summary

Analysis of 12 reference repositories and 3 Anthropic engineering articles reveals a converging set of patterns for building reliable 24/7 multi-agent systems. The single most important finding across all sources: **mechanical enforcement over LLM compliance**. Every system that works at scale enforces invariants through hooks, tool restrictions, and budget limits — never through prompt instructions alone. Prompts tell agents what to do. Hooks ensure they cannot do what they must not.

The second universal finding: **start single-agent, add multi-agent only when justified.** Every repo that tried multi-agent coordination made it optional or suppressed it for small tasks. The coordination overhead of multi-agent systems is real and must be earned.

---

## Table of Contents

1. [Per-Repo Analysis](#per-repo-analysis)
2. [Anthropic Articles Analysis](#anthropic-articles-analysis)
3. [Synthesized Pattern Catalog](#synthesized-pattern-catalog)
4. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
5. [Recommended Architecture](#recommended-architecture)
6. [Implementation Priority](#implementation-priority)

---

## Per-Repo Analysis

### 1. autoagent

| Dimension | Finding |
|---|---|
| **Architecture** | Fixed/editable boundary — `FIXED ADAPTER BOUNDARY` comment splits infrastructure (frozen) from harness code (agent-modifiable). Two variants: host-side orchestrator (OpenAI SDK) and container-side (Claude SDK in Docker). |
| **Orchestration** | Single-agent loop with `Runner.run(agent, input, max_turns=MAX_TURNS)`. No parallelism in baseline. Sub-agent verifier pattern designed but not implemented. Meta-agent (Claude Code externally) iterates on `agent.py` between runs. |
| **Quality** | ATIF trajectory serialization (structured JSON: steps, tool_calls, observations). Keep/discard binary decision: improved → keep; simpler at equal perf → keep; otherwise discard. Explicit failure taxonomy: misunderstanding, missing capability, weak info gathering, bad strategy, missing verification, silent failure. |
| **State** | Stateless per-task. `results.tsv` ledger (untracked by git) is only cross-run state. `AgentContext` carries token counts. |
| **Context** | MAX_TURNS=30 hard cutoff. No pruning. Instruction file uploaded to container for re-reading (`cat /task/instruction.md`) instead of relying on context window. |
| **Best Practices** | Hard fixed/editable boundary; trajectory serialization for debugging; simplicity criterion ("equal perf + simpler = keep"); overfitting test ("if this task disappeared, would this still help?"); NEVER STOP directive for autonomous loops. |

### 2. autoresearch

| Dimension | Finding |
|---|---|
| **Architecture** | Single-file experiment loop. `train.py` (editable) vs `prepare.py` (frozen infrastructure). Fixed/editable enforced across files. |
| **Orchestration** | Meta-agent (Claude Code) runs strict loop: modify → commit → run → grep results → keep or reset. One experiment, one variable at a time. |
| **Quality** | Fixed BPB metric on pinned validation shard. Fast-fail on NaN/divergence. Time-budgeted training (5 min) makes experiments hardware-agnostic. |
| **State** | `results.tsv` ledger. Branch `autoresearch/<tag>` accumulates only kept commits. |
| **Context** | N/A (ML training, not agent context). |
| **Best Practices** | Time-budgeted (not step-budgeted) experiments; fixed pinned eval data; BPB as vocab-independent metric; simplicity criterion explicit. |

### 3. ui-loop

| Dimension | Finding |
|---|---|
| **Architecture** | Skill-based autonomous loop running entirely as Claude Code skills. State lives in `.ui-loop/` directory (todos.md, progress.md, spec.md). File-system-as-state — all coordination through structured markdown. |
| **Orchestration** | Single-agent with 6 named thinking modes: Orchestrator, Build, QA, Auditor, Page Planner, Design Spec. Explicit role-switching via prompt, not separate agents. Mandatory clarification phase (Phase 0) before writing code. |
| **Quality** | Screenshots as primary quality signal — visual verification mandatory. Three loop-control detectors: plateau (<3% gain for 4 iterations), stuck (<5% for 2 iterations), repetition (same change 3x). Verifiable exit conditions required. |
| **State** | Three markdown files: spec.md (written once), todos.md (live DAG with status), progress.md (append-only log). Git commits as checkpoints after every completed todo. |
| **Context** | SessionStart hook re-injects CLAUDE.md on startup/resume/clear/compact. Spec and todos re-read at every ORIENT step. File system as external memory surviving context resets. |
| **Best Practices** | Named thinking modes over multiple agents; mandatory clarification gate; scope isolation per todo (one file boundary); hook-based context re-injection; breadth-over-depth rule; verifiable exit conditions. |

### 4. gstack

| Dimension | Finding |
|---|---|
| **Architecture** | Daemon-backed tool server with markdown skill orchestration. CLI compiled as single Bun binary (~58MB). Skills are SKILL.md files that give Claude specialized roles. `$B` CLI commands POST to localhost daemon → persistent Chromium via CDP/Playwright. |
| **Orchestration** | Skill-file-based specialization. No dynamic spawning. Multi-agent cross-checking via `{{CODEX_PLAN_REVIEW}}` template placeholders. ELI16 mode when 3+ sessions run concurrently. Post-session reflection writes learnings to project JSONL. |
| **Quality** | 3-tier test pyramid: Static (parse commands, free), E2E (spawn `claude -p`, ~$3.85), LLM-as-judge (Sonnet scoring, ~$0.15). Diff-based test selection — each E2E test declares file dependencies. `gate` (CI blocks) vs `periodic` (weekly cron) classification. Machine-readable diagnostics: exit_reason, timeout_at_turn, last_tool_call. |
| **State** | Daemon state file (`.gstack/browse.json`) with atomic writes (tmp+rename). Ref system (in-memory Map, invalidated on framenavigated). Operational learnings in project-local JSONL. |
| **Context** | Template-driven doc generation (never at runtime). Ring buffers for logs (50K entries, async flush). Plain text output over MCP (no JSON schema overhead). |
| **Best Practices** | Compiled binary distribution; errors as agent instructions (actionable, no raw stacks); version auto-restart (embedded git SHA); atomic state writes; diff-based eval selection; "Search Before Building" philosophy. |

### 5. pi-mono (`packages/agent`)

| Dimension | Finding |
|---|---|
| **Architecture** | Low-level event-streaming agent loop as a pure library. Provider-agnostic. Two-layer: pure async functions (`runAgentLoop`) + stateful `Agent` class wrapper. |
| **Orchestration** | Two-queue steering: `steeringQueue` (mid-turn injection) vs `followUpQueue` (post-stop injection). Queue modes: `"all"` (drain all) or `"one-at-a-time"`. Parallel tool execution by default, sequential available as config. |
| **Quality** | `beforeToolCall` (blocking gate) / `afterToolCall` (result override) hooks. Clean separation: tools do work, hooks validate. |
| **State** | Immutable snapshot pattern. `createContextSnapshot()` copies messages and tools before each loop. Set accessors copy arrays. AbortController per run. |
| **Context** | `transformContext` hook prunes at semantic level (AgentMessages). `convertToLlm` hook transforms at protocol level (AgentMessage → LLM Message). Custom message types exist in transcript but never reach model. |
| **Best Practices** | Separate AgentMessage from LLM Message; two-queue orchestration; snapshot pattern for loop safety; configurable parallel vs sequential tool execution; dynamic API key resolution via callback. |

### 6. oh-my-claudecode (OMC)

| Dimension | Finding |
|---|---|
| **Architecture** | In-process MCP server (`createSdkMcpServer`, name `"t"`) as tool bus bundling 12 LSP tools, AST tools, python_repl, state/notepad/memory/wiki tools. 19 specialized agents in registry. 400-line orchestrator system prompt. |
| **Orchestration** | 19 agents across 4 lanes (Build/Analysis, Review, Domain Specialists, Coordination). Magic keyword processor with informational context detection. Task-size detection suppresses heavy orchestration on small tasks. Background task concurrency limit (max 5). |
| **Quality** | Continuation enforcement ("THE BOULDER NEVER STOPS"). 5 execution modes (autopilot, team, ralph, ultrawork, ultraqa) with file-based state detection. Ralph's PRD-driven quality loop: auto-generate prd.json → work story-by-story → require fresh reviewer before completion. `OMC_DISABLE_TOOLS` env var for selective tool group disabling. |
| **State** | Four orthogonal layers: mode state files (.omc/state/), notepad (priority/working/manual sections), shared memory (namespaced, TTL), project memory (long-lived). Atomic writes via tmp+rename. |
| **Context** | Auto-context injection from AGENTS.md/CLAUDE.md at session start (system prompt, not message history). Background task concurrency limit. Task-size detection. Preemptive compaction hook. Startup codebase map (max 200 files, depth 4). |
| **Best Practices** | In-process MCP as tool bus; tool category metadata for env-var disabling; tiered memory (hot/warm/cold); shared memory namespaced by team; magic keywords with false-trigger prevention; mode-registry uses file presence only (no circular imports); commit trailers encoding decision context. |

### 7. Archon

| Dimension | Finding |
|---|---|
| **Architecture** | Multi-layer monorepo with strict one-way dependency hierarchy. 6 packages: paths → git → isolation + workflows → core → adapters → server. Interface-segregation: IPlatformAdapter, IAgentProvider, IDatabase, IWorkflowStore, IsolationResolver. YAGNI + Rule of Three enforced. |
| **Orchestration** | DAG-based workflow with topological layer concurrency (`Promise.allSettled`). Background dispatch with worker conversations + SSE bridge. Concurrent workflow guard (block if another on same path). Resume: reload completed outputs, skip, resume from first incomplete. Node retry: 2 retries, 3s delay. FATAL patterns never retried. |
| **Quality** | No LLM-as-judge. Quality via TypeScript strict + ESLint zero-warnings + test isolation. Error classification: FATAL > TRANSIENT > UNKNOWN. 3 consecutive unknowns abort workflow. `bun run validate` gates all merges. |
| **State** | Two-layer: SQLite/PostgreSQL DB (conversations, sessions, workflow_runs, messages, isolation_environments) + in-memory event emitter for SSE. Immutable sessions with parent_session_id audit trail. Pre-create DB rows before async work. |
| **Context** | Not explicitly managed — delegated to Claude SDK. Variable substitution ($nodeId.output), thread history (100 messages max), command file loading. No token counting or compaction. |
| **Best Practices** | Lazy logger initialization; DI via typed Deps interfaces; safeSendMessage vs sendCriticalMessage; error classification with FATAL priority; pre-create DB rows; Zod schema derivation; structured log naming; deterministic port allocation for worktrees. |

### 8. get-shit-done (GSD)

| Dimension | Finding |
|---|---|
| **Architecture** | Linear phase state machine with wave-based parallel plan execution. MilestoneRunner → PhaseRunner → WaveExecutor → runPlanSession. `.planning/` directory as persistent state. `gsd-tools.cjs` binary owns all filesystem mutations (SDK is stateless). |
| **Orchestration** | Sequential phases: Discuss → Research → Plan → PlanCheck → Execute → Verify → Advance. Wave parallelism within Execute phase. Human gate callbacks (onDiscussApproval, onVerificationReview, onBlockerDecision). Research gate blocks planning if unresolved open questions exist. |
| **Quality** | Research gate (pure function, blocks planning on unknowns). Plan check with one retry cycle. Verify step with gap closure (re-run execute to fill gaps). Advance guard (never mark complete unless verify passed). Plan frontmatter: must_haves.artifacts with min_lines, exports, contains. |
| **State** | Filesystem-as-state (.planning/ markdown files). Context engine maps each phase to minimal needed files. State mutations emit GSDStateMutationEvent. Workstream support (namespaced .planning/ subdirectories). |
| **Context** | Phase-scoped file loading (Execute: 2 files, Research: 4 files). Active milestone extraction from ROADMAP.md. Markdown-aware truncation (keep headings + first paragraphs, omit body, preserve YAML frontmatter). 8192 char threshold. |
| **Best Practices** | Phase-scoped tool restriction (Verify cannot Write/Edit); research gate before planning; filesystem-as-state; plan frontmatter as machine-verifiable spec; advance guard; parallel research spawn (4 dimensions simultaneously); per-session cost buckets; discriminated union events. |

### 9. everything-claude-code (ECC)

| Dimension | Finding |
|---|---|
| **Architecture** | Plugin architecture: skills/ → agents/ → hooks/ → rules/ → commands/ (priority order). 47 agents, 181 skills, 79 commands, 13 hook events. ECC2 adds Rust TUI with SQLite session state machine and 4-axis risk scoring. |
| **Orchestration** | Proactive, parallel, specialist-routed. PROACTIVELY keyword in agent descriptions triggers auto-invocation. Subagents cannot invoke other subagents via bash (must use Agent tool). Tree-shaped delegation graph, never peer-to-peer. |
| **Quality** | Three-layer gate: (1) GateGuard fact-forcing (block first Edit, demand investigation), (2) Post-edit quality gate (auto-detect formatter), (3) Eval harness (EDD: pass@k metrics, capability pass@3 >= 90%, regression pass^3 = 100%). Anti-patterns documented: overfitting to evals, measuring only happy path, ignoring cost drift, flaky graders. |
| **State** | Three tiers: session state (~/.gateguard/state-{ID}.json, 30min TTL), learned state (observations.jsonl + instincts/), knowledge files (relationships.md, preferences.md). Instinct confidence scoring (0.3-0.9) with evidence trails. Project-scoped by default, promotes to global at confidence >= 0.8 in 2+ projects. |
| **Context** | Token estimation (words×1.3 prose, chars/4 code). Each MCP tool schema ~500 tokens. Agent descriptions load always. Avoid last 20% of context window for large tasks. Manual /compact suggested at ~50%. |
| **Best Practices** | GateGuard (investigate before edit); hooks > prompts for reliability (LLMs forget ~20%); eval-driven development; stop-time batching; config protection hook; continuous learning with confidence scoring; 4-axis risk scoring; run-with-flags wrapper for hook gating. |

### 10. multica

| Dimension | Finding |
|---|---|
| **Architecture** | Go backend + monorepo frontend (pnpm workspaces + Turborepo). Strict internal packages: core (headless logic) → ui (atoms) → views (pages) → apps. No-Duplication Rule enforced structurally. |
| **Orchestration** | Agents as first-class assignees in project management. Polymorphic assignee_type + assignee_id on issues. Local daemon and cloud agent runtimes. AI-native teams where agents are participants. |
| **Quality** | Verification loop: Write → make check → read errors → fix → repeat. Tests follow code location (test in the package the code lives in, never the consuming app). TDD workflow. |
| **State** | React Query (all server state, WS events invalidate) + Zustand (all client state). Hard rules: never duplicate server data into Zustand; WS invalidates queries, never writes stores; selectors must return stable references. |
| **Context** | Lazy loading of subdirectory CLAUDE.md files. DB-level isolation per worktree checkout. |
| **Best Practices** | Platform bridge pattern (CoreProvider + NavigationAdapter); pnpm catalog for version pinning; worktree isolation at DB level; semantic CSS tokens only; atomic commits by logical intent. |

### 11. claude-code-best-practice

| Dimension | Finding |
|---|---|
| **Architecture** | Command → Agent → Skill three-tier orchestration. Agent skills (preloaded via frontmatter) vs direct-invocation skills (via Skill tool). |
| **Orchestration** | PROACTIVELY keyword for auto-invocation. 16 agent frontmatter fields documented (model, skills, background, isolation, effort, maxTurns, permissionMode, color). Self-evolving agents update own skills after execution. |
| **Quality** | Configuration hierarchy (6 levels, MDM highest). Keep CLAUDE.md under 200 lines. Break subtasks to complete in under 50% context. 27 hook events, 13 skill frontmatter fields. |
| **State** | Agent memory: project-scoped persistence. Memory scopes: user, project, local. |
| **Context** | Skill `paths` field limits auto-activation. `disable-model-invocation` prevents automatic invocation. `context: fork` for isolated subagent context. |
| **Best Practices** | Self-evolving agents; asyncRewake (async default, wake on exit code 2); `if` conditional on hooks; AskUserQuestion auto-response via hook; `http` hook type for external webhooks; worktree isolation per agent. |

### 12. andrej-karpathy-skills

| Dimension | Finding |
|---|---|
| **Architecture** | Single behavioral constraint skill (68 lines). Designed to be preloaded on code-writing agents. |
| **Orchestration** | N/A. Anti-orchestration: exists because LLMs over-orchestrate by default. |
| **Quality** | Goal-Driven Execution: transform every task into verifiable assertions. Multi-step plan with verify steps. "Strong success criteria let you loop independently." |
| **State** | Stateless by design. |
| **Context** | 68 lines — minimal footprint IS the context management. |
| **Best Practices** | Four guidelines: (1) Think Before Coding (state assumptions, ask when confused), (2) Simplicity First (minimum code, no speculative abstractions), (3) Surgical Changes (touch only what's needed, match existing style), (4) Goal-Driven Execution (define success criteria before implementing). |

---

## Anthropic Articles Analysis

### Article 1: Harness Design for Long-Running Applications

| Pattern | Detail |
|---|---|
| **Core insight** | GAN-inspired generator-evaluator loops. Separate the worker from the judge — never rely on self-evaluation for subjective tasks. |
| **Sprint contracts** | Before each sprint, Generator and Evaluator negotiate explicit success criteria. Evaluation criteria language directly shapes generator behavior. |
| **Context management** | Context resets over compaction. Clean slates + structured handoffs. "Context anxiety" identified: Sonnet 4.5 prematurely wrapped up work as context filled. |
| **Model evolution** | Sprint decomposition was needed for Sonnet 4.5 but became less critical with Opus 4.6. Harnesses must be re-examined with each model release. |
| **Key quote** | "Find the simplest solution possible, and only increase complexity when needed." |

### Article 2: Code Execution with MCP

| Pattern | Detail |
|---|---|
| **Core insight** | Replace upfront tool loading with filesystem-based progressive disclosure. 98.7% token reduction (150K → 2K for tool discovery). |
| **Data filtering** | Filter large datasets in code before returning to model. A 2-hour transcript flowing through context costs ~50K extra tokens unnecessarily. |
| **Skill accumulation** | Agents save working code as reusable functions, building accumulated toolkit over time. |
| **Privacy** | Sensitive data can be tokenized in execution environment so it never enters model context. |

### Article 3: Writing Effective Tools for Agents

| Pattern | Detail |
|---|---|
| **Core insight** | Build prototypes → Run evaluations → Iterate with agents. Claude itself analyzes eval transcripts and optimizes tool implementations. Agent-optimized tools outperform manual. |
| **Tool design** | Namespace prefixes (asana_search, asana_projects_search). Return semantic fields, not UUIDs. Search > enumerate. Response format parameter (concise/detailed). |
| **Eval design** | Multi-step complex tasks (dozens of tool calls). Single-step synthetic tests fail to surface real issues. Track runtime, tokens, error rates, and calling patterns — not just accuracy. |
| **Key quote** | "Small refinements to tool descriptions can yield dramatic improvements." |

---

## Synthesized Pattern Catalog

### Architecture & Structure

| # | Pattern | Priority | Sources | Guidance |
|---|---|---|---|---|
| 1.1 | **Fixed/Editable Boundary** | CRITICAL | autoagent, autoresearch, ui-loop, OMC | Infrastructure code is frozen to agents. Agent-modifiable code lives separately. Enforce via filesystem permissions or hook-based guards. |
| 1.2 | **Three-Tier Orchestration** (Command → Agent → Skill) | CRITICAL | best-practice, OMC, Archon | Commands are entry points. Agents are loop runners. Skills are reusable work units. Each tier has its own context boundary. |
| 1.3 | **In-Process MCP as Tool Bus** | HIGH | OMC, gstack | MCP protocol as internal tool registry, but in-process. Tools register via MCP schema. No network overhead. |
| 1.4 | **Compiled Binary Distribution** | MEDIUM | gstack | Bun compile → single executable. Reduces deployment dependency hell. |
| 1.5 | **DI via Typed Deps Interfaces** | HIGH | Archon | All external dependencies injected via typed interfaces. Enables testing and provider swapping. |

### Agent Orchestration

| # | Pattern | Priority | Sources | Guidance |
|---|---|---|---|---|
| 2.1 | **Task-Size Detection** | CRITICAL | OMC, Karpathy | Classify tasks before orchestrating. Trivial tasks skip orchestration entirely. Never use multi-agent for a one-file edit. |
| 2.2 | **Named Thinking Modes** (over multiple agents) | CRITICAL | ui-loop, Anthropic articles | For role-switching within a task, use named modes (Research/Plan/Build/Verify), NOT separate agent processes. Reserve multi-agent for genuinely parallel work. |
| 2.3 | **DAG-Based Workflow** | HIGH | Archon | Model dependency structures as DAGs. Execute independent nodes in parallel. Resume from first incomplete on failure. Guard concurrent workflows on same path. |
| 2.4 | **Two-Queue Steering** | HIGH | pi-mono | Steering (mid-turn injection) vs follow-up (post-stop injection). Different semantics, both needed. |
| 2.5 | **Sprint Contracts** | HIGH | Anthropic articles | Before generation, define explicit success criteria. Evaluator checks against criteria, not vague quality. |
| 2.6 | **asyncRewake** | HIGH | best-practice | Async by default. Wake only on critical failure (exit code 2). Reduces idle compute for 24/7 operation. |
| 2.7 | **Background Concurrency Limit** | MEDIUM | OMC (max 5) | Hard cap on concurrent background tasks. Queue overflow with priority ordering. |

### Quality & Evaluation

| # | Pattern | Priority | Sources | Guidance |
|---|---|---|---|---|
| 3.1 | **Verifiable Exit Conditions** | CRITICAL | autoagent, autoresearch, ui-loop, GSD, Anthropic, Karpathy | Every task has machine-checkable completion criteria. "Looks good" is never acceptable. Strongest consensus in entire analysis. |
| 3.2 | **Eval-Driven Development** (pass@k) | CRITICAL | ECC, Anthropic articles | pass@3 >= 90% for capability. pass^3 = 100% for regression. Multi-step complex evals. |
| 3.3 | **GateGuard Fact-Forcing** | HIGH | ECC | Block first Edit per file. Force Read + investigation first. Implement as hook. |
| 3.4 | **Phase-Scoped Tool Restriction** | HIGH | GSD | Verify cannot Write/Edit. Research cannot Write. Enforce via allowedTools, not trust. |
| 3.5 | **Stop-Time Batching** | HIGH | ECC | Format+typecheck once at Stop, not per-Edit. |
| 3.6 | **Config Protection Hook** | HIGH | ECC | Block agents from weakening linters, tsconfig, CI configs. |
| 3.7 | **4-Axis Risk Scoring** | MEDIUM | ECC (ECC2) | base risk + file sensitivity + blast radius + irreversibility = composite score. |
| 3.8 | **Research Gate** | MEDIUM | GSD | Block planning if unresolved open questions exist. |

### State Management

| # | Pattern | Priority | Sources | Guidance |
|---|---|---|---|---|
| 4.1 | **Tiered Memory** (Hot/Warm/Cold) | CRITICAL | OMC | Priority (always loaded, small), working (7-day TTL), manual (permanent). Without tiering, context fills with stale state within hours. |
| 4.2 | **Immutable Context Snapshots** | CRITICAL | pi-mono, GSD | Snapshot context before each iteration. Never mutate mid-loop. Sessions form immutable audit trail. |
| 4.3 | **Ledger Pattern** | HIGH | autoagent, autoresearch, Archon | Append-only ledgers for cross-run continuity. Filesystem for agent-local, DB for multi-agent shared. |
| 4.4 | **Shared Memory Namespaced by Team** | HIGH | OMC | Cross-agent handoffs via namespaced shared memory. Prevents cross-pipeline contamination. |
| 4.5 | **Pre-Create State Before Async Work** | MEDIUM | Archon | Create DB/state rows before dispatching. Prevents 404s and race conditions. |

### Context Window Management

| # | Pattern | Priority | Sources | Guidance |
|---|---|---|---|---|
| 5.1 | **Context Resets with Structured Handoffs** | CRITICAL | Anthropic articles, ui-loop | Reset to clean slate. Inject handoff document (objective, completed, current state, next). Hook-based re-injection on resume. |
| 5.2 | **Progressive Tool Disclosure** | CRITICAL | Anthropic articles | Do NOT load all tool schemas upfront. Filesystem-based discovery. 98.7% token reduction measured. |
| 5.3 | **Active Milestone Extraction** | HIGH | GSD | When truncating, extract active milestone, truncate completed work details. Markdown-aware: keep headings + first paragraphs. |
| 5.4 | **Filter Data Before Returning to Model** | HIGH | Anthropic articles | Tools filter/aggregate/summarize before returning. Search > enumerate (address book principle). |
| 5.5 | **Response Format Parameter** | MEDIUM | Anthropic articles | concise vs detailed. Inter-agent = concise. User-facing = detailed. |

### Operational Excellence

| # | Pattern | Priority | Sources | Guidance |
|---|---|---|---|---|
| 6.1 | **Time/Iteration Budgets** | CRITICAL | autoagent, autoresearch, ui-loop | Turn limit + wall-clock timeout + plateau detection. Without budgets, agents loop forever — guaranteed 24/7 failure mode. |
| 6.2 | **Error Classification** (FATAL/TRANSIENT/UNKNOWN) | CRITICAL | Archon, OMC | FATAL = stop + escalate. TRANSIENT = retry with backoff. UNKNOWN = retry once, then escalate. Never show raw stacks to agents. |
| 6.3 | **Hooks Over Prompts** | CRITICAL | ECC | Any invariant that must NEVER be violated → hook. Prompts are suggestions; hooks are laws. Measured: LLMs forget ~20% of prompt instructions. |
| 6.4 | **ATIF Trajectory Serialization** | HIGH | autoagent | Serialize every action as trajectory. Enables debugging, eval dataset construction, regression detection. |
| 6.5 | **Ring Buffers for Logs** | HIGH | gstack (50K entries) | Bounded memory prevents disk exhaustion in 24/7 operation. |
| 6.6 | **Per-Session Cost Buckets** | HIGH | GSD | Thread-safe cost tracking per session. Set cost ceilings per task. |
| 6.7 | **Diff-Based Eval Selection** | HIGH | gstack | Only run tests the diff touches. Reduces CI time from minutes to seconds. |
| 6.8 | **Continuous Learning with Confidence Scoring** | MEDIUM | ECC | Extract patterns after success, save as skills (confidence 0.3-0.9). Project-scoped, promotes to global at >= 0.8 in 2+ projects. |
| 6.9 | **Discriminated Union Events** | MEDIUM | GSD | Type-tagged events enable SSE, WebSocket, or in-process transport without changing producers/consumers. |

---

## Anti-Patterns to Avoid

### 1. Multi-Agent by Default
Every reference repo that tried multi-agent made it optional or suppressed for small tasks. Default to single-agent with mode switching. Multi-agent adds coordination overhead, state synchronization complexity, and debugging difficulty.

### 2. Context Compaction/Summarization
Anthropic explicitly warns against this. Summarization loses critical details. Compaction introduces hallucinated context. Use clean resets with structured handoffs.

### 3. Trusting Prompts for Safety
LLMs forget ~20% of prompt instructions (measured by ECC). Never rely on "please don't do X" for anything that matters. Use hooks, tool restrictions, and filesystem permissions.

### 4. Raw Error Propagation
Passing stack traces to agents wastes context and confuses the model. Transform every error into an actionable instruction: "File X has syntax error on line Y, the issue is Z."

### 5. Unbounded Agent Loops
Without turn limits, wall-clock timeouts, and plateau detection, agents WILL loop forever. Every repo running continuous agents has explicit termination budgets.

### 6. Parallel Interface Definitions
Never maintain TypeScript interfaces AND Zod schemas for the same data. Derive types from schemas (`z.infer<typeof schema>`). Parallel definitions drift.

### 7. Upfront Tool Loading
Loading all tool schemas into context wastes 98.7% of tokens (Anthropic measured). Use progressive disclosure via filesystem.

### 8. Mutable Context During Iteration
Mutating context mid-loop causes non-deterministic behavior. Snapshot immutably before each iteration.

### 9. Vague Completion Criteria
"Looks good," "seems to work," "probably fine" — none are exit conditions. Every task needs machine-verifiable criteria defined BEFORE execution.

### 10. Agent-Modifiable Infrastructure
Agents will weaken linter configs, disable tests, and modify CI pipelines to make their code pass. Harness infrastructure must be read-only to agents.

---

## Recommended Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     CLI / API Layer                       │
│          (Commands, webhooks, cron triggers)               │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│                    Orchestrator                            │
│                                                           │
│  Task-Size       DAG Builder      Budget Enforcer         │
│  Classifier      (if needed)      (turns + clock +        │
│  (trivial/                         plateau detect)        │
│   moderate/                                               │
│   complex)       Two-Queue        Error Classifier        │
│                  Steering         (FATAL/TRANSIENT/       │
│                  (mid-turn +       UNKNOWN)               │
│                   post-stop)                              │
│                                                           │
│                  Cost Tracker (per-session buckets)        │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│                    Agent Runtime                          │
│                                                           │
│  Agent Loop (single process, mode-switching)              │
│    Modes: Research → Plan → Build → Verify                │
│    Budget: MAX_TURNS + wall-clock + plateau detect        │
│    Context: immutable snapshots per iteration             │
│                                                           │
│  Hook Engine                                              │
│    Pre-tool:  GateGuard, phase-scoped tool restriction    │
│    Post-tool: risk scoring, config protection             │
│    Stop:      batched lint+format+typecheck               │
│    On-resume: context re-injection from handoff file      │
│                                                           │
│  Tool Bus (In-Process MCP)                                │
│    Progressive disclosure via filesystem                  │
│    Tools filter data before returning                     │
│    Response format parameter (concise/detailed)           │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│                    State Layer                            │
│                                                           │
│  Hot Memory     Warm Memory      Cold Memory              │
│  (always        (7-day TTL,      (permanent,              │
│   loaded)        on-demand)       explicit load)          │
│                                                           │
│  Filesystem State        DB State (shared,                │
│  (agent-local:           multi-agent:                     │
│   plans, ledgers)         sessions, costs, runs)          │
│                                                           │
│  ATIF Trajectory Log (ring buffer, 50K entries)           │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│                    Eval Layer                             │
│                                                           │
│  Diff-Based        pass@k          Verifiable             │
│  Test Selection    Metrics          Exit Checks           │
│                                                           │
│  GAN-Style         Skill Learning                         │
│  Gen/Eval Loops    (confidence scoring)                   │
└──────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| **Runtime** | TypeScript + Bun | Consensus from gstack, OMC, GSD. Compile target for single-binary. |
| **Schema** | Zod as single source of truth | Derive TS types. Never parallel interfaces. (Archon, GSD) |
| **Agent-local state** | Filesystem (markdown + JSON) | Human-readable, git-trackable, inspectable. (GSD, ui-loop) |
| **Shared state** | SQLite | Single-binary deployable. Sufficient for coordination. (Archon) |
| **LLM** | Claude with version pinning | Re-run evals on each model update. Adjust harness complexity. |
| **Safety model** | Hooks as law, prompts as guidance | Any invariant that matters → mechanical enforcement. (ECC) |
| **Default orchestration** | Single-agent with mode switching | Multi-agent only when task-size classifier triggers. (ui-loop, OMC) |
| **Context overflow** | Clean reset + structured handoff | Never compaction/summarization. (Anthropic articles) |

---

## Implementation Priority

### Phase 1: Foundation (Week 1-2) — Single agent loop, running reliably

1. Agent loop with mode switching (Research/Plan/Build/Verify)
2. Hook engine (pre-tool, post-tool, on-resume)
3. Budget enforcer (turn limit, wall clock, plateau detection)
4. Error classifier (FATAL/TRANSIENT/UNKNOWN → actionable instructions)
5. Fixed/editable boundary (agent cannot modify harness code)
6. Filesystem state (ledgers, plans as markdown)
7. Verifiable exit conditions (plan frontmatter with machine-checkable criteria)

### Phase 2: Quality (Week 3-4) — Good output, not just any output

8. GateGuard (block first Edit, force investigation)
9. Phase-scoped tool restriction
10. Config protection hook
11. Stop-time batching (format+lint at Stop)
12. Diff-based eval selection
13. pass@k eval framework
14. Context reset with structured handoffs

### Phase 3: Scale (Week 5-6) — Multi-agent when justified

15. Tiered memory (hot/warm/cold)
16. In-process MCP tool bus with progressive disclosure
17. DAG-based workflow (only for tasks that need it)
18. Task-size classifier (suppress orchestration on small tasks)
19. Two-queue steering
20. Per-session cost tracking with ceilings
21. ATIF trajectory logging with ring buffer

### Phase 4: Evolution (Week 7-8) — Learn and improve over time

22. Continuous skill learning with confidence scoring
23. GAN-style generator/evaluator sprint contracts
24. Risk scoring on tool calls
25. asyncRewake for 24/7 idle efficiency
26. Compiled binary distribution

---

## The Unifying Principle

Across all 12 repos and 3 Anthropic articles, one meta-principle emerges with universal consensus:

> **Mechanical enforcement over LLM compliance.**

Every system that works reliably at scale enforces its invariants through hooks, tool restrictions, filesystem permissions, and budget limits — never through prompt instructions alone. The harness is a cage that makes it safe to let agents run autonomously. The prompts tell agents what to do. The hooks ensure they cannot do what they must not.
