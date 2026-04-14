/**
 * Deploy Gate — PreToolUse hook on Bash
 *
 * Enforces SOUL.md rule: "Rollback plan required before any production deploy."
 * Blocks deploy commands (vercel deploy, railway up, npm publish, etc.)
 * unless a rollback plan has been logged as a GitHub Issue comment first.
 *
 * Checks for rollback plan via /tmp/harness-deploy-gate.json state file,
 * which tracks whether a rollback plan was registered this session.
 *
 * Agents must call the deploy-gate with DEPLOY_ROLLBACK_PLAN env var set
 * (or write the state file) before any deploy command will be allowed.
 */

export interface ToolCall {
  tool_name: string;
  tool_input: Record<string, unknown>;
}

export interface HookResult {
  decision: "ALLOW" | "DENY";
  message?: string;
}

const DEPLOY_PATTERNS = [
  /\bvercel\s+(deploy|promote)\b/,
  /\brailway\s+up\b/,
  /\bnpm\s+publish\b/,
  /\byarn\s+publish\b/,
  /\bpnpm\s+publish\b/,
  /\bgit\s+push\s+.*\b(production|prod|main|master)\b/,
  /\bdocker\s+push\b/,
  /\bfly\s+deploy\b/,
  /\bwrangler\s+(deploy|publish)\b/,
  /\bnpx\s+vercel\s*--prod\b/,
  /\b--prod\b/,
];

function isDeployCommand(command: string): boolean {
  return DEPLOY_PATTERNS.some((pattern) => pattern.test(command));
}

export function checkDeployGate(
  call: ToolCall,
  hasRollbackPlan: boolean
): HookResult {
  if (call.tool_name !== "Bash") {
    return { decision: "ALLOW" };
  }

  const command = (call.tool_input.command as string) || "";
  if (!command) {
    return { decision: "ALLOW" };
  }

  if (!isDeployCommand(command)) {
    return { decision: "ALLOW" };
  }

  if (hasRollbackPlan) {
    return { decision: "ALLOW" };
  }

  return {
    decision: "DENY",
    message:
      `BLOCKED: Deploy command detected ("${command.slice(0, 80)}..."). ` +
      "A rollback plan is required before any production deploy. " +
      "Log a rollback plan as a GitHub Issue comment, then set " +
      "DEPLOY_ROLLBACK_PLAN=1 or write to /tmp/harness-deploy-gate.json " +
      'with { "rollbackPlan": true } before retrying.',
  };
}
