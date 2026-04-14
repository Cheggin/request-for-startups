---
name: agent-creator
description: Create new agent definitions with specific instruction sets, skill assignments, and behavioral rules. Use when the user wants a new type of agent (e.g., research-papers agent, customer-support agent, data-pipeline agent) or wants to modify an existing agent's behavior.
---

# Agent Creator

Generate complete agent definitions that plug into the harness. Each agent gets: a role prompt, assigned skills, ground truth rules, and a category in agent-categories.yml.

## When to Use

- User says "create an agent that..." or "I need an agent for..."
- User wants a specialized workflow automated (e.g., "read research papers", "monitor competitors daily")
- User wants to modify how an existing agent behaves

## Creation Flow

### Step 1: Interview (3 questions max)

1. **What does this agent do?** — one sentence purpose
2. **What inputs does it need?** — files, URLs, APIs, other agent output
3. **What does it produce?** — artifacts, reports, code changes, notifications

### Step 2: Determine Configuration

Based on the answers, determine:

- **Model**: haiku (simple/fast tasks), sonnet (coding/analysis), opus (complex reasoning/orchestration)
- **Level**: 1 (simple), 2 (standard), 3 (elevated), 4 (orchestrator)
- **Category**: which existing category fits, or create a new one
- **Skills**: which of the 91 skills this agent needs
- **Disallowed tools**: what the agent should NOT do (e.g., Write/Edit for read-only agents)
- **Activation condition**: when this agent should auto-spawn (optional)
- **Max turns**: budget limit

### Step 3: Generate Agent Definition

Write the agent file to `agents/<name>.md`:

```markdown
---
name: <agent-name>
description: <one-line description>
model: <claude-sonnet-4-6 | claude-opus-4-6 | claude-haiku-4-5>
level: <1-4>
maxTurns: <number>
disallowedTools: [<list>]
activationCondition: <optional condition>
---

<Agent_Prompt>
  <Role>
    You are the <name> agent. <detailed role description>.
  </Role>

  <Responsibilities>
    1. <responsibility 1>
    2. <responsibility 2>
    ...
  </Responsibilities>

  <Skills>
    You have access to these skills — use them:
    - <skill-1>: <when to use>
    - <skill-2>: <when to use>
    ...
  </Skills>

  <Rules>
    - <ground truth rule 1>
    - <ground truth rule 2>
    ...
  </Rules>

  <Output>
    <what artifacts this agent produces and where>
  </Output>
</Agent_Prompt>
```

### Step 4: Update agent-categories.yml

Add the agent to its category's `agents:` list. If creating a new category, define:
- `description`
- `agents`
- `skill_categories`
- `ground_truth`
- `required_mcp`
- `required_hooks`

### Step 5: Add Spawn Logic

If the agent should auto-spawn during `harness init`, add it to the appropriate phase in `packages/cli/src/commands/init.ts`.

If it's an on-demand agent, add a CLI command: `harness agent spawn <name>`.

## Example Agents

### Research Papers Agent
```
name: paper-reader
model: claude-opus-4-6
level: 3
Skills: research, deep-dive, wiki
Purpose: Read academic papers, extract key findings, update knowledge wiki
Output: .harness/knowledge/papers/<paper-name>.md
```

### Customer Feedback Agent
```
name: feedback-analyst
model: claude-sonnet-4-6
level: 2
Skills: user-feedback-collector, analytics-integration, social-intelligence
Purpose: Aggregate feedback from in-app widget, social media, support tickets
Output: feedback-report.md + GitHub Issues for actionable items
```

### Security Auditor Agent
```
name: security-auditor
model: claude-sonnet-4-6
level: 2
disallowedTools: [Write, Edit]
Skills: security-scanner, convex-security-audit, convex-security-check, audit
Purpose: Read-only security review of entire codebase
Output: .harness/security-report.md with P0-P3 severity ratings
```

## Anti-Patterns

- Creating agents that overlap with existing ones (check agents/ first)
- Giving agents too many skills (focused > broad)
- Using opus for simple tasks (haiku/sonnet are cheaper and faster)
- Agents without clear output artifacts (what does "done" look like?)
- Agents with Write/Edit access that don't need it (read-only is safer)
- Agents without ground truth rules (they WILL drift without constraints)
