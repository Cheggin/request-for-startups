import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { isPathAllowed } from './scope-enforcer.mjs';

const HARNESS_DIR = join(process.cwd(), '.harness');

// ── Single-category ────────────────────────────────────────────────────

test('coding agent can modify src/', () => {
  assert.equal(isPathAllowed('src/components/Header.tsx', ['coding']), true);
});

test('coding agent cannot modify .harness/', () => {
  assert.equal(isPathAllowed('.harness/agents/ops.json', ['coding']), false);
});

test('operations agent can modify .github/', () => {
  assert.equal(isPathAllowed('.github/workflows/ci.yml', ['operations']), true);
});

test('operations agent cannot modify src/', () => {
  assert.equal(isPathAllowed('src/app/page.tsx', ['operations']), false);
});

// ── Multi-category merge ───────────────────────────────────────────────

const opsCategories = ['coding', 'operations'];

test('ops agent can modify src/ (coding allow overrides operations deny)', () => {
  assert.equal(isPathAllowed('src/components/Header.tsx', opsCategories), true);
});

test('ops agent can modify .github/ (from operations)', () => {
  assert.equal(isPathAllowed('.github/workflows/ci.yml', opsCategories), true);
});

test('ops agent can modify scripts/ (from operations)', () => {
  assert.equal(isPathAllowed('scripts/deploy.sh', opsCategories), true);
});

test('ops agent cannot modify .harness/ (denied by both)', () => {
  assert.equal(isPathAllowed('.harness/agents/ops.json', opsCategories), false);
});

test('ops agent cannot modify .claude/ (denied by both)', () => {
  assert.equal(isPathAllowed('.claude/settings.json', opsCategories), false);
});

// ── Agent config parsing (real files) ─────────────────────────────────

test('ops.json category field is an array containing coding + operations', { skip: !existsSync(join(HARNESS_DIR, 'agents', 'ops.json')) }, () => {
  const config = JSON.parse(readFileSync(join(HARNESS_DIR, 'agents', 'ops.json'), 'utf-8'));
  assert.ok(Array.isArray(config.category));
  assert.ok(config.category.includes('coding'));
  assert.ok(config.category.includes('operations'));
});

test('backend.json category field is a string "coding"', { skip: !existsSync(join(HARNESS_DIR, 'agents', 'backend.json')) }, () => {
  const config = JSON.parse(readFileSync(join(HARNESS_DIR, 'agents', 'backend.json'), 'utf-8'));
  assert.equal(typeof config.category, 'string');
  assert.equal(config.category, 'coding');
});

test('all agent configs have fileScope with writable/readonly/blocked arrays', () => {
  const agentsDir = join(HARNESS_DIR, 'agents');
  if (!existsSync(agentsDir)) { return; }
  const files = readdirSync(agentsDir).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const config = JSON.parse(readFileSync(join(agentsDir, file), 'utf-8'));
    assert.ok(config.fileScope, `${file} missing fileScope`);
    assert.ok(Array.isArray(config.fileScope.writable), `${file}.fileScope.writable not array`);
    assert.ok(Array.isArray(config.fileScope.readonly), `${file}.fileScope.readonly not array`);
    assert.ok(Array.isArray(config.fileScope.blocked), `${file}.fileScope.blocked not array`);
  }
});

// ── Agent inventory (md <-> json parity) ──────────────────────────────

test('every agents/*.md has a matching .harness/agents/*.json', { todo: 'Known drift: ~19 agents/*.md (analyst, architect, executor, …) have no .harness/agents/*.json yet. Tracked as a separate gap.' }, () => {
  const mdDir = join(process.cwd(), 'agents');
  const jsonDir = join(HARNESS_DIR, 'agents');
  if (!existsSync(mdDir) || !existsSync(jsonDir)) { return; }
  const mdNames = readdirSync(mdDir).filter((f) => f.endsWith('.md')).map((f) => f.replace('.md', '')).sort();
  const jsonNames = readdirSync(jsonDir).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', '')).sort();
  const missingJson = mdNames.filter((n) => !jsonNames.includes(n));
  const missingMd = jsonNames.filter((n) => !mdNames.includes(n));
  assert.deepEqual(missingJson, [], `agents missing JSON: ${missingJson.join(', ')}`);
  assert.deepEqual(missingMd, [], `JSON without agents/*.md: ${missingMd.join(', ')}`);
});
