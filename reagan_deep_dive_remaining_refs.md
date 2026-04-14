# Deep Dive: Remaining Reference Repos & Articles

## 1. claude-code-best-practice

**Source code read:** CLAUDE.md, settings.json (440 lines of hooks config), all agent definitions (weather-agent, time-agent, presentation-curator, development-workflows-research-agent), HOOKS-README.md (580 lines), hooks-config.json, rules/presentation.md, rules/markdown-docs.md

**ADOPT:**
- **Command -> Agent -> Skill architecture.** The three-tier pattern where commands are entry points, agents are specialized workers with tool allowlists and model selection, and skills are preloaded knowledge. Mechanism: agents get `skills:` field in frontmatter that injects context without user action. Apply to our harness: every domain capability (e.g., "deploy to Vercel") becomes a skill; agents compose skills; users invoke via commands.
- **Agent self-evolution pattern.** The presentation-curator agent updates its own skill files after every execution (Step 5 in its definition). This prevents knowledge drift. Apply: our harness agents should append learnings to their own definition files after complex tasks.
- **Hook lifecycle coverage.** 27 hook events covering the full agent lifecycle (PreToolUse through PermissionDenied). The `async: true` pattern for non-blocking side effects is clean. Apply: our harness needs at minimum SessionStart, Stop, PreToolUse, and PostToolUse hooks for telemetry and guardrails.

**ADAPT:**
- **Single Python script for all hooks.** They route every hook event through one `hooks.py` that plays sounds. For our harness, hooks should be typed handlers (not a monolithic script) -- each hook event gets its own handler file so they can be independently tested and deployed.
- **Permission allowlists are too broad.** The weather-agent gets `Bash(*)`, `mcp__*`, `WebFetch(*)` -- effectively everything. Our agents should follow least-privilege: a deploy agent gets `Bash(git *)`, `Bash(vercel *)` and nothing else.

**REJECT:**
- **Sound notification system.** 80% of this repo's complexity is audio file management (ElevenLabs TTS, per-event .wav/.mp3 files, agent-specific sound folders). This is a personal UX preference, not a harness pattern. Zero value for a startup product.
- **Per-file git commits.** Their CLAUDE.md mandates separate commits per file changed. This creates noisy git history and slows down development. Atomic commits per logical change are better.
- **Vanity spinner verbs.** Custom spinner text ("Admiring Shayan's code") is cute but wastes settings.json real estate on non-functional config.

---

## 2. andrej-karpathy-skills

**Source code read:** CLAUDE.md (66 lines), skills/karpathy-guidelines/SKILL.md (68 lines), plugin.json, marketplace.json

**ADOPT:**
- **Extreme brevity as a feature.** 68 lines total. Four rules: Think Before Coding, Simplicity First, Surgical Changes, Goal-Driven Execution. The skill works because it is short enough to fit entirely in context without competing for attention. Mechanism: each rule has a bold one-liner thesis, then 4-5 bullet constraints. Apply: every skill we write for our harness should be under 100 lines. If it needs more, split it into multiple skills.
- **"Every changed line should trace directly to the user's request."** This is the single best anti-slop rule. Apply: embed this as a mandatory verification step in our harness's code-generation pipeline. After generating code, the agent must justify each changed line.
- **Goal-driven execution with verification steps.** The pattern `[Step] -> verify: [check]` transforms vague tasks into testable contracts. Apply: our harness's planner agent should output this format, and the evaluator should check against it.

**ADAPT:**
- **It's a behavioral overlay, not a workflow.** The skill modifies how Claude thinks but doesn't orchestrate actions. Our harness needs both: behavioral rules (adopt these) PLUS workflow orchestration (agent routing, tool selection, state management). Ship the Karpathy rules as a base skill that all our agents inherit, but layer orchestration on top.

**REJECT:**
- **Plugin marketplace packaging.** The `.claude-plugin/` directory with marketplace.json is overhead for distribution. Our harness skills live in-repo and don't need marketplace metadata.

---

## 3. smux

**STATUS: Not found in reference directory.** The repo does not exist at `/Users/reagan/Documents/GitHub/request-for-startups/reference/smux`. Skipping.

---

## 4. googleworkspace-cli

**Source code read:** main.rs (738 lines), commands.rs (283 lines), executor.rs (top 100 lines), client.rs (165 lines), discovery.rs (330 lines), generate_skills.rs (top 120 lines), helpers/mod.rs (129 lines), docs/skills.md (127 lines -- 90+ generated skills), CLAUDE.md

**ADOPT:**
- **Schema-driven CLI generation from Discovery Documents.** The entire CLI is dynamically built from Google's REST API Discovery JSON. `commands.rs::build_cli()` recursively walks `RestDescription.resources` to create clap subcommands. `generate_skills.rs` then auto-generates SKILL.md files from the same schema. Apply to our harness: when integrating any API (Vercel, Supabase, Stripe), fetch their OpenAPI spec and auto-generate both CLI commands and agent skills from it. This is the correct way to scale tool coverage.
- **Helper trait pattern for service-specific overrides.** The `Helper` trait (`inject_commands`, `handle`, `helper_only`) lets Gmail, Sheets, Calendar etc. override the generic discovery-based behavior with ergonomic shortcuts (e.g., `gws gmail send` instead of raw API calls). Apply: our harness should have a generic API executor plus per-service helpers that add high-level commands.
- **Blocked methods list.** `BLOCKED_METHODS` prevents dangerous operations (drive.files.delete, people.deleteContact) from being generated as skills. Apply: our harness must have an explicit denylist for destructive operations per integration.

