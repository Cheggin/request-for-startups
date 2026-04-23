# Agent Config Schema — `.harness/agents/*.json`

This is the authoritative schema for per-agent runtime configuration files.
Every tracked agent definition (`agents/<name>.md`) MUST have a corresponding
JSON config (`.harness/agents/<name>.json`) and vice versa.

## Schema

```typescript
interface AgentConfig {
  /** Agent name — must match the filename (without .json) */
  name: string;

  /** Human-readable description of the agent's role */
  description: string;

  /**
   * Category or categories from agent-categories.yml.
   * Single string for most agents, array for multi-category agents (e.g. ops).
   * Used by run-scope-enforcer.ts to determine allowed file paths.
   */
  category: string | string[];

  /**
   * MCP servers this agent requires at spawn time.
   * Empty object if none needed.
   */
  mcpServers: Record<string, {
    command: string;
    args: string[];
    env?: Record<string, string>;
  }>;

  /** Tools this agent is allowed to use */
  allowedTools: string[];

  /**
   * File access scope — which paths the agent can write, read, or is blocked from.
   * Used by hooks/scope-enforcer.mjs (the hook source of truth for agent write-scope enforcement).
   */
  fileScope: {
    /** Glob patterns the agent can modify */
    writable: string[];
    /** Glob patterns the agent can read but not modify */
    readonly: string[];
    /** Glob patterns the agent cannot access at all */
    blocked: string[];
  };

  /** Hook configurations specific to this agent */
  hooks: Record<string, {
    event?: string;
    description?: string;
    patterns?: string[];
    triggerPatterns?: string[];
    action?: string;
    turnLimit?: number;
    wallClockTimeout?: string;
  }>;

  /** Ground truth rules — non-negotiable behavioral constraints */
  rules: string[];
}
```

## Consumers

| Package | Field Used | Notes |
|---------|-----------|-------|
| `hooks/scope-enforcer.mjs` | `category` | Handles both `string` and `string[]` |

## Invariants

1. Every `agents/<name>.md` has a matching `.harness/agents/<name>.json`
2. Every `.harness/agents/<name>.json` has a matching `agents/<name>.md`
3. `fileScope` is always the object shape `{ writable, readonly, blocked }` — never a flat `string[]`
4. `category` may be a `string` or `string[]` — consumers must handle both
5. `agent-loader.ts writeAgentConfigs()` preserves rich fields when merging
