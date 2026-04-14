# Analytical Reference Review: Adopt / Adapt / Reject

**Date:** 2026-04-13
**Method:** 3 parallel Opus scientist agents reading actual source code across 15 repos + 3 articles
**Purpose:** Decide what to take from each reference — not catalog, curate

---

## Per-Repo Analysis

### autoagent
**ADOPT: Fixed adapter boundary.** `agent.py` draws a hard line: `# FIXED ADAPTER BOUNDARY: do not modify unless the human explicitly asks`. Everything above is agent-modifiable (prompt, tools, orchestration). Everything below is frozen (Harbor adapter, ATIF serialization). This is the best infrastructure protection pattern because it's self-documenting and enforceable by grep. Apply to our harness: mutable strategy layer above, immutable adapter layer below.

**ADOPT: Keep/discard simplicity criterion.** Equal performance with simpler code = real improvement. The "overfitting test" — if this task disappeared, would this change still help? — prevents complexity creep in the harness itself.

**REJECT: Single `run_shell` tool.** The program.md admits this is a weakness. Don't copy the tool design; copy the advice about specialized tools.

### autoresearch
**ADOPT: Time-budgeted experiments.** `TIME_BUDGET = 300` fixes wall-clock, varies strategy. Makes experiments comparable. Our harness should do the same: fixed cost ceiling per agent task, let the agent optimize within it.

**ADOPT: Freeze the scorer.** `prepare.py` is read-only. The agent can only modify `train.py`. This prevents gaming metrics. For us: freeze the eval framework, let agents only modify skills and code.

**REJECT: Single-file constraint.** Two files works for a speedrun but won't scale for multi-agent orchestration.

### ui-loop
**ADOPT: Todo DAG with verifiable exit conditions.** The todo format (`Status`, `Exit condition`, `Blocked by`, `Progress %`) is the best task decomposition across all repos. "Exit conditions must be verifiable" prevents agents from lying about completion.

**ADOPT: Plateau/stuck/repetition detectors.** <3% progress for 4 iterations = plateau. <5% for 2 = stuck. Same change 3 times = loop. These are the missing guardrails that prevent token-burning.

**ADAPT: SessionStart hook injecting CLAUDE.md.** Good for context survival across sessions, but we need selective injection — full on startup, delta-only on resume.

**REJECT: "80% done and move on" for infrastructure.** Fine for UI polish. Wrong for a harness where correctness matters.

### gstack
**ADOPT: Diff-based test selection.** Each E2E test declares file dependencies as glob patterns. Runner checks `git diff`, only runs affected tests. `gate` vs `periodic` tiers add a second axis. Most sophisticated CI optimization in any repo.

**ADOPT: LLM-as-judge with structured rubric.** `callJudge<T>` with JSON output, retry-on-429, clarity/completeness/actionability scoring. Clean, reusable eval primitive. Already adopted in our eval framework.

**ADAPT: SKILL.md template pipeline.** `.tmpl` → generator → rendered SKILL.md is good separation. But the generated preambles are 80+ lines of bash boilerplate. Use the template approach, keep preambles under 10 lines.

**REJECT: The 30-script `bin/` sprawl.** One binary with subcommands, not 30 shell scripts.

### pi-mono
**ADOPT: beforeToolCall/afterToolCall hooks.** The cleanest tool execution lifecycle. `beforeToolCall` can block (`{ block: true, reason }`), `afterToolCall` can override results. Typed contracts (`BeforeToolCallContext`). Copy this interface for our GateGuard and config-protection hooks.

**ADOPT: Two-queue steering.** `steeringQueue` (mid-turn injection) vs `followUpQueue` (post-stop injection) with configurable drain modes. Best mechanism for human-in-the-loop control via Slack.

**REJECT: Double-transform pipeline.** `convertToLlm` + `transformContext` is over-engineered. One transform with proper error handling is simpler.

### oh-my-claudecode
**ADOPT: Agent roles with disallowedTools.** Code-reviewer has `disallowedTools: Write, Edit` — mechanically read-only. Architect cannot write code. This is the best role enforcement because it's config-level, not prompt-level.

**ADOPT: XML agent prompt structure.** `<Role>`, `<Success_Criteria>`, `<Constraints>`, `<Failure_Modes_To_Avoid>`, `<Final_Checklist>` sections. The checklist prevents silent partial completion.

**ADOPT: Commit protocol with decision-context trailers.** Commits encode why, not just what.

**REJECT: 19-agent role explosion.** Most tasks need 3-4 agents. 19 is over-specialized. Keyword-trigger magic is fragile.

### Archon
**ADOPT: YAML DAG workflows.** Node definitions with `depends_on`, `loop...until`, per-node hooks and tool permissions. Best workflow authoring format because it separates structure (owned by config) from intelligence (owned by LLM).

