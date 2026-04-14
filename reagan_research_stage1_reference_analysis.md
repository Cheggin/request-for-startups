# Research Stage 1: Reference Repo Deep Dive

## 1. autoagent/

**Source files read:** `agent.py`, `agent-claude.py`, `program.md`

### ADOPT

- **Fixed/Editable Boundary.** The clearest architectural win in any repo here. `agent.py` has a literal comment line `FIXED ADAPTER BOUNDARY` -- everything above is the meta-agent's sandbox (prompt, tools, orchestration), everything below is untouchable infra (Harbor adapter, ATIF serialization). This is the best mechanism for constraining an autonomous agent's edit scope because it requires zero runtime enforcement -- the boundary is a convention the LLM respects via prompt. Apply directly: define fixed/editable zones in our agent files with comment markers.

- **Keep/Discard with Simplicity Tiebreaker.** The decision logic is binary: if `passed` improved, keep; if equal and simpler, keep; otherwise discard. No subjective weighting. The simplicity criterion ("fewer components, less brittle logic, less special-case handling") is the best formulation I have seen -- it prevents complexity ratchet. Apply as our experiment evaluation protocol verbatim.

- **ATIF Trajectory Format.** Standardized step-by-step JSON with `step_id`, `timestamp`, `source`, `tool_calls`, `observation`. Provider-agnostic. Apply as our trajectory logging schema.

### ADAPT

- **Experiment Loop (program.md lines 148-170).** The 10-step loop (check branch, read logs, diagnose failures, group by root cause, choose one improvement, edit, commit, rebuild, record, decide keep/discard) is excellent scaffolding but assumes a single benchmark suite. Adapt by adding a multi-suite selector so the loop can target different eval dimensions per iteration rather than always running the full suite.

- **Overfitting Rule.** The test "if this exact task disappeared, would this still be worthwhile?" is good but needs a companion: "if this task family doubled, would this still scale?" Add that second check to catch narrow-but-technically-general hacks.

### REJECT

- **Single `run_shell` tool as baseline.** program.md acknowledges this is bad and recommends specialized tools, but the actual `agent.py` still ships with only `run_shell`. The gap between the advice doc and the code is a smell -- the meta-agent guidance is better than the artifact it produced. We should start with structured tools from day one, not iterate toward them.

---

## 2. autoresearch/

**Source files read:** `train.py`, `prepare.py`, `program.md`

### ADOPT

- **Time-Budgeted Experiments.** `TIME_BUDGET = 300` in `prepare.py` (line 31) is a hard constant. The training loop checks `total_training_time >= TIME_BUDGET` (line 603). This is the best approach to autonomous research because it makes every experiment directly comparable -- same wall-clock budget, different ideas. The first 10 steps are excluded from the timer to avoid penalizing compilation warmup (line 578). Apply this exact pattern: fixed time budget per experiment, warmup exclusion, progress = time/budget.

- **Pinned Eval Data.** `VAL_SHARD = MAX_SHARD` (line 43) -- the validation shard is always the last shard, pinned, never part of training. `evaluate_bpb` is marked `DO NOT CHANGE` (line 343). This two-part pinning (fixed data + frozen metric function) is the strongest eval integrity mechanism here. Apply by separating eval code into a read-only module with a similar comment convention.

- **One-Variable-At-A-Time Discipline.** program.md line 101: "Each experiment should try one thing." Combined with the keep/discard binary and the TSV ledger (`commit, val_bpb, memory_gb, status, description`), this creates a clean experimental record. The `results.tsv` is explicitly untracked by git (line 106) so it accumulates across branches. Apply this ledger pattern.

### ADAPT

- **NEVER STOP directive.** program.md line 112: "do NOT pause to ask the human if you should continue... The loop runs until the human interrupts you, period." This is the strongest autonomy directive across all repos. Adapt by adding circuit breakers: stop if cost exceeds threshold, stop if N consecutive crashes, stop if metric regresses 3x in a row. Unbounded autonomy without guardrails is dangerous for paid API calls.

