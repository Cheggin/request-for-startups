#!/usr/bin/env node

/**
 * Startup-Harness Keyword Detector (UserPromptSubmit hook).
 *
 * Detects magic keywords in user prompts and injects the corresponding plugin
 * skill content (or a mode message) so Claude invokes the right workflow
 * without the user needing to type the slash command.
 *
 * Ported from oh-my-claudecode 4.11.6 scripts/keyword-detector.mjs with two
 * adaptations: (a) skills load directly from ${CLAUDE_PLUGIN_ROOT}/skills/
 * since they are merged into this plugin (no "oh-my-claudecode:" prefix), and
 * (b) the dist/ bridge modules are treated as unavailable — this plugin does
 * not ship a compiled bridge, so all detection uses the inline path.
 *
 * Supported keywords:
 *   cancelomc/stopomc → cancel
 *   ralph, "don't stop", "until done" → ralph
 *   autopilot, "build me an app", "end to end" → autopilot
 *   ultrawork / ulw / uw → ultrawork
 *   ccg, claude-codex-gemini → ccg
 *   ralplan → ralplan
 *   deep-interview, ouroboros → deep-interview
 *   ai-slop / deslop / cleanup slop → ai-slop-cleaner
 *   wiki → wiki
 *   tdd, test first → inline TDD_MESSAGE
 *   code review → inline CODE_REVIEW_MESSAGE
 *   security review → inline SECURITY_REVIEW_MESSAGE
 *   ultrathink → inline ULTRATHINK_MESSAGE
 *   deepsearch → inline SEARCH_MESSAGE
 *   deep-analyze → inline ANALYZE_MESSAGE
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';
import { getClaudeConfigDir } from './lib/config-dir.mjs';
import { readStdin } from './lib/stdin.mjs';

// Plugin root: CLAUDE_PLUGIN_ROOT is injected by the Claude Code plugin system
// when hooks fire. Fall back to the script's parent dir for local invocation.
const _pluginRoot = process.env.CLAUDE_PLUGIN_ROOT ||
  join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Load skill content from ${pluginRoot}/skills/<name>/SKILL.md.
 * Returns null if not found — caller falls back to the Skill-tool invocation form.
 */
function loadSkillContent(skillName) {
  const skillPath = join(_pluginRoot, 'skills', skillName, 'SKILL.md');
  if (existsSync(skillPath)) {
    try { return readFileSync(skillPath, 'utf8'); } catch { /* fall through */ }
  }
  return null;
}

const ULTRATHINK_MESSAGE = `<think-mode>

**ULTRATHINK MODE ENABLED** - Extended reasoning activated.

You are now in deep thinking mode. Take your time to:
1. Thoroughly analyze the problem from multiple angles
2. Consider edge cases and potential issues
3. Think through the implications of each approach
4. Reason step-by-step before acting

Use your extended thinking capabilities to provide the most thorough and well-reasoned response.

</think-mode>

---
`;

const SEARCH_MESSAGE = `<search-mode>
MAXIMIZE SEARCH EFFORT. Launch multiple background agents IN PARALLEL:
- explore agents (codebase patterns, file structures)
- document-specialist agents (remote repos, official docs, GitHub examples)
Plus direct tools: Grep, Glob
NEVER stop at first result - be exhaustive.
</search-mode>

---
`;

const ANALYZE_MESSAGE = `<analyze-mode>
ANALYSIS MODE. Gather context before diving deep:
- Search relevant code paths first
- Compare working vs broken behavior
- Synthesize findings before proposing changes
</analyze-mode>

---
`;

const TDD_MESSAGE = `<tdd-mode>
[TDD MODE ACTIVATED]
Write or update tests first when practical, confirm they fail for the right reason, then implement the minimal fix and re-run verification.
</tdd-mode>

---
`;

const CODE_REVIEW_MESSAGE = `<code-review-mode>
[CODE REVIEW MODE ACTIVATED]
Perform a comprehensive code review of the relevant changes or target area. Focus on correctness, maintainability, edge cases, regressions, and test adequacy before recommending changes.
</code-review-mode>

---
`;

const SECURITY_REVIEW_MESSAGE = `<security-review-mode>
[SECURITY REVIEW MODE ACTIVATED]
Perform a focused security review of the relevant changes or target area. Check trust boundaries, auth/authz, data exposure, input validation, command/file access, secrets handling, and escalation risks before recommending changes.
</security-review-mode>

---
`;

