import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { buildSignalPayload, writeSignal } from './completion-signal.mjs';

test('buildSignalPayload: extracts sessionId, transcript, cwd, pane, agent', () => {
  const now = new Date('2026-04-17T12:00:00.000Z');
  const env = { TMUX_PANE: '%7', HARNESS_AGENT: 'critic' };
  const { payload, cwd, sessionId } = buildSignalPayload(
    { session_id: 'sess-42', transcript_path: '/tmp/t.jsonl', cwd: '/repo' },
    env,
    now,
  );
  assert.equal(cwd, '/repo');
  assert.equal(sessionId, 'sess-42');
  assert.deepEqual(payload, {
    session_id: 'sess-42',
    transcript_path: '/tmp/t.jsonl',
    cwd: '/repo',
    pane_id: '%7',
    agent: 'critic',
    ended_at: '2026-04-17T12:00:00.000Z',
  });
});

test('buildSignalPayload: fallback chain — TMUX_PANE → CLAUDE_PANE → no-pane', () => {
  const now = new Date('2026-04-17T12:00:00.000Z');
  const { payload } = buildSignalPayload(
    { session_id: 's', cwd: '/x' },
    { CLAUDE_PANE: 'pane-2' },
    now,
  );
  assert.equal(payload.pane_id, 'pane-2');

  const bare = buildSignalPayload({ session_id: 's', cwd: '/x' }, {}, now).payload;
  assert.equal(bare.pane_id, 'no-pane');
});

test('buildSignalPayload: fallback agent HARNESS_AGENT → "solo"', () => {
  const now = new Date('2026-04-17T12:00:00.000Z');
  const { payload } = buildSignalPayload(
    { session_id: 's', cwd: '/x' },
    {},
    now,
  );
  assert.equal(payload.agent, 'solo');
});

test('buildSignalPayload: missing session_id defaults to "unknown"', () => {
  const now = new Date('2026-04-17T12:00:00.000Z');
  const { sessionId, payload } = buildSignalPayload({ cwd: '/x' }, {}, now);
  assert.equal(sessionId, 'unknown');
  assert.equal(payload.session_id, 'unknown');
});

test('writeSignal: creates .harness/signals/done-<sid>.json with payload', () => {
  const dir = mkdtempSync(join(tmpdir(), 'completion-signal-'));
  try {
    const env = { HARNESS_AGENT: 'designer' };
    const path = writeSignal(
      { session_id: 'abc', transcript_path: '/tmp/t.jsonl', cwd: dir },
      env,
    );
    assert.ok(existsSync(path));
    assert.match(path, /\.harness\/signals\/done-abc\.json$/);
    const written = JSON.parse(readFileSync(path, 'utf-8'));
    assert.equal(written.session_id, 'abc');
    assert.equal(written.transcript_path, '/tmp/t.jsonl');
    assert.equal(written.cwd, dir);
    assert.equal(written.agent, 'designer');
    assert.ok(typeof written.ended_at === 'string' && written.ended_at.endsWith('Z'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