### REJECT

- **No version control on results.tsv.** Keeping the ledger untracked means it can be lost if the machine dies. The rationale (accumulate across branches) is valid, but a better pattern is to commit it to a dedicated `results` branch or write to a persistent store. Reject the "untracked file as database" pattern.

---

## 3. ui-loop/

**Source files read:** `skills/loop/SKILL.md`, `CLAUDE.md`, `hooks/hooks.json`

### ADOPT

- **Plateau/Stuck/Repetition Detectors.** SKILL.md lines 87-103. Three concrete thresholds: plateau = <3% progress for 4 iterations; stuck = <5% progress for 2 iterations; repetition = same change 3 times. These are the best anti-loop mechanisms I have seen because they are numeric, not vibes-based. The escalation protocol (STATUS/WHAT I TRIED/WHY THEY FAILED/RECOMMENDATION) is structured and actionable. Apply all three detectors with the exact thresholds.

- **Named Thinking Modes.** CLAUDE.md lines 94-125 defines six thinking roles: Orchestrator, Build, QA, Auditor, Page Planner, Design Spec, Inspiration. Each has 3-5 bullet-point heuristics. This is better than a single monolithic system prompt because it primes the right cognitive frame per phase. Apply by defining named modes for our agent phases (plan, implement, verify, diagnose).

- **80%-and-Move-On.** CLAUDE.md line 78: "80% done and moving on is better than 95% done after burning 10 iterations on polish." Combined with the breadth-over-depth rule (line 108: "Cover all parts of the goal before polishing any one part"). Apply as a hard rule: no todo gets more than N iterations before parking.

### ADAPT

- **Visual Verification via Screenshot.** SKILL.md line 68: "Take a screenshot to validate the result visually. Do NOT mark a todo complete before taking a screenshot." This is specific to UI work. Adapt for non-UI agents by replacing "screenshot" with "observable artifact verification" -- run the test, check the output file, curl the endpoint. The principle (verify the artifact, not the intent) is universal.

### REJECT

- **SessionStart Hook Mechanism.** `hooks.json` is minimal -- just `mkdir` and `cat CLAUDE.md` on session start. The hook system itself is too thin to be useful for runtime control. The real control logic lives in SKILL.md prose, not in programmatic hooks. Reject the hooks.json approach for anything beyond trivial setup; use proper beforeToolCall/afterToolCall hooks instead.

---

## 4. gstack/

**Source files read:** `CLAUDE.md`, `test/helpers/llm-judge.ts`, `test/helpers/touchfiles.ts`, `test/helpers/eval-store.ts`, `test/helpers/session-runner.ts`, `investigate/SKILL.md`, `ship/SKILL.md`, `review/SKILL.md`

### ADOPT

- **3-Tier Test Pyramid.** Tier 1: static validation (free, <1s, `bun test`). Tier 2: E2E via `claude -p` subprocess (~$3.85/run). Tier 3: LLM-as-judge quality scoring (~$0.15/run). The tier classification in `E2E_TIERS` (touchfiles.ts line 192) with `gate` (blocks merge) vs `periodic` (weekly cron) is the best test governance I have seen for AI-agent projects. Apply this exact tiering: free static checks on every commit, paid evals gated by diff, expensive quality checks on schedule.

- **Diff-Based Eval Selection.** `touchfiles.ts` maps every test to its file dependencies via glob patterns. `selectTests()` (line 431) checks `git diff` against base branch, runs only affected tests. Global touchfiles (session-runner, eval-store, touchfiles itself) trigger everything. This saves ~90% of eval cost on typical PRs. Apply by building a touchfile registry for our evals.

