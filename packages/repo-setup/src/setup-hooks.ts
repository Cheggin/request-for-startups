import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export interface HookConfig {
  event: string;
  pattern?: string;
  command: string;
}

export interface ClaudeSettings {
  permissions?: {
    allow?: string[];
    deny?: string[];
  };
  hooks?: {
    [event: string]: Array<{
      pattern?: string;
      command: string;
    }>;
  };
}

const DEFAULT_HOOKS: HookConfig[] = [
  {
    event: "PreToolUse",
    pattern: "Edit|Write",
    command: "node packages/hooks/dist/gateguard.js",
  },
  {
    event: "PreToolUse",
    pattern: "Edit|Write",
    command: "node packages/hooks/dist/config-protection.js",
  },
  {
    event: "PostToolUse",
    command: "node packages/hooks/dist/budget-enforcer.js",
  },
  {
    event: "Stop",
    command: "node packages/hooks/dist/run-inter-agent-signal.js",
  },
  {
    event: "PermissionRequest",
    command: "node packages/hooks/dist/run-inter-agent-signal.js",
  },
];

export function buildClaudeSettings(
  hooks: HookConfig[] = DEFAULT_HOOKS,
  existingSettings?: ClaudeSettings
): ClaudeSettings {
  const settings: ClaudeSettings = existingSettings
    ? { ...existingSettings }
    : {};

  if (!settings.hooks) {
    settings.hooks = {};
  }

  for (const hook of hooks) {
    if (!settings.hooks[hook.event]) {
      settings.hooks[hook.event] = [];
    }

    const entry: { pattern?: string; command: string } = {
      command: hook.command,
    };
    if (hook.pattern) {
      entry.pattern = hook.pattern;
    }

    const exists = settings.hooks[hook.event].some(
      (h) => h.command === hook.command && h.pattern === hook.pattern
    );
    if (!exists) {
      settings.hooks[hook.event].push(entry);
    }
  }

  return settings;
}

export function setupHooks(
  projectDir: string,
  hooks: HookConfig[] = DEFAULT_HOOKS
): void {
  const claudeDir = join(projectDir, ".claude");
  mkdirSync(claudeDir, { recursive: true });

  const settingsPath = join(claudeDir, "settings.json");
  let existingSettings: ClaudeSettings | undefined;

  if (existsSync(settingsPath)) {
    try {
      existingSettings = JSON.parse(readFileSync(settingsPath, "utf-8"));
    } catch {
      existingSettings = undefined;
    }
  }

  const settings = buildClaudeSettings(hooks, existingSettings);
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
}
