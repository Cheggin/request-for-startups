import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluate,
  findActiveFlow,
  isPhaseComplete,
  matchesGate,
  missingFromPhase,
} from './skill-chain-enforcer.mjs';

const WEBSITE_FLOW = {
  flows: {
    'website-end-to-end': {
      trigger_skill: 'website-end-to-end',
      gate_patterns: ['app/**', '*.tsx', 'packages/*/src/**'],
      phases: [
        { name: 'discovery', required: ['shape', 'brand-guidelines'] },
        { name: 'foundation', required: ['website-creation', 'impeccable'] },
        { name: 'ship', required: ['deploy-pipeline'] },
      ],
    },
  },
};

const OR_FLOW = {
  flows: {
    demo: {
      trigger_skill: 'demo',
      gate_patterns: ['src/**'],
      phases: [
        { name: 'pick', oneOf: ['a', 'b'] },
        { name: 'atleast-two', anyOf: { min: 2, of: ['x', 'y', 'z'] } },
      ],
    },
  },
};

test('isPhaseComplete: required — all must fire', () => {
  const p = { name: 'p', required: ['a', 'b'] };
  assert.equal(isPhaseComplete(p, new Set(['a'])), false);
  assert.equal(isPhaseComplete(p, new Set(['a', 'b'])), true);
});

test('isPhaseComplete: oneOf — one is enough', () => {
  const p = { name: 'p', oneOf: ['a', 'b'] };
  assert.equal(isPhaseComplete(p, new Set([])), false);
  assert.equal(isPhaseComplete(p, new Set(['b'])), true);
});

test('isPhaseComplete: anyOf — min count', () => {
  const p = { name: 'p', anyOf: { min: 2, of: ['x', 'y', 'z'] } };
  assert.equal(isPhaseComplete(p, new Set(['x'])), false);
  assert.equal(isPhaseComplete(p, new Set(['x', 'z'])), true);
});

test('missingFromPhase: required', () => {
  const p = { name: 'p', required: ['a', 'b', 'c'] };
  assert.deepEqual(missingFromPhase(p, new Set(['a'])), ['b', 'c']);
});

test('missingFromPhase: oneOf when already satisfied', () => {
  const p = { name: 'p', oneOf: ['a', 'b'] };
  assert.deepEqual(missingFromPhase(p, new Set(['a'])), []);
});

test('matchesGate: deep glob', () => {
  assert.equal(matchesGate('app/page.tsx', ['app/**']), true);
  assert.equal(matchesGate('app/nested/deep/file.ts', ['app/**']), true);
});

test('matchesGate: single-segment wildcard', () => {
  assert.equal(matchesGate('packages/cli/src/x.ts', ['packages/*/src/**']), true);
  assert.equal(matchesGate('packages/a/b/src/x.ts', ['packages/*/src/**']), false);
});

test('matchesGate: file extension', () => {
  assert.equal(matchesGate('foo.tsx', ['*.tsx']), true);
  assert.equal(matchesGate('foo.ts', ['*.tsx']), false);
});

test('matchesGate: no match returns false', () => {
  assert.equal(matchesGate('README.md', ['app/**', '*.tsx']), false);
});

test('findActiveFlow: no trigger fired — null', () => {
  assert.equal(findActiveFlow(WEBSITE_FLOW, ['shape', 'impeccable']), null);
});

test('findActiveFlow: trigger fired — flow active', () => {
  const active = findActiveFlow(WEBSITE_FLOW, ['website-end-to-end', 'shape']);
  assert.equal(active?.name, 'website-end-to-end');
});

test('evaluate: no flow active — allow', () => {
  assert.equal(evaluate(WEBSITE_FLOW, 'app/page.tsx', []).decision, 'ALLOW');
});

test('evaluate: flow active but edit outside gate — allow', () => {
  assert.equal(
    evaluate(WEBSITE_FLOW, 'README.md', ['website-end-to-end']).decision,
    'ALLOW',
  );
});

test('evaluate: flow active, no phase skill fired — deny', () => {
  const r = evaluate(WEBSITE_FLOW, 'app/page.tsx', ['website-end-to-end']);
  assert.equal(r.decision, 'DENY');
  assert.match(r.message, /discovery/);
  assert.match(r.message, /shape/);
});

test('evaluate: flow active, last skill not in any phase — deny', () => {
  const r = evaluate(WEBSITE_FLOW, 'app/page.tsx', ['website-end-to-end', 'audit']);
  assert.equal(r.decision, 'DENY');
});

test('evaluate: discovery partly done, edit during discovery — deny with missing', () => {
  const r = evaluate(WEBSITE_FLOW, 'app/page.tsx', [
    'website-end-to-end', 'shape', 'website-creation',
  ]);
  assert.equal(r.decision, 'DENY');
  assert.match(r.message, /discovery/);
  assert.match(r.message, /brand-guidelines/);
});

test('evaluate: discovery complete, edit during foundation — allow', () => {
  const r = evaluate(WEBSITE_FLOW, 'app/page.tsx', [
    'website-end-to-end', 'shape', 'brand-guidelines', 'website-creation',
  ]);
  assert.equal(r.decision, 'ALLOW');
});

test('evaluate: skipping phases — deny', () => {
  const r = evaluate(WEBSITE_FLOW, 'app/page.tsx', [
    'website-end-to-end', 'deploy-pipeline',
  ]);
  assert.equal(r.decision, 'DENY');
  assert.match(r.message, /discovery/);
});

test('evaluate: all phases complete — allow', () => {
  const r = evaluate(WEBSITE_FLOW, 'app/page.tsx', [
    'website-end-to-end', 'shape', 'brand-guidelines',
    'website-creation', 'impeccable', 'deploy-pipeline',
  ]);
  assert.equal(r.decision, 'ALLOW');
});

test('evaluate OR: oneOf phase satisfied with one — allow progression', () => {
  const r = evaluate(OR_FLOW, 'src/x.ts', ['demo', 'a', 'x', 'y']);
  assert.equal(r.decision, 'ALLOW');
});

test('evaluate OR: oneOf unsatisfied, later skill fired — deny with oneOf options', () => {
  const r = evaluate(OR_FLOW, 'src/x.ts', ['demo', 'x', 'y']);
  assert.equal(r.decision, 'DENY');
  assert.match(r.message, /a|b/);
});

test('evaluate OR: anyOf phase current, prior phase complete — allow', () => {
  const r = evaluate(OR_FLOW, 'src/x.ts', ['demo', 'a', 'x']);
  assert.equal(r.decision, 'ALLOW');
});
