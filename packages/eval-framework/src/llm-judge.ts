/**
 * LLM-as-judge evaluator for skill output quality.
 *
 * Sends skill output to Claude Sonnet with a structured judge prompt,
 * scoring on clarity, completeness, and actionability (1-5 each).
 * All axes must be >= 4 to pass.
 *
 * Requires: ANTHROPIC_API_KEY env var.
 */

import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JudgeScores {
  clarity: number; // 1-5
  completeness: number; // 1-5
  actionability: number; // 1-5
}

export interface JudgeResult {
  pass: boolean;
  scores: JudgeScores;
  reasoning: string;
}

export interface JudgeOptions {
  /** The skill output text or file content to evaluate. */
  content: string;
  /** Optional context about what the skill was supposed to produce. */
  taskDescription?: string;
  /** Minimum score on each axis to pass. Default 4. */
  threshold?: number;
  /** Model to use for judging. Default 'claude-opus-4-6'. */
  model?: string;
}

// ---------------------------------------------------------------------------
// Internal: call the Anthropic API
// ---------------------------------------------------------------------------

/**
 * Call Claude with a prompt and extract JSON from the response.
 * Retries once on 429 rate limit errors.
 */
export async function callJudge<T>(
  prompt: string,
  model: string = "claude-opus-4-6"
): Promise<T> {
  const client = new Anthropic();

  const makeRequest = () =>
    client.messages.create({
      model,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

  let response;
  try {
    response = await makeRequest();
  } catch (err: unknown) {
    const error = err as { status?: number };
    if (error.status === 429) {
      await new Promise((r) => setTimeout(r, 1000));
      response = await makeRequest();
    } else {
      throw err;
    }
  }

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch)
    throw new Error(`Judge returned non-JSON: ${text.slice(0, 200)}`);
  return JSON.parse(jsonMatch[0]) as T;
}

// ---------------------------------------------------------------------------
// Main judge function
// ---------------------------------------------------------------------------

const PASS_THRESHOLD = 4;

/**
 * Evaluate skill output quality using LLM-as-judge.
 *
 * Scores on three axes (1-5):
 *   - clarity: Is the output clear and well-structured?
 *   - completeness: Does it address the task fully?
 *   - actionability: Can someone act on the output without guessing?
 *
 * All axes must be >= threshold (default 4) to pass.
 */
export async function judge(options: JudgeOptions): Promise<JudgeResult> {
  const {
    content,
    taskDescription,
    threshold = PASS_THRESHOLD,
    model = "claude-opus-4-6",
  } = options;

  const taskContext = taskDescription
    ? `\nThe skill was asked to: ${taskDescription}\n`
    : "";

  const prompt = `You are evaluating the quality of output produced by an AI coding agent's skill.
${taskContext}
Rate the following output on three dimensions (1-5 scale):

- **clarity** (1-5): Is the output clear, well-organized, and easy to understand?
- **completeness** (1-5): Does it fully address the task? Are there gaps or missing pieces?
- **actionability** (1-5): Can someone act on this output directly, without needing to guess or fill in blanks?

Scoring guide:
- 5: Excellent — no ambiguity, all info present, immediately actionable
- 4: Good — minor gaps that an experienced person could infer
- 3: Adequate — some guessing required
- 2: Poor — significant info missing
- 1: Unusable — output would fail without external help

Respond with ONLY valid JSON in this exact format:
{"clarity": N, "completeness": N, "actionability": N, "reasoning": "brief explanation"}

Here is the output to evaluate:

${content}`;

  const raw = await callJudge<JudgeScores & { reasoning: string }>(
    prompt,
    model
  );

  const scores: JudgeScores = {
    clarity: raw.clarity,
    completeness: raw.completeness,
    actionability: raw.actionability,
  };

  const pass =
    scores.clarity >= threshold &&
    scores.completeness >= threshold &&
    scores.actionability >= threshold;

  return {
    pass,
    scores,
    reasoning: raw.reasoning,
  };
}

// ---------------------------------------------------------------------------
// Specialized judge variants
// ---------------------------------------------------------------------------

/**
 * Judge a specific documentation section (mirrors the gstack reference).
 */
export async function judgeDocSection(
  sectionName: string,
  content: string,
  model?: string
): Promise<JudgeResult> {
  return judge({
    content,
    taskDescription: `produce documentation for the "${sectionName}" section`,
    model,
  });
}

/**
 * Judge with a custom prompt. For advanced use cases where the standard
 * 3-axis evaluation doesn't fit.
 */
export async function judgeCustom<T>(
  prompt: string,
  model?: string
): Promise<T> {
  return callJudge<T>(prompt, model);
}
