#!/usr/bin/env bun
/**
 * CLI: Run LLM-as-judge evals.
 * Tier 3 — uses Anthropic API to score skill output quality.
 *
 * Fixes #7: no longer a placeholder pass-through.
 */

import * as path from "path";
import { readFileSync, existsSync } from "fs";
import { autoSelectEvals } from "./touchfiles";
import { EvalCollector } from "./eval-store";

const projectRoot = path.resolve(import.meta.dir, "..", "..", "..");

const selection = autoSelectEvals(projectRoot, { tier: "judge" });

console.error(`Judge eval selection: ${selection.reason}`);
console.error(`  Selected: ${selection.selected.length}`);
console.error(`  Skipped: ${selection.skipped.length}`);

if (selection.selected.length === 0) {
  console.error("\nNo judge evals to run (no matching changes).");
  process.exit(0);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("\nWARNING: ANTHROPIC_API_KEY not set. Judge evals require API access.");
  process.exit(1);
}

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

async function judgeSkill(skillName: string, skillContent: string): Promise<{
  score: number;
  pass: boolean;
  reasoning: string;
}> {
  const response = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `You are an eval judge. Score this skill definition on a scale of 1-10 for:
1. Clarity: Is the purpose and usage clear?
2. Completeness: Does it cover all necessary steps?
3. Specificity: Are instructions concrete, not vague?
4. Anti-patterns: Does it list what NOT to do?
5. Actionability: Can an agent follow this and produce good output?

Skill name: ${skillName}
Skill content:
${skillContent.slice(0, 3000)}

Respond in exactly this format:
SCORE: <number 1-10>
PASS: <yes/no> (pass if score >= 6)
REASONING: <one paragraph explanation>`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json() as any;
  const text = data.content?.[0]?.text || "";

  const scoreMatch = text.match(/SCORE:\s*(\d+)/);
  const passMatch = text.match(/PASS:\s*(yes|no)/i);
  const reasonMatch = text.match(/REASONING:\s*(.*)/s);

  const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;
  const pass = passMatch ? passMatch[1].toLowerCase() === "yes" : score >= 6;
  const reasoning = reasonMatch ? reasonMatch[1].trim() : text;

  return { score, pass, reasoning };
}

const collector = new EvalCollector("judge", projectRoot);

for (const entry of selection.selected) {
  console.error(`\n  Judging: ${entry.name}`);
  const startTime = Date.now();

  try {
    // Read the skill content
    const skillPath = path.join(projectRoot, "skills", entry.name, "SKILL.md");
    if (!existsSync(skillPath)) {
      collector.addEntry({
        skill_name: entry.name,
        tier: "judge",
        result: "error",
        metrics: { cost_usd: 0, turns: 0, duration_ms: 0 },
        details: { error: `Skill file not found: ${skillPath}` },
      });
      continue;
    }

    const skillContent = readFileSync(skillPath, "utf-8");
    const result = await judgeSkill(entry.name, skillContent);
    const durationMs = Date.now() - startTime;

    // Estimate cost: ~500 input tokens + 200 output tokens on Haiku
    const estimatedCost = 0.001;

    collector.addEntry({
      skill_name: entry.name,
      tier: "judge",
      result: result.pass ? "pass" : "fail",
      metrics: { cost_usd: estimatedCost, turns: 1, duration_ms: durationMs },
      details: {
        score: result.score,
        reasoning: result.reasoning,
      },
    });

    console.error(`  ${result.pass ? "PASS" : "FAIL"} (score: ${result.score}/10, ${durationMs}ms)`);
  } catch (e) {
    const durationMs = Date.now() - startTime;
    collector.addEntry({
      skill_name: entry.name,
      tier: "judge",
      result: "error",
      metrics: { cost_usd: 0, turns: 0, duration_ms: durationMs },
      details: { error: String(e) },
    });
    console.error(`  ERROR: ${e}`);
  }
}

const summaryPath = collector.finalize();
console.error(`\nResults saved to: ${summaryPath}`);

const results = collector.getEntries();
const failures = results.filter((r: any) => r.result !== "pass");
if (failures.length > 0) {
  console.error(`\n${failures.length} eval(s) failed or errored.`);
  process.exit(1);
}
