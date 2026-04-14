# Reference Repo Deep Dive: Adopt / Adapt / Reject

---

## 1. autoagent

**ADOPT: The "Fixed Adapter Boundary" pattern.** `agent.py` draws a hard line between editable agent logic (prompt, tools, orchestration) and fixed infrastructure (Harbor adapter, ATIF trajectory serialization). The comment `# FIXED ADAPTER BOUNDARY: do not modify unless the human explicitly asks` is the single best idea across all five repos. It lets a meta-agent iterate on the harness without accidentally breaking integration plumbing. We should use this exact pattern: mutable strategy layer above, immutable adapter layer below.

**ADOPT: The experiment loop in `program.md`.** The keep/discard protocol with `results.tsv` logging, the overfitting test ("if this task disappeared, would this still be worthwhile?"), and the "NEVER STOP" autonomous directive form a complete self-improving harness. The simplicity criterion -- equal performance with simpler code is a real improvement -- prevents complexity creep. Steal this loop structure wholesale.

**ADAPT: The `agent-claude.py` dual-entrypoint design.** Having both an OpenAI Agents SDK version and a Claude SDK version in the same repo is clever for benchmarking, but the Claude version's `permission_mode="bypassPermissions"` is a sandbox-only pattern. For our harness, we need a permission layer that works in production. Keep the dual-SDK idea, add a permission abstraction.

**REJECT: Single `run_shell` tool.** The `program.md` itself calls this out as a weakness -- "a single run_shell tool forces the agent to write boilerplate from scratch on every call." The code ships with exactly this anti-pattern. The advice is right but the implementation doesn't follow it. Don't copy the tool design; copy the advice about specialized tools.

---

## 2. autoresearch

**ADOPT: The time-budget-as-constraint design.** `TIME_BUDGET = 300` in `prepare.py` is a fixed wall-clock budget that the training loop in `train.py` respects via `total_training_time >= TIME_BUDGET`. This is the best way to make LLM experiments comparable -- fix time, vary architecture. Our startup harness should budget compute the same way: fixed cost ceiling, let the agent optimize within it.

**ADOPT: The "prepare.py is read-only" contract.** Evaluation (`evaluate_bpb`), data loading, and constants are frozen in `prepare.py`. The agent can only modify `train.py`. This separation of concerns prevents the agent from gaming metrics by modifying the eval function. For our harness: freeze the scorer, let the agent only modify the strategy.

**ADAPT: The MuonAdamW optimizer pattern.** The combined optimizer (Muon for 2D matrices, AdamW for embeddings/scalars) with `torch.compile` fused kernels is state-of-the-art for small-model training. We don't need ML training, but the principle -- different optimization strategies for different parameter classes -- applies to our multi-objective harness tuning. Adapt as: different improvement strategies for different failure classes.

**REJECT: The single-GPU, single-file constraint.** Everything in two files works for a Karpathy-style speedrun but won't scale when our harness needs to orchestrate multiple agents or environments. The "no new dependencies" rule (`pyproject.toml` is frozen) is too restrictive for a startup harness that needs to integrate external tools.

---

## 3. ui-loop

**ADOPT: The todo DAG with verifiable exit conditions.** The `SKILL.md` phase structure (Clarify -> Plan -> Build Loop) with explicit todo format including `Status`, `Exit condition`, `Blocked by`, and `Progress %` is the best task decomposition pattern in any of these repos. The rule "exit conditions must be verifiable -- 'looks good' is not acceptable" prevents the agent from lying about completion. Steal this todo schema.

**ADOPT: Plateau/stuck/repetition detection.** Three concrete loop-control rules: <3% progress for 4 iterations = plateau (park and move on), <5% for 2 iterations = stuck (escalate or skip), same change 3 times = loop (stop). These are the missing guardrails that prevent agents from burning tokens on diminishing returns. Apply directly to our harness experiment loop.

**ADAPT: The SessionStart hook that injects CLAUDE.md.** `hooks.json` runs `cat "${CLAUDE_PLUGIN_ROOT}/CLAUDE.md"` on every session start/resume/clear/compact. This ensures context survives session boundaries. For our harness, we need this but with selective injection -- full context on startup, delta-only on resume to avoid wasting context window.

