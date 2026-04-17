import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { createGateGuard } from './gateguard.mjs';

let guard;
beforeEach(() => { guard = createGateGuard(); });

test('ALLOW Edit if file was previously Read', () => {
  guard.handleToolCall({ tool_name: 'Read', tool_input: { file_path: '/src/app.ts' } });
  const result = guard.handleToolCall({
    tool_name: 'Edit',
    tool_input: { file_path: '/src/app.ts', old_string: 'foo', new_string: 'bar' },
  });
  assert.deepEqual(result, { decision: 'ALLOW' });
});

test('DENY Edit if file was NOT previously Read', () => {
  const result = guard.handleToolCall({
    tool_name: 'Edit',
    tool_input: { file_path: '/src/app.ts', old_string: 'foo', new_string: 'bar' },
  });
  assert.equal(result.decision, 'DENY');
  assert.match(result.message, /\/src\/app\.ts/);
  assert.match(result.message, /Read/);
});

test('Track Read calls and add to session set', () => {
  guard.handleToolCall({ tool_name: 'Read', tool_input: { file_path: '/src/a.ts' } });
  guard.handleToolCall({ tool_name: 'Read', tool_input: { file_path: '/src/b.ts' } });
  const reads = guard.getReadFiles();
  assert.ok(reads.has('/src/a.ts'));
  assert.ok(reads.has('/src/b.ts'));
  assert.equal(reads.size, 2);
});

test('Handle multiple files independently', () => {
  guard.handleToolCall({ tool_name: 'Read', tool_input: { file_path: '/src/a.ts' } });
  const allow = guard.handleToolCall({
    tool_name: 'Edit',
    tool_input: { file_path: '/src/a.ts', old_string: 'x', new_string: 'y' },
  });
  assert.equal(allow.decision, 'ALLOW');
  const deny = guard.handleToolCall({
    tool_name: 'Edit',
    tool_input: { file_path: '/src/b.ts', old_string: 'x', new_string: 'y' },
  });
  assert.equal(deny.decision, 'DENY');
  assert.match(deny.message, /\/src\/b\.ts/);
});

test('Reset clears tracked reads', () => {
  guard.handleToolCall({ tool_name: 'Read', tool_input: { file_path: '/src/a.ts' } });
  assert.equal(guard.getReadFiles().size, 1);
  guard.reset();
  assert.equal(guard.getReadFiles().size, 0);
  const result = guard.handleToolCall({
    tool_name: 'Edit',
    tool_input: { file_path: '/src/a.ts', old_string: 'x', new_string: 'y' },
  });
  assert.equal(result.decision, 'DENY');
});

test('ALLOW non-Edit/Write tool calls without restriction', () => {
  const result = guard.handleToolCall({
    tool_name: 'Bash',
    tool_input: { command: 'ls' },
  });
  assert.equal(result.decision, 'ALLOW');
});

test('DENY Write if file was NOT previously Read', () => {
  const result = guard.handleToolCall({
    tool_name: 'Write',
    tool_input: { file_path: '/src/new.ts', content: 'hello' },
  });
  assert.equal(result.decision, 'DENY');
  assert.match(result.message, /\/src\/new\.ts/);
});

test('ALLOW Write if file was previously Read', () => {
  guard.handleToolCall({ tool_name: 'Read', tool_input: { file_path: '/src/new.ts' } });
  const result = guard.handleToolCall({
    tool_name: 'Write',
    tool_input: { file_path: '/src/new.ts', content: 'hello' },
  });
  assert.deepEqual(result, { decision: 'ALLOW' });
});