**ADOPT: CLAUDE.md as engineering constraints.** "Engineering constraints, not aspirations." Rules with rationale, not suggestions.

**REJECT: Multi-provider abstraction.** IPlatformAdapter, IAgentProvider, IDatabase, IWorkflowStore — too many interfaces. We're building for Claude, not a provider marketplace.

### get-shit-done
**ADOPT: Machine-verifiable acceptance criteria.** `MustHaveArtifact` in plan frontmatter: `path`, `exports`, `contains`, `min_lines`. The advance guard — never mark complete unless verify passed — is the enforcement mechanism.

**ADOPT: Phase-scoped tool restriction.** Verify step cannot Write/Edit. Research step cannot Write. Enforced via allowedTools config per phase.

**ADAPT: Typed state machine engine.** `PhaseRunner` with event streams and human gates is well-designed, but we need it to work across agent sessions (context resets), not just within one session.

**REJECT: 31-agent sprawl.** Same problem as OMC's 19 agents. Fewer, more capable agents.

### everything-claude-code
**ADOPT: GateGuard — block first Edit, demand investigation.** The most important defensive hook. Implemented as PreToolUse on Edit: if file hasn't been Read in this session, block. Forces understanding before modification.

**ADOPT: Config-protection hook.** `config-protection.js` blocks agents from weakening linters, tsconfig, CI. Agents WILL disable guardrails if allowed.

**ADOPT: Hook profiles with runtime gating.** `run-with-flags.js` with minimal/standard/strict profiles. Different situations need different enforcement levels.

**ADOPT: Continuous learning with confidence scoring.** Confidence 0.3-0.9, promote to global at 0.8 across 2+ projects. The self-improvement mechanism.

**REJECT: 34+ skill marketplace.** Too many skills dilute quality. Curate, don't collect.

### multica
**ADOPT: Hard package boundaries in CLAUDE.md.** Rules with rationale. "Never duplicate server data into Zustand" + why. "WS invalidates queries, never writes stores" + why. The best CLAUDE.md because rules have teeth.

**ADOPT: Worktree-per-conversation isolation.** DB-level isolation per worktree checkout. Prevents agents from stepping on each other's work.

**REJECT: Go + pnpm + Turborepo complexity.** We're TypeScript + Bun. Don't import their build system.

### claude-code-best-practice
**ADOPT: Self-evolving agents.** Agents update their own skills after execution. The agent gets better at its job over time without human intervention.

**ADOPT: asyncRewake.** Async by default, wake on exit code 2. Reduces idle compute for 24/7 operation.

**ADAPT: 16 agent frontmatter fields.** Good reference but we don't need all 16. Take: name, description, model, level, disallowedTools, skills, effort, maxTurns, permissionMode. Skip the rest.

**REJECT: Sound notification system.** 80% of complexity for zero product value.

### andrej-karpathy-skills
**ADOPT: The entire 68-line skill as base behavioral constraint.** Four principles every agent must follow: (1) Think before coding — state assumptions. (2) Simplicity first — minimum code, no speculative abstractions. (3) Surgical changes — every changed line traces to the request. (4) Goal-driven execution — transform tasks into verifiable assertions.

**This is the most important single skill in any reference repo.** Its power is brevity. It works BECAUSE it's 68 lines, not despite it. Don't expand it.

**REJECT: Anti-orchestration stance.** Karpathy's skill exists because LLMs over-orchestrate. True, but we need orchestration for multi-domain agent coordination. Take the principles, layer orchestration on top.

### smux
**ADOPT: tmux-bridge CLI for cross-pane communication.** `read`, `type`, `keys`, `name`, `resolve` commands. Clean interface for commander-to-agent communication.

**ADAPT: Read-before-interact requirement.** tmux-bridge requires a fresh `read` before every `type`/`keys` call. Good safety but verbose. Consider caching the last read.

**REJECT: The "must read before interact" as a hard gate.** Causes too many failed commands in practice (we experienced this). Make it a warning, not a block.

### googleworkspace-cli
**ADOPT: Schema-driven skill generation.** `generate_skills.rs` auto-generates 90+ SKILL.md files from Google Discovery Documents. Same schema drives the CLI tree and the skills. For us: generate skills from our stacks.yml and agent-categories.yml, not by hand.

**ADOPT: BLOCKED_METHODS denylist.** Explicit list of destructive operations that are never allowed. For us: a denylist of dangerous Bash commands per agent category.

**REJECT: Rust implementation.** We're TypeScript/Bun. Take the patterns, not the language.

