/**
 * Tests for the LLM-as-judge evaluator.
 *
 * Mocks the child_process spawn to avoid real claude -p calls.
 */

import { describe, test, expect, mock, beforeEach } from "bun:test";
import { judge, callJudge, type JudgeResult } from "../src/llm-judge";
import { EventEmitter } from "events";
import { Readable, Writable } from "stream";

// ---------------------------------------------------------------------------
// Mock setup — mock child_process.spawn to simulate claude -p
// ---------------------------------------------------------------------------

function createMockProcess(stdout: string, exitCode = 0) {
  const proc = new EventEmitter() as EventEmitter & {
    stdout: Readable;
    stderr: Readable;
    stdin: Writable;
  };
  proc.stdout = Readable.from([stdout]);
  proc.stderr = Readable.from([]);
  proc.stdin = new Writable({
    write(_chunk, _enc, cb) { cb(); },
  });

  setTimeout(() => proc.emit("close", exitCode), 10);
  return proc;
}

let mockSpawn: ReturnType<typeof mock>;

function setMockResponse(jsonStr: string, exitCode = 0) {
  const output = JSON.stringify({ result: jsonStr });
  mockSpawn = mock(() => createMockProcess(output, exitCode));
  mock.module("child_process", () => ({
    spawn: mockSpawn,
  }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("callJudge", () => {
  beforeEach(() => {
    setMockResponse('{"clarity": 5, "completeness": 4, "actionability": 5, "reasoning": "Well structured output with clear instructions."}');
  });

  test("parses JSON from response text", async () => {
    const result = await callJudge<{ clarity: number; reasoning: string }>("test prompt");
    expect(result.clarity).toBe(5);
    expect(result.reasoning).toBe("Well structured output with clear instructions.");
  });

  test("throws on non-JSON response", async () => {
    setMockResponse("Not JSON at all");
    await expect(callJudge("test")).rejects.toThrow("Judge returned non-JSON");
  });

  test("extracts JSON embedded in other text", async () => {
    setMockResponse('Here is my evaluation:\n{"clarity": 4, "completeness": 4, "actionability": 4, "reasoning": "good"}\nThat is my assessment.');
    const result = await callJudge<{ clarity: number }>("test");
    expect(result.clarity).toBe(4);
  });

  test("throws on non-zero exit code", async () => {
    const output = JSON.stringify({ result: "error" });
    mockSpawn = mock(() => createMockProcess(output, 1));
    mock.module("child_process", () => ({ spawn: mockSpawn }));

    await expect(callJudge("test")).rejects.toThrow("claude -p exited with code 1");
  });
});

describe("judge", () => {
  beforeEach(() => {
    setMockResponse('{"clarity": 5, "completeness": 4, "actionability": 5, "reasoning": "Well structured output with clear instructions."}');
  });

  test("returns pass when all scores >= 4", async () => {
    const result = await judge({ content: "Some great output" });
    expect(result.pass).toBe(true);
    expect(result.scores.clarity).toBe(5);
    expect(result.scores.completeness).toBe(4);
    expect(result.scores.actionability).toBe(5);
    expect(result.reasoning).toBe("Well structured output with clear instructions.");
  });

  test("returns fail when any score < 4", async () => {
    setMockResponse('{"clarity": 5, "completeness": 3, "actionability": 5, "reasoning": "Missing some details."}');
    const result = await judge({ content: "Incomplete output" });
    expect(result.pass).toBe(false);
    expect(result.scores.completeness).toBe(3);
  });

  test("respects custom threshold", async () => {
    setMockResponse('{"clarity": 3, "completeness": 3, "actionability": 3, "reasoning": "Adequate."}');
    const result = await judge({ content: "Adequate output", threshold: 3 });
    expect(result.pass).toBe(true);
  });

  test("all scores at exactly threshold pass", async () => {
    setMockResponse('{"clarity": 4, "completeness": 4, "actionability": 4, "reasoning": "Meets minimum bar."}');
    const result = await judge({ content: "Borderline output" });
    expect(result.pass).toBe(true);
  });

  test("score of 1 fails", async () => {
    setMockResponse('{"clarity": 1, "completeness": 1, "actionability": 1, "reasoning": "Unusable."}');
    const result = await judge({ content: "Terrible output" });
    expect(result.pass).toBe(false);
    expect(result.scores.clarity).toBe(1);
  });
});