const MODE_MESSAGE_KEYWORDS = new Map([
  ['ultrathink', ULTRATHINK_MESSAGE],
  ['deepsearch', SEARCH_MESSAGE],
  ['analyze', ANALYZE_MESSAGE],
  ['tdd', TDD_MESSAGE],
  ['code-review', CODE_REVIEW_MESSAGE],
  ['security-review', SECURITY_REVIEW_MESSAGE],
]);

function extractPrompt(input) {
  try {
    const data = JSON.parse(input);
    if (data.prompt) return data.prompt;
    if (data.message?.content) return data.message.content;
    if (Array.isArray(data.parts)) {
      return data.parts
        .filter(p => p.type === 'text')
        .map(p => p.text)
        .join(' ');
    }
    return '';
  } catch {
    return '';
  }
}

const ANTI_SLOP_EXPLICIT_PATTERN = /\b(ai[\s-]?slop|anti[\s-]?slop|deslop|de[\s-]?slop)\b/i;
const ANTI_SLOP_ACTION_PATTERN = /\b(clean(?:\s*up)?|cleanup|refactor|simplify|dedupe|de-duplicate|prune)\b/i;
const ANTI_SLOP_SMELL_PATTERN = /\b(slop|duplicate(?:d|s)?|duplication|dead\s+code|unused\s+code|over[\s-]?abstract(?:ion|ed)?|wrapper\s+layers?|boundary\s+violations?|needless\s+abstractions?|unnecessary\s+abstractions?|ai[\s-]?generated|generated\s+code|tech\s+debt)\b/i;

function isAntiSlopCleanupRequest(text) {
  return ANTI_SLOP_EXPLICIT_PATTERN.test(text) ||
    (ANTI_SLOP_ACTION_PATTERN.test(text) && ANTI_SLOP_SMELL_PATTERN.test(text));
}

const REVIEW_SEED_OUTCOME_RES = [
  /\bapprove\b/i,
  /\brequest[- ]changes\b/i,
  /\bmerge[- ]ready\b/i,
  /\bblocked\b/i,
];

function isReviewSeedContext(text) {
  const preview = text.split('\n').slice(0, 20).join('\n');
  return REVIEW_SEED_OUTCOME_RES.filter(re => re.test(preview)).length >= 2;
}

