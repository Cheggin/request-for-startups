#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const SKILLS_DIR = './skills';

const META = {
  // ORCHESTRATION (20)
  'autopilot':             { group: 'orchestration', pre: ['deep-interview', 'plan'], next: ['verify', 'ultraqa'], wf: ['ship-feature', 'continuous-improvement'] },
  'ralph':                 { group: 'orchestration', pre: ['plan', 'sprint-contracts'], next: ['verify', 'slop-cleaner'], wf: ['ship-feature', 'continuous-improvement'] },
  'team':                  { group: 'orchestration', pre: ['plan'], next: ['verify'], wf: ['ship-feature'] },
  'ultrawork':             { group: 'orchestration', pre: ['plan'], next: ['verify'], wf: ['ship-feature', 'continuous-improvement'] },
  'ultraqa':               { group: 'orchestration', pre: ['test-generator'], next: ['verify'], wf: ['ship-feature', 'design-review', 'bug-fix'] },
  'loop-prompt':           { group: 'orchestration', pre: [], next: ['post-deploy-loop', 'research'], wf: ['continuous-improvement'] },
  'cancel':                { group: 'orchestration', pre: [], next: [], wf: [] },
  'tmux-spawn':            { group: 'orchestration', pre: [], next: [], wf: ['full-startup'] },
  'issue-creator':         { group: 'orchestration', pre: [], next: ['github-state-manager'], wf: ['incident-response', 'ship-feature'] },
  'github-state-manager':  { group: 'orchestration', pre: ['plan'], next: ['ci-cd-pipeline', 'investor-updates'], wf: ['full-startup', 'incident-response'] },
  'context-reset-handler': { group: 'orchestration', pre: [], next: [], wf: [] },
  'tiered-memory':         { group: 'orchestration', pre: [], next: [], wf: [] },
  'self-improve':          { group: 'orchestration', pre: ['eval-framework'], next: ['verify'], wf: ['continuous-improvement'] },
  'agent-creator':         { group: 'orchestration', pre: [], next: ['tmux-spawn'], wf: [] },
  'debug':                 { group: 'orchestration', pre: [], next: ['trace'], wf: ['bug-fix', 'incident-response'] },
  'trace':                 { group: 'orchestration', pre: [], next: ['plan'], wf: ['bug-fix', 'incident-response'] },
  'deep-dive':             { group: 'orchestration', pre: [], next: ['plan', 'autopilot'], wf: ['bug-fix'] },
  'trajectory-logging':    { group: 'orchestration', pre: [], next: ['eval-framework'], wf: ['continuous-improvement'] },
  'error-classifier':      { group: 'orchestration', pre: ['error-tracking'], next: ['incident-response'], wf: ['incident-response'] },
  'startup-init':          { group: 'orchestration', pre: [], next: [], wf: ['full-startup'] },

  // STRATEGY (8)
  'plan':                  { group: 'strategy', pre: [], next: ['ralph', 'team', 'autopilot', 'sprint-contracts'], wf: ['ship-feature', 'bug-fix', 'continuous-improvement', 'full-startup'] },
  'deep-interview':        { group: 'strategy', pre: [], next: ['plan', 'autopilot'], wf: ['ship-feature', 'full-startup'] },
  'competitor-research':   { group: 'strategy', pre: [], next: ['shape', 'plan', 'website-creation'], wf: ['full-startup', 'seo-content-growth'] },
  'research':              { group: 'strategy', pre: [], next: ['plan', 'competitor-research'], wf: ['full-startup', 'continuous-improvement'] },
  'avoid-feature-creep':   { group: 'strategy', pre: [], next: ['sprint-contracts'], wf: ['ship-feature', 'full-startup'], al: true },
  'sprint-contracts':      { group: 'strategy', pre: ['plan', 'shape'], next: ['ralph', 'team'], wf: ['ship-feature'] },
  'brand-guidelines':      { group: 'strategy', pre: ['competitor-research'], next: ['website-creation', 'social-media'], wf: ['full-startup', 'build-lander'] },

  // DESIGN (17) — impeccable, shape, website-creation already done
  'critique':              { group: 'design', pre: ['impeccable'], next: ['layout', 'typeset', 'colorize', 'clarify', 'distill'], wf: ['design-review'] },
  'layout':                { group: 'design', pre: ['impeccable'], next: ['polish'], wf: ['build-lander', 'design-review'] },
  'typeset':               { group: 'design', pre: ['impeccable'], next: ['polish'], wf: ['build-lander', 'design-review'] },
  'colorize':              { group: 'design', pre: ['impeccable'], next: ['polish'], wf: ['build-lander', 'design-review'] },
  'animate':               { group: 'design', pre: ['impeccable'], next: ['delight', 'polish'], wf: ['build-lander', 'design-review'] },
  'bolder':                { group: 'design', pre: ['impeccable'], next: ['quieter', 'polish'], wf: ['design-review'] },
  'quieter':               { group: 'design', pre: ['impeccable'], next: ['polish'], wf: ['design-review'] },
  'delight':               { group: 'design', pre: ['impeccable', 'animate'], next: ['overdrive', 'polish'], wf: ['design-review'] },
  'distill':               { group: 'design', pre: ['impeccable'], next: ['polish'], wf: ['design-review'] },
  'overdrive':             { group: 'design', pre: ['impeccable', 'delight'], next: ['polish'], wf: ['design-review'] },
  'adapt':                 { group: 'design', pre: ['impeccable'], next: ['accessibility-checker', 'polish'], wf: ['build-lander', 'design-review'] },
  'clarify':               { group: 'design', pre: ['impeccable'], next: ['anti-ai-writing', 'polish'], wf: ['design-review'] },
  'polish':                { group: 'design', pre: ['impeccable'], next: ['visual-qa-pipeline', 'deploy-pipeline'], wf: ['build-lander', 'design-review', 'full-startup'] },
  'asset-generation':      { group: 'design', pre: ['brand-guidelines', 'shape'], next: ['website-creation'], wf: ['build-lander', 'full-startup'] },
  'optimize':              { group: 'design', pre: [], next: ['performance-benchmark'], wf: ['design-review', 'continuous-improvement'] },

  // BUILD (15) — convex ecosystem + test-generator + stack-extend
  'convex':                    { group: 'build', pre: ['plan'], next: ['convex-schema-validator', 'convex-functions', 'convex-best-practices'], wf: ['full-startup', 'ship-feature'] },
  'convex-agents':             { group: 'build', pre: ['convex-functions'], next: ['convex-security-audit'], wf: ['full-startup'] },
  'convex-best-practices':     { group: 'build', pre: ['convex'], next: ['convex-component-authoring'], wf: ['full-startup'] },
  'convex-component-authoring':{ group: 'build', pre: ['convex-best-practices'], next: ['convex-security-audit'], wf: ['full-startup'] },
  'convex-cron-jobs':          { group: 'build', pre: ['convex-functions'], next: ['convex-security-check'], wf: ['full-startup'] },
  'convex-file-storage':       { group: 'build', pre: ['convex-functions'], next: ['convex-security-check'], wf: ['full-startup'] },
  'convex-functions':          { group: 'build', pre: ['convex-schema-validator'], next: ['convex-realtime', 'convex-http-actions', 'convex-cron-jobs', 'convex-file-storage', 'convex-agents'], wf: ['full-startup', 'ship-feature'] },
  'convex-http-actions':       { group: 'build', pre: ['convex-functions'], next: ['convex-security-check'], wf: ['full-startup'] },
  'convex-migrations':         { group: 'build', pre: ['convex-schema-validator'], next: ['convex-functions'], wf: ['full-startup'] },
  'convex-realtime':           { group: 'build', pre: ['convex-functions'], next: ['convex-security-check'], wf: ['full-startup'] },
  'convex-schema-validator':   { group: 'build', pre: ['plan'], next: ['convex-functions', 'convex-migrations'], wf: ['full-startup', 'ship-feature'] },
  'convex-security-audit':     { group: 'build', pre: ['convex-security-check'], next: ['deploy-pipeline'], wf: ['full-startup'] },
  'convex-security-check':     { group: 'build', pre: ['convex-functions'], next: ['convex-security-audit'], wf: ['full-startup'] },
  'test-generator':            { group: 'build', pre: ['sprint-contracts'], next: ['verify', 'ultraqa', 'ci-cd-pipeline'], wf: ['ship-feature', 'full-startup'] },
  'stack-extend':              { group: 'build', pre: ['plan'], next: ['post-deploy-loop'], wf: ['full-startup'] },

  // QUALITY (9) — verify already done
  'audit':                 { group: 'quality', pre: ['impeccable'], next: ['layout', 'typeset', 'colorize', 'clarify', 'adapt'], wf: ['design-review', 'full-startup'] },
  'slop-cleaner':          { group: 'quality', pre: [], next: ['verify'], wf: ['ship-feature', 'continuous-improvement'] },
  'visual-qa-pipeline':    { group: 'quality', pre: ['website-creation'], next: ['polish'], wf: ['build-lander', 'design-review', 'full-startup'] },
  'accessibility-checker': { group: 'quality', pre: ['website-creation', 'adapt'], next: ['audit'], wf: ['design-review', 'full-startup'] },
  'performance-benchmark': { group: 'quality', pre: ['website-creation'], next: ['deploy-pipeline'], wf: ['build-lander', 'full-startup'] },
  'security-scanner':      { group: 'quality', pre: [], next: ['deploy-pipeline', 'ci-cd-pipeline'], wf: ['full-startup', 'continuous-improvement'] },
  'cubic-codebase-scan':   { group: 'quality', pre: [], next: ['github-state-manager'], wf: ['continuous-improvement'] },
  'eval-framework':        { group: 'quality', pre: ['agent-creator', 'test-generator'], next: ['self-improve'], wf: ['continuous-improvement'] },

  // SHIP (5)
  'deploy-pipeline':       { group: 'ship', pre: ['security-scanner', 'verify', 'ci-cd-pipeline'], next: ['post-deploy-loop', 'uptime-monitor'], wf: ['full-startup', 'ship-feature', 'build-lander', 'incident-response'] },
  'ci-cd-pipeline':        { group: 'ship', pre: ['test-generator'], next: ['deploy-pipeline'], wf: ['full-startup', 'ship-feature'] },
  'seo-setup':             { group: 'ship', pre: ['website-creation'], next: ['seo-chat', 'programmatic-seo'], wf: ['full-startup', 'build-lander', 'seo-content-growth'] },
  'legal-generator':       { group: 'ship', pre: ['plan'], next: ['website-creation'], wf: ['full-startup'] },
  'dependency-manager':    { group: 'ship', pre: [], next: ['security-scanner'], wf: ['continuous-improvement'] },

  // GROW (9)
  'analytics-integration':  { group: 'grow', pre: ['website-creation'], next: ['landing-page-optimizer', 'post-deploy-loop'], wf: ['full-startup', 'seo-content-growth'] },
  'landing-page-optimizer':  { group: 'grow', pre: ['analytics-integration', 'website-creation'], next: ['post-deploy-loop'], wf: ['build-lander', 'seo-content-growth'] },
  'programmatic-seo':        { group: 'grow', pre: ['seo-chat', 'analytics-integration'], next: ['seo-setup', 'landing-page-optimizer'], wf: ['seo-content-growth'] },
  'seo-chat':                { group: 'grow', pre: ['seo-setup'], next: ['programmatic-seo', 'blog-scaffolder'], wf: ['seo-content-growth'] },
  'social-intelligence':     { group: 'grow', pre: ['social-media'], next: ['slack-course-correction'], wf: ['seo-content-growth'] },
  'social-media':            { group: 'grow', pre: ['brand-guidelines', 'anti-ai-writing'], next: ['social-intelligence'], wf: ['seo-content-growth', 'full-startup'] },
  'user-feedback-collector': { group: 'grow', pre: ['website-creation'], next: ['github-state-manager'], wf: ['full-startup'] },
  'data-driven-blog':        { group: 'grow', pre: ['blog-scaffolder', 'analytics-integration'], next: ['social-media'], wf: ['seo-content-growth'] },
  'blog-scaffolder':         { group: 'grow', pre: ['seo-chat', 'brand-guidelines'], next: ['data-driven-blog'], wf: ['seo-content-growth'] },

  // OPERATE (6)
  'uptime-monitor':    { group: 'operate', pre: ['deploy-pipeline'], next: ['incident-response'], wf: ['incident-response', 'full-startup'] },
  'error-tracking':    { group: 'operate', pre: ['website-creation', 'convex-functions'], next: ['incident-response', 'error-classifier'], wf: ['incident-response', 'full-startup'] },
  'incident-response': { group: 'operate', pre: ['uptime-monitor', 'error-tracking'], next: ['deploy-pipeline', 'github-state-manager'], wf: ['incident-response'] },
  'log-aggregation':   { group: 'operate', pre: ['deploy-pipeline'], next: ['debug', 'incident-response'], wf: ['incident-response'] },
  'post-deploy-loop':  { group: 'operate', pre: ['deploy-pipeline'], next: ['uptime-monitor', 'landing-page-optimizer', 'investor-updates'], wf: ['full-startup', 'continuous-improvement'] },
  'cost-tracker':      { group: 'operate', pre: [], next: ['investor-updates'], wf: ['continuous-improvement'] },

  // COMMS (6) — anti-ai-writing already done
  'investor-updates':      { group: 'comms', pre: ['github-state-manager', 'analytics-integration'], next: ['slack-course-correction'], wf: ['full-startup', 'seo-content-growth'] },
  'slack-course-correction':{ group: 'comms', pre: ['investor-updates'], next: ['plan', 'issue-creator'], wf: ['incident-response'] },
  'readme-generator':      { group: 'comms', pre: [], next: ['documentation-generator', 'contributing-guide'], wf: ['full-startup'] },
  'contributing-guide':    { group: 'comms', pre: ['readme-generator'], next: [], wf: ['full-startup'] },
  'documentation-generator':{ group: 'comms', pre: [], next: ['readme-generator'], wf: ['full-startup'] },
};

