#!/usr/bin/env node
/**
 * Skill Configuration Manager — CLI for enabling/disabling skills
 * and managing custom skill chains.
 *
 * Runtime-agnostic: works with both Claude Code and Codex CLI.
 *
 * Usage:
 *   node .harness/hooks/skill-config.mjs list
 *   node .harness/hooks/skill-config.mjs enable <skill-name>
 *   node .harness/hooks/skill-config.mjs disable <skill-name>
 *   node .harness/hooks/skill-config.mjs status <skill-name>
 *   node .harness/hooks/skill-config.mjs chain list
 *   node .harness/hooks/skill-config.mjs chain create <name> <trigger> <description>
 *   node .harness/hooks/skill-config.mjs chain add-phase <chain> <phase-name> <skill1,skill2,...>
 *   node .harness/hooks/skill-config.mjs chain add-gates <chain> <pattern1,pattern2,...>
 *   node .harness/hooks/skill-config.mjs chain delete <name>
 *   node .harness/hooks/skill-config.mjs chain show <name>
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { getProjectRoot } from './runtime.mjs';

const PROJECT_ROOT = getProjectRoot();
const SKILLS_YML = join(PROJECT_ROOT, '.harness', 'skills.yml');
const SKILLS_DIR = join(PROJECT_ROOT, 'skills');
const CHAINS_JSON = join(PROJECT_ROOT, 'chains', 'skill-chains.json');

function parseSimpleYaml(content) {
  const result = { disabled: [], chains: {} };
  let currentSection = null;
  let currentChain = null;
  let currentListKey = null;
  let currentPhase = null;

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || trimmed === '') continue;
    const indent = line.length - line.trimStart().length;

    if (trimmed === 'disabled:' || trimmed === 'disabled: []') {
      currentSection = 'disabled';
      currentChain = null;
      if (trimmed === 'disabled: []') result.disabled = [];
      continue;
    }
    if (trimmed === 'chains:' || trimmed === 'chains: {}') {
      currentSection = 'chains';
      currentChain = null;
      if (trimmed === 'chains: {}') result.chains = {};
      continue;
    }

    if (currentSection === 'disabled' && trimmed.startsWith('- ')) {
      result.disabled.push(trimmed.slice(2).trim());
      continue;
    }

    if (currentSection === 'chains') {
      if (indent === 2 && trimmed.endsWith(':')) {
        currentChain = trimmed.slice(0, -1);
        result.chains[currentChain] = { description: '', trigger: '', gates: [], phases: [] };
        currentListKey = null;
        currentPhase = null;
        continue;
      }
      if (!currentChain) continue;

      if (indent === 4) {
        if (trimmed.startsWith('description:')) {
          result.chains[currentChain].description = trimmed.slice(12).trim().replace(/^["']|["']$/g, '');
          currentListKey = null;
        } else if (trimmed.startsWith('trigger:')) {
          result.chains[currentChain].trigger = trimmed.slice(8).trim();
          currentListKey = null;
        } else if (trimmed === 'gates:') {
          currentListKey = 'gates';
          currentPhase = null;
        } else if (trimmed === 'phases:') {
          currentListKey = 'phases';
          currentPhase = null;
        }
        continue;
      }

      if (indent === 6 && trimmed.startsWith('- ')) {
        const val = trimmed.slice(2).trim();
        if (currentListKey === 'gates') {
          result.chains[currentChain].gates.push(val);
        } else if (currentListKey === 'phases') {
          if (val.startsWith('name:')) {
            currentPhase = { name: val.slice(5).trim(), required: [] };
            result.chains[currentChain].phases.push(currentPhase);
          }
        }
        continue;
      }

      if (indent === 8 && currentPhase && trimmed.startsWith('required:')) {
        const bracketMatch = trimmed.match(/\[([^\]]*)\]/);
        if (bracketMatch) {
          currentPhase.required = bracketMatch[1].split(',').map(s => s.trim()).filter(Boolean);
        }
        continue;
      }
    }
  }

  return result;
}

function serializeYaml(config) {
  let out = '# Skill Configuration\n';
  out += '# Controls which skills are active and defines custom skill chains.\n';
  out += '# Read by .harness/hooks/setup.mjs and .harness/hooks/skill-config.mjs.\n\n';

  if (config.disabled.length === 0) {
    out += 'disabled: []\n';
  } else {
    out += 'disabled:\n';
    for (const s of config.disabled.sort()) {
      out += `  - ${s}\n`;
    }
  }

  out += '\n';

  const chainNames = Object.keys(config.chains);
  if (chainNames.length === 0) {
    out += 'chains: {}\n';
  } else {
    out += 'chains:\n';
    for (const name of chainNames) {
      const chain = config.chains[name];
      out += `  ${name}:\n`;
      out += `    description: "${chain.description}"\n`;
      out += `    trigger: ${chain.trigger}\n`;
      if (chain.gates && chain.gates.length > 0) {
        out += `    gates:\n`;
        for (const g of chain.gates) {
          out += `      - ${g}\n`;
        }
      }
      if (chain.phases && chain.phases.length > 0) {
        out += `    phases:\n`;
        for (const phase of chain.phases) {
          out += `      - name: ${phase.name}\n`;
          out += `        required: [${phase.required.join(', ')}]\n`;
        }
      }
    }
  }

  return out;
}

function loadConfig() {
  if (!existsSync(SKILLS_YML)) {
    return { disabled: [], chains: {} };
  }
  return parseSimpleYaml(readFileSync(SKILLS_YML, 'utf-8'));
}

function saveConfig(config) {
  writeFileSync(SKILLS_YML, serializeYaml(config));
}

function listAllSkills() {
  if (!existsSync(SKILLS_DIR)) return [];
  return readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();
}

function loadBuiltinChains() {
  if (!existsSync(CHAINS_JSON)) return {};
  try {
    return JSON.parse(readFileSync(CHAINS_JSON, 'utf-8')).flows || {};
  } catch {
    return {};
  }
}

function cmdList() {
  const config = loadConfig();
  const allSkills = listAllSkills();
  const disabledSet = new Set(config.disabled);

  const enabled = allSkills.filter(s => !disabledSet.has(s));
  const disabled = allSkills.filter(s => disabledSet.has(s));

  console.log(`Skills: ${allSkills.length} total, ${enabled.length} enabled, ${disabled.length} disabled\n`);

  if (disabled.length > 0) {
    console.log('Disabled:');
    for (const s of disabled) {
      console.log(`  - ${s}`);
    }
    console.log('');
  }

  console.log(`Enabled: ${enabled.length} skills (all others)`);
}

function cmdEnable(name) {
  const allSkills = listAllSkills();
  if (!allSkills.includes(name)) {
    console.error(`Skill "${name}" not found. Available: ${allSkills.length} skills.`);
    process.exit(1);
  }

  const config = loadConfig();
  const idx = config.disabled.indexOf(name);
  if (idx === -1) {
    console.log(`Skill "${name}" is already enabled.`);
    return;
  }

  config.disabled.splice(idx, 1);
  saveConfig(config);
  console.log(`Enabled skill: ${name}`);
}

function cmdDisable(name) {
  const allSkills = listAllSkills();
  if (!allSkills.includes(name)) {
    console.error(`Skill "${name}" not found. Available: ${allSkills.length} skills.`);
    process.exit(1);
  }

  const config = loadConfig();
  if (config.disabled.includes(name)) {
    console.log(`Skill "${name}" is already disabled.`);
    return;
  }

  config.disabled.push(name);
  saveConfig(config);
  console.log(`Disabled skill: ${name}`);
}

function cmdStatus(name) {
  const allSkills = listAllSkills();
  if (!allSkills.includes(name)) {
    console.error(`Skill "${name}" not found.`);
    process.exit(1);
  }

  const config = loadConfig();
  const isDisabled = config.disabled.includes(name);
  console.log(`${name}: ${isDisabled ? 'DISABLED' : 'ENABLED'}`);
}

function cmdChainList() {
  const builtinChains = loadBuiltinChains();
  const config = loadConfig();

  const builtinNames = Object.keys(builtinChains);
  const customNames = Object.keys(config.chains);

  console.log(`Skill Chains: ${builtinNames.length} built-in, ${customNames.length} custom\n`);

  if (builtinNames.length > 0) {
    console.log('Built-in chains (chains/skill-chains.json):');
    for (const name of builtinNames) {
      const chain = builtinChains[name];
      const phaseCount = chain.phases?.length || 0;
      console.log(`  ${name} (${phaseCount} phases) — ${chain.description}`);
    }
    console.log('');
  }

  if (customNames.length > 0) {
    console.log('Custom chains (.harness/skills.yml):');
    for (const name of customNames) {
      const chain = config.chains[name];
      const phaseCount = chain.phases?.length || 0;
      console.log(`  ${name} (${phaseCount} phases) — ${chain.description}`);
    }
  } else {
    console.log('No custom chains defined.');
  }
}

function cmdChainCreate(name, trigger, description) {
  if (!name) {
    console.error('Usage: skill-config.mjs chain create <name> <trigger-skill> <description>');
    process.exit(1);
  }

  const allSkills = listAllSkills();
  if (trigger && !allSkills.includes(trigger)) {
    console.error(`Trigger skill "${trigger}" not found.`);
    process.exit(1);
  }

  const config = loadConfig();
  if (config.chains[name]) {
    console.error(`Chain "${name}" already exists. Delete it first or choose a different name.`);
    process.exit(1);
  }

  const builtinChains = loadBuiltinChains();
  if (builtinChains[name]) {
    console.error(`Chain "${name}" is a built-in chain and cannot be overridden.`);
    process.exit(1);
  }

  config.chains[name] = {
    description: description || `Custom chain: ${name}`,
    trigger: trigger || '',
    gates: [],
    phases: [],
  };

  saveConfig(config);
  console.log(`Created chain: ${name}`);
  console.log(`Next steps:`);
  console.log(`  node .harness/hooks/skill-config.mjs chain add-gates ${name} "src/**,app/**"`);
  console.log(`  node .harness/hooks/skill-config.mjs chain add-phase ${name} build skill1,skill2`);
}

function cmdChainAddPhase(chainName, phaseName, skillsCsv) {
  if (!chainName || !phaseName || !skillsCsv) {
    console.error('Usage: skill-config.mjs chain add-phase <chain> <phase-name> <skill1,skill2,...>');
    process.exit(1);
  }

  const config = loadConfig();
  if (!config.chains[chainName]) {
    console.error(`Chain "${chainName}" not found in custom chains.`);
    process.exit(1);
  }

  const skills = skillsCsv.split(',').map(s => s.trim()).filter(Boolean);
  const allSkills = listAllSkills();
  for (const s of skills) {
    if (!allSkills.includes(s)) {
      console.error(`Skill "${s}" not found.`);
      process.exit(1);
    }
  }

  config.chains[chainName].phases.push({
    name: phaseName,
    required: skills,
  });

  saveConfig(config);
  console.log(`Added phase "${phaseName}" to chain "${chainName}" with skills: ${skills.join(', ')}`);
}

function cmdChainAddGates(chainName, patternsCsv) {
  if (!chainName || !patternsCsv) {
    console.error('Usage: skill-config.mjs chain add-gates <chain> <pattern1,pattern2,...>');
    process.exit(1);
  }

  const config = loadConfig();
  if (!config.chains[chainName]) {
    console.error(`Chain "${chainName}" not found in custom chains.`);
    process.exit(1);
  }

  const patterns = patternsCsv.split(',').map(s => s.trim()).filter(Boolean);
  config.chains[chainName].gates.push(...patterns);

  saveConfig(config);
  console.log(`Added gates to chain "${chainName}": ${patterns.join(', ')}`);
}

function cmdChainDelete(name) {
  if (!name) {
    console.error('Usage: skill-config.mjs chain delete <name>');
    process.exit(1);
  }

  const config = loadConfig();
  if (!config.chains[name]) {
    console.error(`Chain "${name}" not found in custom chains. Built-in chains cannot be deleted.`);
    process.exit(1);
  }

  delete config.chains[name];
  saveConfig(config);
  console.log(`Deleted chain: ${name}`);
}

function cmdChainShow(name) {
  if (!name) {
    console.error('Usage: skill-config.mjs chain show <name>');
    process.exit(1);
  }

  const builtinChains = loadBuiltinChains();
  const config = loadConfig();
  const chain = config.chains[name] || builtinChains[name];

  if (!chain) {
    console.error(`Chain "${name}" not found.`);
    process.exit(1);
  }

  const source = config.chains[name] ? 'custom' : 'built-in';
  console.log(`Chain: ${name} (${source})`);
  console.log(`Description: ${chain.description}`);
  console.log(`Trigger: ${chain.trigger_skill || chain.trigger || 'none'}`);

  const gates = chain.gate_patterns || chain.gates || [];
  if (gates.length > 0) {
    console.log(`Gates: ${gates.join(', ')}`);
  }

  const phases = chain.phases || [];
  if (phases.length > 0) {
    console.log(`\nPhases (${phases.length}):`);
    for (let i = 0; i < phases.length; i++) {
      const p = phases[i];
      const skills = p.required || p.oneOf || (p.anyOf ? p.anyOf.of : []);
      const mode = p.required ? 'all required' : p.oneOf ? 'one of' : p.anyOf ? `${p.anyOf.min} of` : '';
      console.log(`  ${i + 1}. ${p.name} — ${skills.join(', ')} (${mode})`);
    }
  }
}

// --- CLI dispatch ---
const [,, cmd, ...args] = process.argv;

switch (cmd) {
  case 'list':
    cmdList();
    break;
  case 'enable':
    cmdEnable(args[0]);
    break;
  case 'disable':
    cmdDisable(args[0]);
    break;
  case 'status':
    cmdStatus(args[0]);
    break;
  case 'chain':
    switch (args[0]) {
      case 'list':
        cmdChainList();
        break;
      case 'create':
        cmdChainCreate(args[1], args[2], args.slice(3).join(' '));
        break;
      case 'add-phase':
        cmdChainAddPhase(args[1], args[2], args[3]);
        break;
      case 'add-gates':
        cmdChainAddGates(args[1], args[2]);
        break;
      case 'delete':
        cmdChainDelete(args[1]);
        break;
      case 'show':
        cmdChainShow(args[1]);
        break;
      default:
        console.error('Unknown chain command. Use: list, create, add-phase, add-gates, delete, show');
        process.exit(1);
    }
    break;
  default:
    console.log('Skill Configuration Manager');
    console.log('');
    console.log('Usage:');
    console.log('  node .harness/hooks/skill-config.mjs list');
    console.log('  node .harness/hooks/skill-config.mjs enable <name>');
    console.log('  node .harness/hooks/skill-config.mjs disable <name>');
    console.log('  node .harness/hooks/skill-config.mjs status <name>');
    console.log('  node .harness/hooks/skill-config.mjs chain list');
    console.log('  node .harness/hooks/skill-config.mjs chain create <name> <trigger> <description>');
    console.log('  node .harness/hooks/skill-config.mjs chain add-phase <chain> <phase> <skill1,skill2>');
    console.log('  node .harness/hooks/skill-config.mjs chain add-gates <chain> <pattern1,pattern2>');
    console.log('  node .harness/hooks/skill-config.mjs chain delete <name>');
    console.log('  node .harness/hooks/skill-config.mjs chain show <name>');
    break;
}
