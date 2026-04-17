#!/usr/bin/env node
/**
 * Plugin load-test — validates that startup-harness is shaped correctly
 * for Claude Code to discover every skill, agent, hook, and chain.
 *
 * Exits 1 and prints a diagnostic if anything is off; otherwise prints a
 * one-line summary and exits 0. Safe to wire into CI.
 *
 * What it checks:
 *   1. .claude-plugin/plugin.json parses and has name, version, description
 *   2. .claude-plugin/marketplace.json parses and declares a plugin whose
 *      name matches plugin.json's name
 *   3. hooks/hooks.json parses; every referenced .mjs passes node --check
 *   4. Every skills/<name>/SKILL.md has frontmatter with name + description
 *   5. Every agents/<name>.md has frontmatter with name + description
 *   6. chains/skill-chains.json parses, every flow has the required shape,
 *      every referenced skill exists in skills/
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const errors = [];
function fail(msg) { errors.push(msg); }

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch (err) {
    fail(`${path}: ${err.message}`);
    return null;
  }
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const fm = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;
    let value = kv[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    fm[kv[1]] = value;
  }
  return fm;
}

// 1. plugin.json
const pluginJson = readJson(join(ROOT, '.claude-plugin', 'plugin.json'));
let pluginName = null;
if (pluginJson) {
  if (!pluginJson.name) fail('plugin.json: missing "name"');
  if (!pluginJson.version) fail('plugin.json: missing "version"');
  if (!pluginJson.description) fail('plugin.json: missing "description"');
  pluginName = pluginJson.name;
}

// 2. marketplace.json
const marketplace = readJson(join(ROOT, '.claude-plugin', 'marketplace.json'));
if (marketplace) {
  if (!Array.isArray(marketplace.plugins) || marketplace.plugins.length === 0) {
    fail('marketplace.json: plugins[] missing or empty');
  } else if (pluginName && !marketplace.plugins.some((p) => p.name === pluginName)) {
    fail(`marketplace.json: no plugin entry with name "${pluginName}"`);
  }
}

// 3. hooks.json + node --check every referenced .mjs
const hooksJson = readJson(join(ROOT, 'hooks', 'hooks.json'));
const hookFiles = new Set();
if (hooksJson?.hooks) {
  for (const list of Object.values(hooksJson.hooks)) {
    for (const entry of list) {
      for (const hook of entry.hooks || []) {
        const cmd = hook.command || '';
        const match = cmd.match(/\$\{CLAUDE_PLUGIN_ROOT\}\/(\S+\.mjs)/);
        if (match) hookFiles.add(match[1]);
      }
    }
  }
}
for (const relPath of hookFiles) {
  const abs = join(ROOT, relPath);
  if (!existsSync(abs)) {
    fail(`hooks.json references ${relPath} but file does not exist`);
    continue;
  }
  const check = spawnSync(process.execPath, ['--check', abs], { encoding: 'utf-8' });
  if (check.status !== 0) {
    fail(`${relPath}: node --check failed:\n${check.stderr.trim()}`);
  }
}

// 4. Every skills/<name>/SKILL.md
const SKILLS_DIR = join(ROOT, 'skills');
let skillCount = 0;
const skillNames = new Set();
if (existsSync(SKILLS_DIR)) {
  for (const name of readdirSync(SKILLS_DIR)) {
    const skillMd = join(SKILLS_DIR, name, 'SKILL.md');
    if (!existsSync(skillMd)) continue;
    skillCount++;
    skillNames.add(name);
    const fm = parseFrontmatter(readFileSync(skillMd, 'utf-8'));
    if (!fm) {
      fail(`skills/${name}/SKILL.md: no frontmatter`);
      continue;
    }
    if (!fm.name) fail(`skills/${name}/SKILL.md: frontmatter missing "name"`);
    if (!fm.description) fail(`skills/${name}/SKILL.md: frontmatter missing "description"`);
  }
}

// 5. Every agents/<name>.md
const AGENTS_DIR = join(ROOT, 'agents');
let agentCount = 0;
if (existsSync(AGENTS_DIR)) {
  for (const name of readdirSync(AGENTS_DIR)) {
    if (!name.endsWith('.md')) continue;
    agentCount++;
    const fm = parseFrontmatter(readFileSync(join(AGENTS_DIR, name), 'utf-8'));
    if (!fm) {
      fail(`agents/${name}: no frontmatter`);
      continue;
    }
    if (!fm.name) fail(`agents/${name}: frontmatter missing "name"`);
    if (!fm.description) fail(`agents/${name}: frontmatter missing "description"`);
  }
}

// 6. chains/skill-chains.json — structural + referenced skills exist
const chainsFile = join(ROOT, 'chains', 'skill-chains.json');
let flowCount = 0;
if (existsSync(chainsFile)) {
  const chains = readJson(chainsFile);
  if (chains && chains.flows && typeof chains.flows === 'object') {
    for (const [flowName, flow] of Object.entries(chains.flows)) {
      flowCount++;
      if (!flow.trigger_skill) {
        fail(`chains flow "${flowName}": missing trigger_skill`);
        continue;
      }
      if (!skillNames.has(flow.trigger_skill)) {
        fail(`chains flow "${flowName}": trigger_skill "${flow.trigger_skill}" not found in skills/`);
      }
      if (!Array.isArray(flow.phases)) {
        fail(`chains flow "${flowName}": phases[] missing`);
        continue;
      }
      for (const phase of flow.phases) {
        const listed = phase.required || phase.oneOf || phase.anyOf?.of;
        if (!Array.isArray(listed)) {
          fail(`chains flow "${flowName}" phase "${phase.name}": no required/oneOf/anyOf`);
          continue;
        }
        for (const s of listed) {
          if (!skillNames.has(s)) {
            fail(`chains flow "${flowName}" phase "${phase.name}": skill "${s}" not found in skills/`);
          }
        }
      }
    }
  }
}

// Summary
if (errors.length > 0) {
  console.error('[validate-plugin] FAILED with', errors.length, 'error(s):');
  for (const e of errors) console.error('  -', e);
  process.exit(1);
}

console.log(
  `[validate-plugin] OK — plugin=${pluginName}@${pluginJson?.version}, ` +
  `${skillCount} skills, ${agentCount} agents, ${hookFiles.size} hooks, ${flowCount} chain flow(s)`,
);