- **Errors-As-Instructions (Iron Law).** The `/investigate` skill enforces "no fixes without root cause" -- the agent is prohibited from editing files until it has completed the investigation and analysis phases. PreToolUse hooks on Edit/Write run `check-freeze.sh` to enforce this programmatically. This is the best pattern for preventing the "just try random things" failure mode. Apply by gating write tools behind investigation completion.

### ADAPT

- **LLM-as-Judge with Structured Rubrics.** `llm-judge.ts` uses claude-sonnet-4-6 to score on clarity/completeness/actionability (1-5 scale) and detect planted bugs against ground truth. The `outcomeJudge` function is particularly strong -- it checks detection rate against planted bugs with known IDs. Adapt by building domain-specific rubrics rather than using the generic quality dimensions; the planted-bug detection pattern is more reliable than subjective scoring.

- **Eval Store with Auto-Comparison.** `eval-store.ts` persists every run to JSON, auto-compares against the previous run on the same branch, generates commentary ("REGRESSION: X was passing, now fails"). The `generateCommentary` function (line 437) is opinionated and actionable. Adapt the comparison logic but store results in a database rather than JSON files for better querying.

### REJECT

- **Preamble Boilerplate.** Every SKILL.md starts with ~80 lines of bash that checks updates, manages sessions, logs telemetry, counts learnings, records timelines. This is duplicated across 40+ skills. The template system (`SKILL.md.tmpl` + `gen-skill-docs.ts`) manages the duplication but the generated output is still massive prompt bloat. Reject this pattern; use a single shared preamble function rather than inlining it into every skill prompt.

---

## 5. pi-mono/

**Source files read:** `AGENTS.md`, `packages/agent/src/agent.ts`, `packages/agent/src/agent-loop.ts`, `packages/agent/src/types.ts`

### ADOPT

- **Two-Queue Steering.** `agent.ts` has two separate `PendingMessageQueue` instances: `steeringQueue` (injected after current turn, line 249) and `followUpQueue` (injected only when agent would otherwise stop, line 256). The inner loop checks steering after every tool execution; the outer loop checks follow-ups only at natural stopping points (agent-loop.ts lines 168-229). This is the best agent control mechanism across all repos because it cleanly separates "redirect now" from "do this next." Apply this two-queue pattern for our agent orchestration.

- **beforeToolCall/afterToolCall Hooks.** Typed hook interfaces (types.ts lines 42-94) with clear contracts: `beforeToolCall` can return `{ block: true, reason: "..." }` to prevent execution; `afterToolCall` can override `content`, `details`, or `isError` with explicit no-deep-merge semantics. The hook receives the full `AgentContext` including current messages. This is the best hook design because it is both powerful and constrained. Apply these exact hook signatures.

- **Provider-Agnostic Design.** The `StreamFn` type (types.ts line 24) abstracts over any LLM provider. `convertToLlm` (types.ts line 100) transforms internal `AgentMessage[]` to provider `Message[]` only at the LLM call boundary. `transformContext` (types.ts line 130) operates on the internal representation for pruning/injection. This three-layer design (internal messages > transform context > convert to LLM) is the cleanest abstraction. Apply by keeping our message format internal and converting only at the API boundary.

### ADAPT

- **Immutable Context Snapshots.** `createContextSnapshot()` (agent.ts line 399) copies messages and tools arrays before passing to the loop. But the loop then mutates `currentContext.messages` directly (agent-loop.ts line 209). The snapshot is shallow -- message objects inside the array are shared. Adapt by making the snapshot truly immutable (deep freeze or structural sharing) if we need concurrent access, or accept the shallow copy if single-threaded.

### REJECT

- **Declaration Merging for Custom Messages.** types.ts line 236 uses TypeScript declaration merging (`interface CustomAgentMessages {}`) to let apps extend the message union type. This is clever but creates invisible coupling -- you cannot see all message types by reading any single file. Reject in favor of an explicit discriminated union that is extended via a type parameter on `Agent<TCustomMessages>`.
