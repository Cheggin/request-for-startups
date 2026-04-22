#!/usr/bin/env node
/**
 * Harness Setup — detects runtime (Claude Code or Codex CLI) and generates
 * the appropriate configuration files pointing to .harness/hooks/.
 *
 * Usage: node .harness/hooks/setup.mjs [--runtime claude|codex|both]
 *
 * Without --runtime, auto-detects based on installed CLI tools.
 * With --runtime both, generates configs for both runtimes.
 */

import { execSync } from 'node:child_process';
import {
  existsSync, mkdirSync, writeFileSync, readFileSync,
  symlinkSync, lstatSync, unlinkSync,
} from 'node:fs';
import { join, relative } from 'node:path';

const PROJECT_ROOT = process.cwd();
const HARNESS_DIR = join(PROJECT_ROOT, '.harness');
const HOOKS_DIR = join(HARNESS_DIR, 'hooks');
const CLAUDE_DIR = join(PROJECT_ROOT, '.claude');
const CODEX_DIR = join(PROJECT_ROOT, '.codex');
const AGENTS_SKILLS_DIR = join(PROJECT_ROOT, '.agents', 'skills');
const SKILLS_DIR = join(PROJECT_ROOT, 'skills');

const SKILLS_YML = join(HARNESS_DIR, 'skills.yml');

function log(msg) {
  console.log(`[harness-setup] ${msg}`);
}

function loadDisabledHooks() {
  if (!existsSync(SKILLS_YML)) return new Set();
  const content = readFileSync(SKILLS_YML, 'utf-8');
  const hooks = [];
  let inHooks = false;
  let inDisabled = false;
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    const indent = line.length - line.trimStart().length;
    if (indent === 0 && trimmed === 'hooks:') { inHooks = true; inDisabled = false; continue; }
    if (indent === 0 && !trimmed.startsWith('#') && trimmed !== '') { inHooks = false; continue; }
    if (inHooks && trimmed.startsWith('disabled:')) { inDisabled = true; if (trimmed === 'disabled: []') break; continue; }
    if (inHooks && inDisabled && trimmed.startsWith('- ')) { hooks.push(trimmed.slice(2).trim()); continue; }
    if (inHooks && inDisabled && indent <= 2 && !trimmed.startsWith('-')) break;
  }
  return new Set(hooks);
}

function isHookEnabled(name, disabledSet) {
  return !disabledSet.has(name);
}

function detectRuntime() {
  const runtimes = [];
  try {
    execSync('which claude', { stdio: 'ignore' });
    runtimes.push('claude');
  } catch { /* not found */ }
  try {
    execSync('which codex', { stdio: 'ignore' });
    runtimes.push('codex');
  } catch { /* not found */ }
  return runtimes;
}

function generateClaudeSettings() {
  const hooksRelative = '.harness/hooks';
  const disabled = loadDisabledHooks();

  function h(name, cmd) {
    if (!isHookEnabled(name, disabled)) return null;
    return { type: 'command', command: cmd };
  }

  const stopHooks = [
    h('inter-agent-signal', `node ${hooksRelative}/inter-agent-signal.mjs`),
    h('auto-finish', `node ${hooksRelative}/auto-finish.mjs`),
  ].filter(Boolean);

  const permHooks = [
    h('inter-agent-signal', `node ${hooksRelative}/inter-agent-signal.mjs`),
  ].filter(Boolean);

  const editHooks = [
    h('config-protection', `node ${hooksRelative}/config-protection.mjs`),
    h('scope-enforcer', `node ${hooksRelative}/scope-enforcer.mjs`),
    h('metrics-gate', `node ${hooksRelative}/metrics-gate.mjs`),
  ].filter(Boolean);

  const writeHooks = [
    h('config-protection', `node ${hooksRelative}/config-protection.mjs`),
    h('scope-enforcer', `node ${hooksRelative}/scope-enforcer.mjs`),
    h('metrics-gate', `node ${hooksRelative}/metrics-gate.mjs`),
  ].filter(Boolean);

  const bashHooks = [
    h('log-commands', `bash ${hooksRelative}/log-commands.sh`),
    h('validate-commit-msg', `node ${hooksRelative}/validate-commit-msg.mjs`),
    h('validate-issue-create', `node ${hooksRelative}/validate-issue-create.mjs`),
    h('deploy-gate', `node ${hooksRelative}/deploy-gate.mjs`),
    h('metrics-gate', `node ${hooksRelative}/metrics-gate.mjs`),
    h('branch-enforcer', `node ${hooksRelative}/branch-enforcer.mjs`),
  ].filter(Boolean);

  const preToolUse = [];
  if (editHooks.length > 0) preToolUse.push({ matcher: 'Edit', hooks: editHooks });
  if (writeHooks.length > 0) preToolUse.push({ matcher: 'Write', hooks: writeHooks });
  if (bashHooks.length > 0) preToolUse.push({ matcher: 'Bash', hooks: bashHooks });

  const settings = { hooks: {} };
  if (stopHooks.length > 0) {
    settings.hooks.Stop = stopHooks.map(hook => ({ hooks: [hook] }));
  }
  if (permHooks.length > 0) {
    settings.hooks.PermissionRequest = [{ hooks: permHooks }];
  }
  if (preToolUse.length > 0) {
    settings.hooks.PreToolUse = preToolUse;
  }

  if (disabled.size > 0) {
    log(`Disabled hooks: ${[...disabled].join(', ')}`);
  }

  mkdirSync(CLAUDE_DIR, { recursive: true });
  const settingsPath = join(CLAUDE_DIR, 'settings.json');

  if (existsSync(settingsPath)) {
    try {
      const existing = JSON.parse(readFileSync(settingsPath, 'utf-8'));
      existing.hooks = settings.hooks;
      writeFileSync(settingsPath, JSON.stringify(existing, null, 2) + '\n');
      log('Updated .claude/settings.json hooks to point to .harness/hooks/');
    } catch {
      writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
      log('Wrote new .claude/settings.json');
    }
  } else {
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
    log('Created .claude/settings.json');
  }
}