### Anthropic: Harness Design for Long-Running Apps
**ADOPT: Generator-evaluator split with sprint contracts.** Before each sprint, define explicit success criteria. Evaluator checks against contract, not vague quality. The criteria language directly shapes generator behavior.

**ADOPT: Context resets over compaction.** Compaction loses critical details. Clean resets with structured handoffs. This is the single most important context management decision.

**ADOPT: Hard cost ceilings.** The Retro Game Maker cost $200. Our harness needs per-task cost limits.

**ADAPT: Harness simplification as models improve.** Opus 4.6 eliminated sprint decomposition. Re-evaluate our harness complexity with each model release.

### Anthropic: Code Execution with MCP
**ADOPT: Progressive tool disclosure via filesystem.** 98.7% token reduction (150K → 2K). Agents discover tools by exploring filesystem, loading only what they need. Nothing to reject.

### Anthropic: Writing Effective Tools for Agents
**ADOPT: Eval-driven tool development.** Build prototype → run evals → iterate with Claude analyzing transcripts. Agent-optimized tools outperform manual.

**ADOPT: response_format parameter.** `concise` for inter-agent, `detailed` for user-facing. Simple, high-impact.

**ADOPT: Search > enumerate.** Address book analogy: implement `search_contacts`, not `list_contacts`. Agents have limited context.

---

## Synthesis: The 10 Most Important Decisions

| # | Decision | Source | Why it won |
|---|----------|--------|-----------|
| 1 | **Karpathy's 4 principles as base skill for ALL agents** | andrej-karpathy-skills | 68 lines that prevent the most common agent failures (over-engineering, scope creep, unverifiable work). Every other repo's problems trace back to violating these principles. |
| 2 | **Fixed adapter boundary between harness and agent-modifiable code** | autoagent | Self-documenting, grep-enforceable. Prevents the #1 failure mode: agents weakening their own guardrails. Beats OMC's hook-based approach because it's simpler. |
| 3 | **GateGuard + config-protection hooks** | everything-claude-code | LLMs forget ~20% of prompt instructions. Mechanical enforcement via PreToolUse hooks is the only reliable way. ECC has the most battle-tested implementations. |
| 4 | **Machine-verifiable acceptance criteria in plan frontmatter** | get-shit-done | `MustHaveArtifact` with `path`, `exports`, `contains`, `min_lines` + advance guard. Beats ui-loop's exit conditions because it's machine-parseable, not just human-readable. |
| 5 | **YAML DAG workflows with per-node tool permissions** | Archon | Separates structure (config) from intelligence (LLM). Beats OMC's skill-chaining because workflows are declarative and resumable. |
| 6 | **Agent roles with disallowedTools enforcement** | oh-my-claudecode | Code-reviewer cannot Write. Architect cannot Edit. Config-level, not prompt-level. Beats pi-mono's hook approach because it's simpler to configure. |
| 7 | **Diff-based eval selection with gate/periodic tiers** | gstack | Only run tests the diff touches. Gate tests block CI, periodic tests run weekly. Keeps eval cost under $4/run even with 40+ skills. No other repo has this. |
| 8 | **Time/cost-budgeted agent loops with plateau detection** | autoresearch + ui-loop | Fixed budget from autoresearch + plateau/stuck/repetition detectors from ui-loop. Combined, they prevent both unbounded spend and token-burning loops. |
| 9 | **Progressive tool disclosure via filesystem** | Anthropic (code execution article) | 98.7% token reduction. No competing approach comes close. Agents discover tools on-demand instead of loading all schemas upfront. |
| 10 | **Generator-evaluator split with sprint contracts** | Anthropic (harness design article) | The evaluator uses Playwright to test like a real user. Sprint contracts define success before building. Criteria language shapes generator behavior. No other repo implements this as cleanly. |

---

## What We Explicitly Reject (Cross-Repo Anti-Patterns)

| Anti-Pattern | Sources | Why |
|---|---|---|
| Agent role explosion (19-31 agents) | OMC, GSD, ECC | Coordination overhead kills most systems. 5-7 agents max, each with clear domain. |
| Keyword-trigger magic | OMC | Fragile. Use explicit skill invocation or hook-based injection instead. |
| Context compaction/summarization | Multiple | Anthropic explicitly warns against it. Clean resets with structured handoffs only. |
| Multi-provider abstractions | Archon | We build for Claude. Provider abstraction is YAGNI. |
| Sound notifications, persona systems | ECC, googleworkspace-cli | Zero product value. Complexity for aesthetics. |
| 80% completion philosophy for infrastructure | ui-loop | Fine for UI, wrong for the harness itself. Infrastructure correctness matters. |
| Parallel type definitions (interfaces + Zod) | Multiple | Derive types from schemas. Never maintain both. |
