/**
 * Tests for the LLM-as-judge evaluator.
 *
 * Mocks the Anthropic SDK to avoid real API calls.
 */

import { describe, test, expect, mock, beforeEach } from "bun:test";
import { judge, callJudge, type JudgeResult } from "../src/llm-judge";

// ---------------------------------------------------------------------------
// Mock setup
// ---------------------------------------------------------------------------

// Mock the Anthropic SDK
const mockCreate = mock(() =>
  Promise.resolve({
    content: [
      {
        type: "text" as const,
        text: '{"clarity": 5, "completeness": 4, "actionability": 5, "reasoning": "Well structured output with clear instructions."}',
      },
    ],
  })
);

mock.module("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    messages = { create: mockCreate };
  },
}));

beforeEach(() => {
  mockCreate.mockClear();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("callJudge", () => {
  test("parses JSON from response text", async () => {
    const result = await callJudge<{ clarity: number; reasoning: string }>(
      "test prompt"
    );
    expect(result.clarity).toBe(5);
    expect(result.reasoning).toBe(
      "Well structured output with clear instructions."
    );
  });

  test("calls Anthropic with correct parameters", async () => {
    await callJudge("test prompt", "claude-sonnet-4-6");
    expect(mockCreate).toHaveBeenCalledTimes(1);

    const callArgs = mockCreate.mock.calls[0][0] as Record<string, unknown>;
    expect(callArgs.model).toBe("claude-sonnet-4-6");
    expect(callArgs.max_tokens).toBe(1024);
    expect(
      (callArgs.messages as Array<{ role: string; content: string }>)[0].content
    ).toBe("test prompt");
  });

  test("retries on 429 rate limit", async () => {
    let callCount = 0;
    mockCreate.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        const err = new Error("Rate limited") as Error & { status: number };
        err.status = 429;
        return Promise.reject(err);
      }
      return Promise.resolve({
        content: [
          {
            type: "text" as const,
            text: '{"clarity": 3, "completeness": 3, "actionability": 3, "reasoning": "ok"}',
          },
        ],
      });
    });

    const result = await callJudge<{ clarity: number }>("test");
    expect(result.clarity).toBe(3);
    expect(callCount).toBe(2);
  });

  test("throws on non-JSON response", async () => {
    mockCreate.mockImplementation(() =>
      Promise.resolve({
        content: [{ type: "text" as const, text: "Not JSON at all" }],
      })
    );

    await expect(callJudge("test")).rejects.toThrow("Judge returned non-JSON");
  });

  test("extracts JSON embedded in other text", async () => {
    mockCreate.mockImplementation(() =>
      Promise.resolve({
        content: [
          {
            type: "text" as const,
            text: 'Here is my evaluation:\n{"clarity": 4, "completeness": 4, "actionability": 4, "reasoning": "good"}\nThat is my assessment.',
          },
        ],
      })
    );

    const result = await callJudge<{ clarity: number }>("test");
    expect(result.clarity).toBe(4);
  });
});

describe("judge", () => {
  beforeEach(() => {
    mockCreate.mockImplementation(() =>
      Promise.resolve({
        content: [
          {
            type: "text" as const,
            text: '{"clarity": 5, "completeness": 4, "actionability": 5, "reasoning": "Well structured output with clear instructions."}',
          },
        ],
      })
    );
  });

  test("returns pass when all scores >= 4", async () => {
    const result = await judge({ content: "Some great output" });

    expect(result.pass).toBe(true);
    expect(result.scores.clarity).toBe(5);
    expect(result.scores.completeness).toBe(4);
    expect(result.scores.actionability).toBe(5);
    expect(result.reasoning).toBe(
      "Well structured output with clear instructions."
    );
  });

  test("returns fail when any score < 4", async () => {
    mockCreate.mockImplementation(() =>
      Promise.resolve({
        content: [
          {
            type: "text" as const,
            text: '{"clarity": 5, "completeness": 3, "actionability": 5, "reasoning": "Missing some details."}',
          },
        ],
      })
    );

    const result = await judge({ content: "Incomplete output" });

    expect(result.pass).toBe(false);
    expect(result.scores.completeness).toBe(3);
  });

  test("respects custom threshold", async () => {
    mockCreate.mockImplementation(() =>
      Promise.resolve({
        content: [
          {
            type: "text" as const,
            text: '{"clarity": 3, "completeness": 3, "actionability": 3, "reasoning": "Adequate."}',
          },
        ],
      })
    );

    const result = await judge({
      content: "Adequate output",
      threshold: 3,
    });

    expect(result.pass).toBe(true);
  });

  test("includes task description in prompt when provided", async () => {
    await judge({
      content: "Output text",
      taskDescription: "generate a migration plan",
    });

    const callArgs = mockCreate.mock.calls[0][0] as Record<string, unknown>;
    const promptText = (
      callArgs.messages as Array<{ content: string }>
    )[0].content;
    expect(promptText).toContain("generate a migration plan");
  });

  test("works without task description", async () => {
    await judge({ content: "Output text" });

    const callArgs = mockCreate.mock.calls[0][0] as Record<string, unknown>;
    const promptText = (
      callArgs.messages as Array<{ content: string }>
    )[0].content;
    expect(promptText).not.toContain("The skill was asked to:");
  });

  test("all scores at exactly threshold pass", async () => {
    mockCreate.mockImplementation(() =>
      Promise.resolve({
        content: [
          {
            type: "text" as const,
            text: '{"clarity": 4, "completeness": 4, "actionability": 4, "reasoning": "Meets minimum bar."}',
          },
        ],
      })
    );

    const result = await judge({ content: "Borderline output" });
    expect(result.pass).toBe(true);
  });

  test("score of 1 fails", async () => {
    mockCreate.mockImplementation(() =>
      Promise.resolve({
        content: [
          {
            type: "text" as const,
            text: '{"clarity": 1, "completeness": 1, "actionability": 1, "reasoning": "Unusable."}',
          },
        ],
      })
    );

    const result = await judge({ content: "Terrible output" });
    expect(result.pass).toBe(false);
    expect(result.scores.clarity).toBe(1);
  });
});