**REJECT: The "80% done and moving on" philosophy for core infrastructure.** This makes sense for UI building where visual polish has diminishing returns, but for a startup harness, correctness of the core loop matters. An 80%-correct experiment loop will produce misleading results. Apply the breadth-over-depth rule to features, not to the harness itself.

---

## 4. gstack

**ADOPT: The diff-based test selection system (`touchfiles.ts`).** Each E2E test declares its file dependencies as glob patterns. The runner checks `git diff` and only runs tests whose dependencies changed. This is the most sophisticated CI optimization in any of these repos. The `E2E_TIERS` classification (gate vs. periodic) adds a second axis: gate tests block merge, periodic tests run weekly. Steal both mechanisms.

**ADOPT: The LLM-as-judge eval pattern (`llm-judge.ts`).** Using `claude-sonnet-4-6` to score documentation quality on clarity/completeness/actionability (1-5 scale) with structured JSON output is a clean, reusable eval primitive. The `callJudge<T>` generic with retry-on-429 is production-ready. Copy the interface; swap the scoring rubric for our domain.

**ADAPT: The SKILL.md template pipeline.** `.tmpl` files -> `gen-skill-docs.ts` -> generated `SKILL.md` files is a good separation of source-of-truth from rendered output. But the generated preamble blocks are 80+ lines of bash boilerplate (telemetry, learnings, session tracking, vendoring detection) that runs before every skill invocation. For our harness, use the template approach but keep preambles under 10 lines. The telemetry/analytics layer should be a separate concern, not inlined into every skill.

**REJECT: The massive `bin/` utility sprawl.** 30 shell scripts (`gstack-analytics`, `gstack-builder-profile`, `gstack-community-dashboard`, `gstack-learnings-log`, `gstack-telemetry-sync`, etc.) is a maintenance surface area explosion. Many are single-purpose wrappers that could be subcommands of one CLI. For a startup: one binary, subcommands. Don't let DX tooling outgrow the product.

---

## 5. pi-mono

**ADOPT: The `beforeToolCall` / `afterToolCall` hook system.** `agent-loop.ts` has the cleanest tool execution lifecycle of any repo. `beforeToolCall` can block execution (returning `{ block: true, reason }`) and `afterToolCall` can override results (content, details, isError). This is the right abstraction for permission gates, audit logging, and result transformation. The type contracts (`BeforeToolCallContext`, `AfterToolCallContext`) are precise. Copy this interface directly.

**ADOPT: The steering/follow-up queue architecture.** The `Agent` class separates two message queues: `steeringQueue` (injected after current turn) and `followUpQueue` (injected after agent would stop). With configurable drain modes (`all` vs `one-at-a-time`). This is the best mechanism for human-in-the-loop control of a running agent. The outer/inner loop design in `runLoop` -- inner loop handles tool calls + steering, outer loop checks for follow-ups -- is elegant and correct.

**ADAPT: The `CustomAgentMessages` declaration merging pattern.** The empty interface `CustomAgentMessages {}` that apps extend via TypeScript declaration merging to add custom message types is clever for a library, but fragile for a harness where message types should be explicit. Adapt as: use a discriminated union with an explicit `custom` variant that carries a typed payload, rather than relying on ambient type augmentation.

**REJECT: The `convertToLlm` / `transformContext` double-transform pipeline.** Two sequential transforms (AgentMessage[] -> AgentMessage[] via `transformContext`, then AgentMessage[] -> Message[] via `convertToLlm`) adds indirection without clear benefit over a single transform. The docstring even admits "contract: must not throw or reject. Return a safe fallback instead" -- this is a code smell indicating the abstraction is too fragile. One transform with proper error handling is simpler and safer.

---

## Cross-Repo Synthesis: Top 5 Patterns for Our Harness

| Priority | Pattern | Source | Mechanism |
|----------|---------|--------|-----------|
| 1 | Fixed adapter boundary | autoagent | Comment-delimited mutable/immutable zones in agent files |
| 2 | Time/cost-budgeted experiment loop | autoresearch | Fixed budget, vary strategy, log to TSV, keep/discard |
| 3 | Todo DAG with plateau detection | ui-loop | Verifiable exit conditions + 3%/4-iter stop rule |
| 4 | Diff-based test selection | gstack | Touchfile dependency maps + gate/periodic tiers |
| 5 | beforeToolCall/afterToolCall hooks | pi-mono | Block/override tool execution with typed contexts |