function generateCodexConfig() {
  mkdirSync(CODEX_DIR, { recursive: true });

  const configToml = `# Codex CLI configuration — generated by harness setup
# Hooks point to .harness/hooks/ for runtime-agnostic enforcement

[features]
shell_tool = true
multi_agent = true
memories = true

# Skills discovery — point to project skills directory
[[skills.config]]
path = ".agents/skills"
enabled = true

# Hook integration via pre/post scripts
# Codex hooks are loaded from .codex/hooks/ when codex_hooks feature is enabled
`;

  const configPath = join(CODEX_DIR, 'config.toml');
  writeFileSync(configPath, configToml);
  log('Created .codex/config.toml');

  mkdirSync(join(CODEX_DIR, 'hooks'), { recursive: true });

  const hooksJson = {
    pre_tool_use: [
      {
        matcher: ["file_edit", "file_write"],
        command: "node .harness/hooks/config-protection.mjs"
      },
      {
        matcher: ["file_edit", "file_write"],
        command: "node .harness/hooks/scope-enforcer.mjs"
      },
      {
        matcher: ["file_edit", "file_write", "shell"],
        command: "node .harness/hooks/metrics-gate.mjs"
      },
      {
        matcher: ["shell"],
        command: "bash .harness/hooks/log-commands.sh"
      },
      {
        matcher: ["shell"],
        command: "node .harness/hooks/validate-commit-msg.mjs"
      },
      {
        matcher: ["shell"],
        command: "node .harness/hooks/validate-issue-create.mjs"
      },
      {
        matcher: ["shell"],
        command: "node .harness/hooks/deploy-gate.mjs"
      },
      {
        matcher: ["shell"],
        command: "node .harness/hooks/branch-enforcer.mjs"
      }
    ],
    on_stop: [
      { command: "node .harness/hooks/inter-agent-signal.mjs" },
      { command: "node .harness/hooks/auto-finish.mjs" }
    ],
    on_permission_request: [
      { command: "node .harness/hooks/inter-agent-signal.mjs" }
    ]
  };

  writeFileSync(
    join(CODEX_DIR, 'hooks.json'),
    JSON.stringify(hooksJson, null, 2) + '\n',
  );
  log('Created .codex/hooks.json');
}

function symlinkSkillsForCodex() {
  if (!existsSync(SKILLS_DIR)) {
    log('No skills/ directory found, skipping Codex skill symlinks');
    return;
  }

  mkdirSync(join(PROJECT_ROOT, '.agents'), { recursive: true });

  const target = relative(join(PROJECT_ROOT, '.agents'), SKILLS_DIR);

  if (existsSync(AGENTS_SKILLS_DIR)) {
    try {
      const stat = lstatSync(AGENTS_SKILLS_DIR);
      if (stat.isSymbolicLink()) {
        unlinkSync(AGENTS_SKILLS_DIR);
      } else {
        log('.agents/skills/ exists and is not a symlink, skipping');
        return;
      }
    } catch {
      log('.agents/skills/ check failed, skipping');
      return;
    }
  }

  symlinkSync(target, AGENTS_SKILLS_DIR);
  log(`Symlinked .agents/skills/ -> ${target}`);
}