const fmt = (arr) => arr.length ? `[${arr.join(', ')}]` : '[]';

let updated = 0;
let skipped = 0;
const errors = [];

for (const [name, m] of Object.entries(META)) {
  const fp = join(SKILLS_DIR, name, 'SKILL.md');
  if (!existsSync(fp)) { errors.push(`MISSING: ${name}`); continue; }

  let content = readFileSync(fp, 'utf-8');

  // Skip already-processed
  if (content.includes('\ngroup:')) { skipped++; continue; }

  if (!content.startsWith('---')) { errors.push(`NO FRONTMATTER: ${name}`); continue; }

  // Find closing ---
  const idx = content.indexOf('\n---', 3);
  if (idx === -1) { errors.push(`BROKEN: ${name}`); continue; }

  const before = content.substring(0, idx);
  const after = content.substring(idx);

  // Build new lines
  let lines = `\ngroup: ${m.group}`;
  lines += `\nprerequisites: ${fmt(m.pre)}`;
  lines += `\nnext: ${fmt(m.next)}`;
  lines += `\nworkflows: ${fmt(m.wf)}`;
  if (m.al) lines += `\nalways-load: true`;

  const newContent = before + lines + after;
  writeFileSync(fp, newContent);
  updated++;
}

console.log(`Updated: ${updated}, Skipped: ${skipped}`);
if (errors.length) errors.forEach(e => console.log(`  ERR: ${e}`));