function sanitizeForKeywordDetection(text) {
  return text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(\w[\w-]*)[\s>][\s\S]*?<\/\1>/g, '')
    .replace(/<\w[\w-]*(?:\s[^>]*)?\s*\/>/g, '')
    .replace(/https?:\/\/[^\s)>\]]+/g, '')
    .replace(/^\s*>\s.*$/gm, '')
    .replace(/^\s*\|(?:[^|\n]*\|){2,}\s*$/gm, '')
    .replace(/^\s*\|?(?:\s*:?-{3,}:?\s*\|){1,}\s*$/gm, '')
    .replace(/(?<=^|[\s"'`(])(?:\/)?(?:[\w.-]+\/)+[\w.-]+/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '');
}

const INFORMATIONAL_INTENT_PATTERNS = [
  /\b(?:what(?:'s|\s+is)|what\s+are|how\s+(?:to|do\s+i)\s+use|explain|explanation|tell\s+me\s+about|describe)\b/i,
];
const INFORMATIONAL_CONTEXT_WINDOW = 80;
const QUOTED_SPAN_PATTERN =
  /"[^"\n]{1,400}"|'[^'\n]{1,400}'|“[^”\n]{1,400}”|‘[^’\n]{1,400}’/g;
const REFERENCE_META_PATTERNS = [
  /\b(?:vs\.?|versus|compared\s+to|comparison|compare|article|blog\s+post|documentation|docs?|reference)\b/i,
  /\b(?:this\s+(?:article|comparison|guide|documentation|doc)|quoted|quote(?:d)?)\b/i,
];
const REFERENCE_EXPLANATION_PATTERNS = [
  /\b(?:summary|conclusion|key\s+points?|example|examples|pros|cons|overview)\s*:/i,
  /[^\n]{1,80}=\s*["“]/,
  /[→⇒]/,
];
const QUESTION_FOLLOWUP_PATTERNS = [
  /\b(?:how\s+many|how\s+much|why|what\s+happened|what\s+went\s+wrong|token\s+budget|cost|pricing)\b/i,
];
const MODE_REFERENCE_PATTERN =
  /\b(?:ralph|autopilot|auto[\s-]?pilot|ultrawork|ulw|ralplan|ultrathink|deepsearch|deep[\s-]?analyze|deepanalyze|deep[\s-]interview|ouroboros|ccg|claude-codex-gemini)\b/gi;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getLineBounds(text, position) {
  const start = text.lastIndexOf('\n', Math.max(0, position - 1)) + 1;
  const nextNewline = text.indexOf('\n', position);
  const end = nextNewline === -1 ? text.length : nextNewline;
  return { start, end };
}

function isWithinQuotedSpan(text, position) {
  for (const match of text.matchAll(QUOTED_SPAN_PATTERN)) {
    if (match.index === undefined) continue;
    const start = match.index;
    const end = start + match[0].length;
    if (position >= start && position < end) return true;
  }
  return false;
}

function stripQuotedSpans(text) {
  return text.replace(QUOTED_SPAN_PATTERN, ' ');
}

function countDistinctModeReferences(text) {
  const matches = text.match(MODE_REFERENCE_PATTERN) ?? [];
  const normalized = new Set(
    matches.map((m) => m.toLowerCase().replace(/\s+/g, '').replace(/-/g, '')),
  );
  return normalized.size;
}

function looksLikeReferenceContent(text) {
  const hasReferenceMeta = REFERENCE_META_PATTERNS.some((p) => p.test(text));
  const hasExplanationShape = REFERENCE_EXPLANATION_PATTERNS.some((p) => p.test(text));
  const hasAnyMode = countDistinctModeReferences(text) >= 1;
  const hasMultipleModes = countDistinctModeReferences(text) >= 2;
  const hasQuestionOutsideQuotes = QUESTION_FOLLOWUP_PATTERNS.some((p) => p.test(stripQuotedSpans(text)));

  return (
    (hasReferenceMeta && (hasExplanationShape || hasAnyMode || hasQuestionOutsideQuotes)) ||
    (hasExplanationShape && (hasMultipleModes || hasQuestionOutsideQuotes)) ||
    (hasMultipleModes && hasQuestionOutsideQuotes)
  );
}

function hasActivationIntentNearKeyword(context, keyword) {
  const escaped = escapeRegExp((keyword || '').trim());
  if (!escaped) return false;
  const patterns = [
    new RegExp(`\\b(?:use|run|start|enable|activate|invoke|trigger|launch)\\b[^\\n]{0,28}\\b${escaped}\\b`, 'i'),
    new RegExp(`\\b(?:fix|debug|investigate|resolve|handle|patch|address)\\b[^\\n]{0,28}\\b(?:issue|bug|problem|error)\\b[^\\n]{0,12}\\b(?:with|in)\\s+\\b${escaped}\\b`, 'i'),
  ];
  return patterns.some((p) => p.test(context));
}

function hasDiagnosticIntentNearKeyword(context, keyword) {
  const escaped = escapeRegExp((keyword || '').trim());
  if (!escaped) return false;
  const patterns = [
    new RegExp(`\\b${escaped}\\b[^\\n]{0,48}\\b(?:keeps?\\s+(?:looping|re-?running)|has\\s+(?:a\\s+)?(?:bug|issue|problem|error)|is\\s+(?:stuck|broken|failing)|loop(?:ing)?)\\b`, 'i'),
    new RegExp(`\\b(?:bug|issue|problem|error)\\b[^\\n]{0,16}\\b(?:with|in)\\s+\\b${escaped}\\b`, 'i'),
  ];
  return patterns.some((p) => p.test(context));
}

function isInformationalKeywordContext(text, position, keywordLength, keywordText) {
  const start = Math.max(0, position - INFORMATIONAL_CONTEXT_WINDOW);
  const end = Math.min(text.length, position + keywordLength + INFORMATIONAL_CONTEXT_WINDOW);
  const context = text.slice(start, end);
  const lineBounds = getLineBounds(text, position);
  const line = text.slice(lineBounds.start, lineBounds.end);
  const questionOutsideQuotes = stripQuotedSpans(text);
  const keywordInsideQuotes = isWithinQuotedSpan(text, position);

  if (keywordText) {
    if (hasActivationIntentNearKeyword(context, keywordText)) return false;
    if (hasDiagnosticIntentNearKeyword(context, keywordText)) return true;
  }

  if (/^\s*>\s/.test(line) || /^\s*\|(?:[^|\n]*\|){2,}\s*$/.test(line)) return true;
  if (keywordInsideQuotes && QUESTION_FOLLOWUP_PATTERNS.some((p) => p.test(questionOutsideQuotes))) return true;
  if (looksLikeReferenceContent(text)) return true;
  return INFORMATIONAL_INTENT_PATTERNS.some((p) => p.test(context));
}

function hasActionableKeyword(text, pattern) {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  const globalPattern = new RegExp(pattern.source, flags);
  for (const match of text.matchAll(globalPattern)) {
    if (match.index === undefined) continue;
    if (isInformationalKeywordContext(text, match.index, match[0].length, match[0])) continue;
    return true;
  }
  return false;
}

// Activate a mode state file at .omc/state/<name>-state.json or
// .omc/state/sessions/<sid>/<name>-state.json when session scoped.
function activateState(directory, prompt, stateName, sessionId) {
  let state;

  if (stateName === 'ralph') {
    state = {
      active: true,
      iteration: 1,
      max_iterations: 100,
      started_at: new Date().toISOString(),
      prompt,
      session_id: sessionId || undefined,
      project_path: directory,
      linked_ultrawork: true,
      awaiting_confirmation: true,
      last_checked_at: new Date().toISOString(),
    };
  } else if (stateName === 'ralplan') {
    state = {
      active: true,
      started_at: new Date().toISOString(),
      session_id: sessionId || undefined,
      project_path: directory,
      awaiting_confirmation: true,
      last_checked_at: new Date().toISOString(),
    };
  } else {
    state = {
      active: true,
      started_at: new Date().toISOString(),
      original_prompt: prompt,
      session_id: sessionId || undefined,
      project_path: directory,
      reinforcement_count: 0,
      awaiting_confirmation: true,
      last_checked_at: new Date().toISOString(),
    };
  }

  if (sessionId && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,255}$/.test(sessionId)) {
    const sessionDir = join(directory, '.omc', 'state', 'sessions', sessionId);
    if (!existsSync(sessionDir)) {
      try { mkdirSync(sessionDir, { recursive: true }); } catch {}
    }
    try { writeFileSync(join(sessionDir, `${stateName}-state.json`), JSON.stringify(state, null, 2), { mode: 0o600 }); } catch {}
    return;
  }

  const localDir = join(directory, '.omc', 'state');
  if (!existsSync(localDir)) {
    try { mkdirSync(localDir, { recursive: true }); } catch {}
  }
  try { writeFileSync(join(localDir, `${stateName}-state.json`), JSON.stringify(state, null, 2), { mode: 0o600 }); } catch {}
}

function clearStateFiles(directory, modeNames, sessionId) {
  for (const name of modeNames) {
    const localPath = join(directory, '.omc', 'state', `${name}-state.json`);
    const globalPath = join(homedir(), '.omc', 'state', `${name}-state.json`);
    try { if (existsSync(localPath)) unlinkSync(localPath); } catch {}
    try { if (existsSync(globalPath)) unlinkSync(globalPath); } catch {}
    if (sessionId && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,255}$/.test(sessionId)) {
      const sessionPath = join(directory, '.omc', 'state', 'sessions', sessionId, `${name}-state.json`);
      try { if (existsSync(sessionPath)) unlinkSync(sessionPath); } catch {}
    }
  }
}

function createSkillInvocation(skillName, originalPrompt, args = '') {
  const argsSection = args ? `\nArguments: ${args}` : '';
  const skillContent = loadSkillContent(skillName);
  if (skillContent) {
    return `[MAGIC KEYWORD: ${skillName.toUpperCase()}]\n\n${skillContent}\n\n---\nUser request:\n${originalPrompt}${argsSection}`;
  }
  return `[MAGIC KEYWORD: ${skillName.toUpperCase()}]

You MUST invoke the skill using the Skill tool:

Skill: ${skillName}${argsSection}

User request:
${originalPrompt}

IMPORTANT: Invoke the skill IMMEDIATELY. Do not proceed without loading the skill instructions.`;
}

function createMultiSkillInvocation(skills, originalPrompt) {
  if (skills.length === 0) return '';
  if (skills.length === 1) {
    return createSkillInvocation(skills[0].name, originalPrompt, skills[0].args);
  }

  const skillBlocks = skills.map((s, i) => {
    const argsSection = s.args ? `\nArguments: ${s.args}` : '';
    const content = loadSkillContent(s.name);
    if (content) {
      return `### Skill ${i + 1}: ${s.name.toUpperCase()}\n\n${content}${argsSection}`;
    }
    return `### Skill ${i + 1}: ${s.name.toUpperCase()}\nSkill: ${s.name}${argsSection}`;
  }).join('\n\n');

  const hasDirectContent = skills.some((s) => loadSkillContent(s.name));
  return `[MAGIC KEYWORDS DETECTED: ${skills.map((s) => s.name.toUpperCase()).join(', ')}]

${hasDirectContent ? 'Execute ALL of the following skills in order:' : 'You MUST invoke ALL of the following skills using the Skill tool, in order:'}

${skillBlocks}

User request:
${originalPrompt}

IMPORTANT: Complete ALL skills listed above in order. Start with the first skill IMMEDIATELY.`;
}

function resolveConflicts(matches) {
  const names = matches.map((m) => m.name);
  if (names.includes('cancel')) {
    return [matches.find((m) => m.name === 'cancel')];
  }
  const priorityOrder = ['cancel', 'ralph', 'autopilot', 'ultrawork',
    'ccg', 'ralplan', 'deep-interview', 'ai-slop-cleaner', 'wiki',
    'tdd', 'code-review', 'security-review', 'ultrathink', 'deepsearch', 'analyze'];
  const resolved = [...matches];
  resolved.sort((a, b) => priorityOrder.indexOf(a.name) - priorityOrder.indexOf(b.name));
  return resolved;
}

function createHookOutput(additionalContext) {
  return {
    continue: true,
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext,
    },
  };
}

async function main() {
  const skipHooks = (process.env.HARNESS_SKIP_HOOKS || process.env.OMC_SKIP_HOOKS || '').split(',').map((s) => s.trim());
  if (process.env.DISABLE_HARNESS === '1' || process.env.DISABLE_OMC === '1' || skipHooks.includes('keyword-detector')) {
    console.log(JSON.stringify({ continue: true }));
    return;
  }

  // Team worker guard — prevents re-detecting "team" inside spawned team workers
  if (process.env.HARNESS_TEAM_WORKER || process.env.OMC_TEAM_WORKER) {
    console.log(JSON.stringify({ continue: true, suppressOutput: true }));
    return;
  }

  try {
    const input = await readStdin();
    if (!input.trim()) {
      console.log(JSON.stringify({ continue: true, suppressOutput: true }));
      return;
    }

    let data = {};
    try { data = JSON.parse(input); } catch {}
    const directory = data.cwd || data.directory || process.cwd();
    const sessionId = data.session_id || data.sessionId || '';

    const prompt = extractPrompt(input);
    if (!prompt) {
      console.log(JSON.stringify({ continue: true, suppressOutput: true }));
      return;
    }

    const cleanPrompt = sanitizeForKeywordDetection(prompt).toLowerCase();
    const matches = [];

    if (hasActionableKeyword(cleanPrompt, /\b(cancelomc|stopomc|cancelharness|stopharness)\b/i)) {
      matches.push({ name: 'cancel', args: '' });
    }

    if (hasActionableKeyword(cleanPrompt, /\b(ralph|don't stop|must complete|until done)\b/i)) {
      matches.push({ name: 'ralph', args: '' });
    }

    if (hasActionableKeyword(cleanPrompt, /\b(autopilot|auto pilot|auto-pilot|autonomous|full auto|fullsend)\b/i) ||
        hasActionableKeyword(cleanPrompt, /\b(build|create|make)\s+me\s+(an?\s+)?(app|feature|project|tool|plugin|website|api|server|cli|script|system|service|dashboard|bot|extension|startup)\b/i) ||
        hasActionableKeyword(cleanPrompt, /\bi\s+want\s+an?\s+/i) ||
        hasActionableKeyword(cleanPrompt, /\bhandle\s+it\s+all\b/i) ||
        hasActionableKeyword(cleanPrompt, /\bend\s+to\s+end\b/i) ||
        hasActionableKeyword(cleanPrompt, /\be2e\s+this\b/i)) {
      matches.push({ name: 'autopilot', args: '' });
    }

    if (hasActionableKeyword(cleanPrompt, /\b(ultrawork|ulw|uw)\b/i)) {
      matches.push({ name: 'ultrawork', args: '' });
    }

    if (hasActionableKeyword(cleanPrompt, /\b(ccg|claude-codex-gemini)\b/i)) {
      matches.push({ name: 'ccg', args: '' });
    }

    if (hasActionableKeyword(cleanPrompt, /\b(ralplan)\b/i)) {
      matches.push({ name: 'ralplan', args: '' });
    }

    if (hasActionableKeyword(cleanPrompt, /\b(deep[\s-]interview|ouroboros)\b/i)) {
      matches.push({ name: 'deep-interview', args: '' });
    }

    if (isAntiSlopCleanupRequest(cleanPrompt)) {
      matches.push({ name: 'ai-slop-cleaner', args: '' });
    }

    if (hasActionableKeyword(cleanPrompt, /\b(tdd)\b/i) ||
        hasActionableKeyword(cleanPrompt, /\btest\s+first\b/i) ||
        hasActionableKeyword(cleanPrompt, /\bred\s+green\b/i)) {
      matches.push({ name: 'tdd', args: '' });
    }

    if (!isReviewSeedContext(cleanPrompt) &&
        hasActionableKeyword(cleanPrompt, /\b(code\s+review|review\s+code)\b/i)) {
      matches.push({ name: 'code-review', args: '' });
    }

    if (!isReviewSeedContext(cleanPrompt) &&
        hasActionableKeyword(cleanPrompt, /\b(security\s+review|review\s+security)\b/i)) {
      matches.push({ name: 'security-review', args: '' });
    }

    if (hasActionableKeyword(cleanPrompt, /\b(ultrathink|think hard|think deeply)\b/i)) {
      matches.push({ name: 'ultrathink', args: '' });
    }

    if (hasActionableKeyword(cleanPrompt, /\b(deepsearch)\b/i) ||
        hasActionableKeyword(cleanPrompt, /\bsearch\s+(the\s+)?(codebase|code|files?|project)\b/i) ||
        hasActionableKeyword(cleanPrompt, /\bfind\s+(in\s+)?(codebase|code|all\s+files?)\b/i)) {
      matches.push({ name: 'deepsearch', args: '' });
    }

    if (hasActionableKeyword(cleanPrompt, /\b(deep[\s-]?analyze|deepanalyze)\b/i)) {
      matches.push({ name: 'analyze', args: '' });
    }

    if (hasActionableKeyword(cleanPrompt, /\b(wiki(?:\s+(?:this|add|lint|query))?)\b/i)) {
      matches.push({ name: 'wiki', args: '' });
    }

    if (matches.length === 0) {
      console.log(JSON.stringify({ continue: true, suppressOutput: true }));
      return;
    }

    const seen = new Set();
    const uniqueMatches = [];
    for (const m of matches) {
      if (!seen.has(m.name)) {
        seen.add(m.name);
        uniqueMatches.push(m);
      }
    }

    const resolved = resolveConflicts(uniqueMatches);

    if (resolved.length > 0 && resolved[0].name === 'cancel') {
      clearStateFiles(directory, ['ralph', 'autopilot', 'ultrawork', 'swarm', 'ralplan'], sessionId);
      console.log(JSON.stringify(createHookOutput(createSkillInvocation('cancel', prompt))));
      return;
    }

    const stateModes = resolved.filter((m) => ['ralph', 'autopilot', 'ultrawork', 'ralplan'].includes(m.name));
    for (const mode of stateModes) {
      activateState(directory, prompt, mode.name, sessionId);
    }

    const hasRalph = resolved.some((m) => m.name === 'ralph');
    const hasUltrawork = resolved.some((m) => m.name === 'ultrawork');
    if (hasRalph && !hasUltrawork) {
      activateState(directory, prompt, 'ultrawork', sessionId);
    }

    const additionalContextParts = [];
    for (const [keywordName, message] of MODE_MESSAGE_KEYWORDS) {
      const index = resolved.findIndex((m) => m.name === keywordName);
      if (index !== -1) {
        resolved.splice(index, 1);
        additionalContextParts.push(message);
      }
    }

    if (resolved.length === 0 && additionalContextParts.length > 0) {
      console.log(JSON.stringify(createHookOutput(additionalContextParts.join(''))));
      return;
    }

    if (resolved.length > 0) {
      additionalContextParts.push(createMultiSkillInvocation(resolved, prompt));
    }

    if (additionalContextParts.length > 0) {
      console.log(JSON.stringify(createHookOutput(additionalContextParts.join(''))));
      return;
    }
  } catch {
    console.log(JSON.stringify({ continue: true, suppressOutput: true }));
  }
}

main();