function generateAgentsMd() {
  const claudeMdPath = join(PROJECT_ROOT, 'CLAUDE.md');
  let projectRules = '';

  if (existsSync(claudeMdPath)) {
    projectRules = readFileSync(claudeMdPath, 'utf-8');
  }

  const agentsMd = `# AGENTS.md — Runtime-Agnostic Agent Coordination Contract

## Operating Principles

- Solve tasks directly when safe; delegate only when it materially improves quality or speed.
- Verify before claiming completion.
- Never skip phases in multi-phase skill workflows.

## Skill Invocation

Skills are invoked via their registered command:
- **Claude Code**: \`/startup-harness:<skill-name>\`
- **Codex CLI**: \`$<skill-name>\`

Never interpret a skill name as a description and freestyle the implementation.
Every phase defined in the skill must execute in order.

## Agent Categories & Scope Enforcement

Agent scopes are enforced by \`.harness/hooks/scope-enforcer.mjs\`.
Agent definitions live in \`.harness/agents/<name>.json\`.
Categories: coding, content, growth, operations, orchestration, quality.

## Hook Governance

All hooks live in \`.harness/hooks/\` and work with both Claude Code and Codex CLI.
Tool name normalization handles the mapping (Edit/file_edit, Bash/shell, etc.).

### Active Hooks
- **scope-enforcer**: File access control per agent category
- **config-protection**: Blocks edits to infrastructure configs
- **auto-finish**: Auto-commits and closes issues on session stop
- **inter-agent-signal**: Writes completion/approval state files
- **deploy-gate**: Requires rollback plan before deploys
- **branch-enforcer**: Blocks direct pushes to main/master
- **metrics-gate**: Requires hypothesis for growth agent actions
- **validate-commit-msg**: Conventional Commits format enforcement
- **validate-issue-create**: GitHub Issue schema enforcement
- **log-commands**: Command audit trail

## Inter-Agent Communication

- Signal files: \`.harness/signals/<agent>.done\` / \`.harness/signals/<agent>.needs-approval\`
- Handoff docs: \`.harness/handoffs/\`
- Knowledge base: \`.harness/knowledge/\`

## Verification

Before concluding: confirm no pending work, features function, tests pass.
If not met, continue rather than stop prematurely.

${projectRules ? '## Project Rules (from CLAUDE.md)\n\n' + projectRules : ''}
`;

  writeFileSync(join(PROJECT_ROOT, 'AGENTS.md'), agentsMd);
  log('Generated AGENTS.md');
}

function main() {
  const args = process.argv.slice(2);
  const runtimeFlag = args.indexOf('--runtime');
  let targetRuntimes;

  if (runtimeFlag !== -1 && args[runtimeFlag + 1]) {
    const val = args[runtimeFlag + 1];
    if (val === 'both') {
      targetRuntimes = ['claude', 'codex'];
    } else {
      targetRuntimes = [val];
    }
  } else {
    targetRuntimes = detectRuntime();
    if (targetRuntimes.length === 0) {
      log('No supported runtime detected (claude or codex). Use --runtime to specify.');
      process.exit(1);
    }
  }

  log(`Detected runtimes: ${targetRuntimes.join(', ')}`);
  log(`Project root: ${PROJECT_ROOT}`);
  log(`Hooks directory: ${HOOKS_DIR}`);

  if (!existsSync(HOOKS_DIR)) {
    console.error('[harness-setup] ERROR: .harness/hooks/ not found. Run from project root.');
    process.exit(1);
  }

  if (targetRuntimes.includes('claude')) {
    generateClaudeSettings();
  }

  if (targetRuntimes.includes('codex')) {
    generateCodexConfig();
    symlinkSkillsForCodex();
    generateAgentsMd();
  }

  // Always generate AGENTS.md if it doesn't exist (useful for both runtimes)
  if (!existsSync(join(PROJECT_ROOT, 'AGENTS.md'))) {
    generateAgentsMd();
  }

  log('Setup complete.');
  log('');
  log('Hook registration:');
  if (targetRuntimes.includes('claude')) {
    log('  Claude Code: .claude/settings.json -> .harness/hooks/*');
  }
  if (targetRuntimes.includes('codex')) {
    log('  Codex CLI:   .codex/hooks.json -> .harness/hooks/*');
    log('  Skills:      .agents/skills/ -> skills/');
    log('  Instructions: AGENTS.md');
  }
}

main();
