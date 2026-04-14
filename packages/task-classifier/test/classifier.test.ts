import { describe, test, expect } from "bun:test";
import { classifyTask } from "../src/classifier.js";

describe("classifyTask", () => {
  // ─── Trivial tasks ──────────────────────────────────────────────────────────

  test("single file, <50 lines → trivial", () => {
    const result = classifyTask("fix typo in readme", 1, 10);
    expect(result).toBe("trivial");
  });

  test("keyword 'typo' forces trivial regardless of file count", () => {
    const result = classifyTask("fix typo in header component", 3, 20);
    expect(result).toBe("trivial");
  });

  test("keyword 'fix import' forces trivial", () => {
    const result = classifyTask("fix import path in utils", 1, 5);
    expect(result).toBe("trivial");
  });

  test("keyword 'rename' with single file is trivial", () => {
    const result = classifyTask("rename variable in parser", 1, 15);
    expect(result).toBe("trivial");
  });

  test("single file at exactly 50 lines is still trivial", () => {
    const result = classifyTask("update constant value", 1, 50);
    expect(result).toBe("trivial");
  });

  // ─── Moderate tasks ─────────────────────────────────────────────────────────

  test("2-5 files, <500 lines → moderate", () => {
    const result = classifyTask("add validation to form submission", 3, 200);
    expect(result).toBe("moderate");
  });

  test("keyword 'refactor' forces moderate minimum", () => {
    const result = classifyTask("refactor utils module", 1, 30);
    expect(result).toBe("moderate");
  });

  test("keyword 'feature' with moderate file count → moderate", () => {
    const result = classifyTask("add search feature to sidebar", 4, 300);
    expect(result).toBe("moderate");
  });

  test("5 files at 499 lines is moderate", () => {
    const result = classifyTask("update handlers", 5, 499);
    expect(result).toBe("moderate");
  });

  // ─── Complex tasks ──────────────────────────────────────────────────────────

  test(">5 files → complex", () => {
    const result = classifyTask("update all API handlers", 8, 300);
    expect(result).toBe("complex");
  });

  test(">500 lines → complex", () => {
    const result = classifyTask("implement new module", 3, 600);
    expect(result).toBe("complex");
  });

  test("keyword 'architecture' forces complex", () => {
    const result = classifyTask("redesign architecture for auth system", 2, 100);
    expect(result).toBe("complex");
  });

  test("keyword 'migration' forces complex", () => {
    const result = classifyTask("database migration for user schema", 3, 200);
    expect(result).toBe("complex");
  });

  test("keyword 'redesign' forces complex", () => {
    const result = classifyTask("redesign the dashboard layout system", 4, 400);
    expect(result).toBe("complex");
  });

  test("keyword 'multi-service' forces complex", () => {
    const result = classifyTask("multi-service integration with payments", 2, 100);
    expect(result).toBe("complex");
  });

  // ─── Edge cases ─────────────────────────────────────────────────────────────

  test("0 files defaults to trivial", () => {
    const result = classifyTask("check something", 0, 0);
    expect(result).toBe("trivial");
  });

  test("empty description with large metrics still uses metrics", () => {
    const result = classifyTask("", 10, 1000);
    expect(result).toBe("complex");
  });

  test("keyword priority: complex keyword overrides trivial metrics", () => {
    const result = classifyTask("architecture review", 1, 10);
    expect(result).toBe("complex");
  });

  test("keyword priority: moderate keyword overrides trivial metrics but not complex metrics", () => {
    const result = classifyTask("refactor the API layer", 10, 1000);
    expect(result).toBe("complex");
  });
});
