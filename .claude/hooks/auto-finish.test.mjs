import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import {
  buildCommitMessage,
  looksTaskComplete,
  parseTranscript,
  runAutoFinish,
  selectFilesToCommit,
} from './auto-finish.mjs';

function writeTranscript(lines) {
  const dir = mkdtempSync(join(tmpdir(), 'auto-finish-'));
  const path = join(dir, 'session.jsonl');
  writeFileSync(path, lines.map((l) => JSON.stringify(l)).join('\n') + '\n', 'utf-8');
  return path;
}

test('parseTranscript extracts issue, summary, touched files, last assistant text', () => {
  const p = writeTranscript([
    {
      type: 'user',
      message: {
        role: 'user',
        content: 'gh issue view 36 then implement auto-commit Stop hook and auto-close issues',
      },
    },
    {
      type: 'assistant',
      message: {
        role: 'assistant',
        content: [
          { type: 'tool_use', name: 'Edit', input: { file_path: '/repo/packages/hooks/src/run-auto-finish.ts' } },
          { type: 'text', text: 'Implemented the stop hook automation and tests passed.' },
        ],
        stop_reason: 'end_turn',
      },
    },
  ]);
  try {
    const parsed = parseTranscript(p, '/repo');
    assert.equal(parsed.issueNumber, 36);
    assert.equal(parsed.taskSummary, 'implement auto-commit Stop hook and auto-close issues');
    assert.deepEqual(parsed.touchedFiles, ['packages/hooks/src/run-auto-finish.ts']);
    assert.match(parsed.lastAssistantText, /tests passed/);
    assert.equal(parsed.lastAssistantStopReason, 'end_turn');
  } finally {
    rmSync(dirname(p), { recursive: true, force: true });
  }
});

test('selectFilesToCommit keeps transcript-scoped changes, ignores ephemeral', () => {
  const selected = selectFilesToCommit(
    [
      { path: 'packages/hooks/src/run-auto-finish.ts', status: ' M' },
      { path: '.claude/command-log.txt', status: ' M' },
      { path: '.omc/session.json', status: '??' },
    ],
    ['packages/hooks/src/run-auto-finish.ts'],
    'main',
    36,
  );
  assert.deepEqual(selected, ['packages/hooks/src/run-auto-finish.ts']);
});

test('selectFilesToCommit falls back to full meaningful diff on dedicated issue branch', () => {
  const selected = selectFilesToCommit(
    [
      { path: 'packages/hooks/src/run-auto-finish.ts', status: ' M' },
      { path: '.claude/settings.json', status: ' M' },
    ],
    [],
    'feature/36-auto-finish',
    36,
  );
  assert.deepEqual(selected, ['packages/hooks/src/run-auto-finish.ts', '.claude/settings.json']);
});

test('buildCommitMessage builds conventional subject from issue title and files', () => {
  const subject = buildCommitMessage({
    issueTitle: '[feat] CEO should be zero-action — automate all manual orchestration',
    taskSummary: 'implement auto-commit Stop hook and auto-close issues',
    files: ['packages/hooks/src/run-auto-finish.ts', '.claude/settings.json'],
  });
  assert.equal(subject, 'feat(hooks): implement auto-commit Stop hook and auto-close issues');
});

test('looksTaskComplete accepts completion-style answers', () => {
  assert.equal(
    looksTaskComplete('Implemented the hook, added tests, and verified the flow.', 'end_turn'),
    true,
  );
});

test('looksTaskComplete rejects blocker-style answers', () => {
  assert.equal(
    looksTaskComplete('Blocked on missing credentials. Remaining work is the GitHub close step.', 'end_turn'),
    false,
  );
});

test('runAutoFinish stages scoped files, commits, pushes, closes issue', () => {
  const p = writeTranscript([
    {
      type: 'user',
      message: {
        role: 'user',
        content: 'gh issue view 36 then implement auto-commit Stop hook and auto-close issues',
      },
    },
    {
      type: 'assistant',
      message: {
        role: 'assistant',
        content: [
          { type: 'tool_use', name: 'Write', input: { file_path: '/repo/packages/hooks/src/run-auto-finish.ts' } },
          { type: 'text', text: 'Implemented the hook automation and tests passed.' },
        ],
        stop_reason: 'end_turn',
      },
    },
  ]);

  const calls = [];
  const runner = (binary, args) => {
    calls.push({ binary, args });
    const joined = `${binary} ${args.join(' ')}`;
    if (joined === 'git diff --name-only --diff-filter=U') return { stdout: '', stderr: '', status: 0 };
    if (joined === 'git branch --show-current') return { stdout: 'main\n', stderr: '', status: 0 };
    if (joined === 'git status --porcelain --untracked-files=all') return {
      stdout: ' M packages/hooks/src/run-auto-finish.ts\n M SOUL.md\n?? .omc/session.json\n',
      stderr: '', status: 0,
    };
    if (joined === 'gh issue view 36 --json number,title,state') return {
      stdout: JSON.stringify({
        number: 36,
        title: '[feat] CEO should be zero-action — automate all manual orchestration',
        state: 'OPEN',
      }),
      stderr: '', status: 0,
    };
    if (binary === 'git' && args[0] === 'add') return { stdout: '', stderr: '', status: 0 };
    if (joined === 'git diff --cached --name-only') return {
      stdout: 'packages/hooks/src/run-auto-finish.ts\n', stderr: '', status: 0,
    };
    if (binary === 'git' && args[0] === 'commit') return { stdout: '[main abc1234] commit\n', stderr: '', status: 0 };
    if (joined === 'git rev-parse --abbrev-ref --symbolic-full-name @{u}') return {
      stdout: 'origin/main\n', stderr: '', status: 0,
    };
    if (joined === 'git push') return { stdout: '', stderr: '', status: 0 };
    if (joined === 'git rev-parse HEAD') return {
      stdout: 'abc1234def5678abc1234def5678abc1234def0\n', stderr: '', status: 0,
    };
    if (binary === 'gh' && args[0] === 'issue' && args[1] === 'close') return { stdout: 'closed\n', stderr: '', status: 0 };
    return { stdout: '', stderr: '', status: 0 };
  };

  try {
    process.env.HARNESS_AGENT = 'agent-4';
    const result = runAutoFinish(
      { hook_event_name: 'Stop', cwd: '/repo', transcript_path: p },
      { cwd: '/repo', runner },
    );
    assert.equal(result.status, 'committed');
    assert.equal(result.issueNumber, 36);
    assert.equal(result.commitSha, 'abc1234def5678abc1234def5678abc1234def0');

    const addCall = calls.find((c) => c.binary === 'git' && c.args[0] === 'add');
    assert.deepEqual(addCall?.args, ['add', '-A', '--', 'packages/hooks/src/run-auto-finish.ts']);

    const closeCall = calls.find((c) => c.binary === 'gh' && c.args[0] === 'issue' && c.args[1] === 'close');
    assert.ok(closeCall?.args.includes('36'));
    assert.ok(closeCall?.args.includes('Closed by agent-4 in commit abc1234.'));
  } finally {
    delete process.env.HARNESS_AGENT;
    rmSync(dirname(p), { recursive: true, force: true });
  }
});