**ADAPT:**
- **Rust is the wrong language for our harness.** The CLI is well-engineered Rust but our harness needs rapid iteration. The patterns (Discovery docs -> CLI tree -> skill generation) should be implemented in TypeScript/Python where the Claude Code ecosystem already lives. Keep the architecture, change the implementation language.
- **90+ skills is too many to load at once.** The generate-skills output produces 90+ SKILL.md files. The code-execution-with-mcp article (below) correctly identifies that loading all tools upfront wastes context. Apply: use progressive disclosure -- load the shared skill + only the service skill relevant to the current task.

**REJECT:**
- **Persona system.** 10 personas (exec-assistant, project-manager, hr-coordinator, etc.) are marketing features, not technical architecture. They're just skill bundles with a name. Our harness should let users compose skills dynamically rather than pre-packaging them into rigid personas.
- **Model Armor integration.** Content sanitization through Google's Model Armor is Google-specific infrastructure. Not relevant to our harness unless we're building specifically for Google Workspace customers.

---

## 5. harness-design-long-running-apps.md (Anthropic Engineering)

**ADOPT:**
- **Generator-evaluator separation (GAN-inspired).** The core insight: "separating the agent doing the work from the agent judging it proves to be a strong lever." Mechanism: generator works in sprints, evaluator uses Playwright MCP to test like a real user, they negotiate "sprint contracts" defining success criteria. Apply: our harness MUST have this split. The builder agent and QA agent are different agents with different system prompts and different incentive structures.
- **Context resets over compaction.** When context fills, don't compact (lossy) -- reset with a clean slate and structured handoff files. Apply: our harness should use file-based state (specs, contracts, bug lists) as the handoff mechanism between agent turns, not conversation history.
- **Sprint contracts.** Before each iteration, generator and evaluator agree on specific success criteria. Apply: our planner outputs a contract, builder executes against it, evaluator scores against it. The contract is the source of truth, not the conversation.

**ADAPT:**
- **Harness simplification with model improvements.** The article notes Opus 4.6 eliminated need for sprint decomposition. Our harness should be designed with pluggable complexity -- start simple (single-pass with evaluator), add sprint decomposition only when task complexity demands it. Don't over-architect for today's models.

**REJECT:**
- **$200 cost for a single app.** The Retro Game Maker cost $200 over 6 hours. Our harness must have cost budgets and early-termination. Unbounded agent loops are a startup killer. Every agent invocation needs a token/cost ceiling.

---

## 6. code-execution-with-mcp.md (Anthropic Engineering)

**ADOPT:**
- **Progressive tool disclosure via filesystem.** Instead of loading all tool definitions upfront (150k tokens), organize tools as files that agents discover by navigating the filesystem. "From 150,000 tokens to 2,000 tokens -- a time and cost saving of 98.7%." Apply: our harness should present integrations as a directory tree (`servers/vercel/deploy.ts`, `servers/supabase/query.ts`) that agents explore on-demand. This directly solves the googleworkspace-cli's 90-skill problem.
- **Code APIs instead of direct tool calls.** Agents write code to call tools rather than using tool-calling syntax. Intermediate results stay in the execution environment without consuming context. Apply: for data-heavy operations (database queries, spreadsheet manipulation), our harness should have agents write and execute code rather than pass raw data through conversation context.

**ADAPT:**
- **Sandboxing is non-trivial.** The article handwaves "secure execution requires proper sandboxing, resource limits, and monitoring." For our harness, we need a concrete sandboxing strategy: Docker containers with resource limits for code execution, network policies for API access, timeout enforcement. This is real engineering work, not a bullet point.

**REJECT:**
- **Nothing.** This is the most directly applicable article. Every pattern here maps cleanly to our harness architecture.

---

## 7. writing-tools-for-agents.md (Anthropic Engineering)

**ADOPT:**
- **Eval-driven tool design loop.** Build prototype -> run evaluations -> use Claude to analyze transcripts and optimize. Mechanism: programmatic testing with multi-step real-world tasks, measuring accuracy + runtime + token consumption + error rates. Apply: every tool/skill we add to our harness gets an eval suite before shipping. No tool ships without measured performance on representative tasks.
- **`response_format` parameter.** Let agents request "concise" or "detailed" responses from tools. Apply: our harness tools should default to concise (save tokens) with an opt-in detailed mode when the agent needs more context.
- **Namespacing with consistent prefixes.** Group tools as `vercel_deploy`, `vercel_logs`, `supabase_query`, `supabase_migrate`. Apply: mandatory naming convention for all harness tools.

**ADAPT:**
- **25,000 token response cap.** Claude Code restricts tool responses to 25k tokens. Our harness should enforce this but also provide streaming/pagination for tools that naturally produce large outputs (log tailing, database queries). The cap should be configurable per tool, not global.

**REJECT:**
- **Nothing significant.** This article is practical and directly applicable. The only minor quibble: the "use Claude itself to optimize tools" feedback loop assumes you have budget for meta-optimization. For early-stage, manual tool iteration is fine until you have enough eval data to justify automated optimization.

---

## Cross-Cutting Synthesis: Top 5 Patterns for Our Harness

1. **Schema-driven tool generation** (googleworkspace-cli) + **progressive filesystem disclosure** (code-execution-with-mcp) = auto-generate tools from OpenAPI specs, load on-demand via filesystem navigation
2. **Generator-evaluator split** (harness-design article) + **sprint contracts** = mandatory architecture for any multi-step task
3. **Karpathy behavioral rules** as inherited base skill for all agents = anti-slop defense
4. **Agent self-evolution** (claude-code-best-practice presentation-curator) = agents update their own skill files after learning
5. **Eval-driven tool design** (writing-tools article) + **response_format parameter** = every tool ships with evals and supports concise/detailed modes
