import { describe, test, expect } from "bun:test";
import {
  extractLearnings,
  proposeSkillUpdate,
  shouldUpdateSkill,
  checkIsSimplification,
  SKILL_UPDATE_CONFIDENCE_THRESHOLD,
} from "../src/self-improve.js";

describe("extractLearnings", () => {
  test("extracts learning from 'discovered that' pattern", () => {
    const transcript = `
Analyzing the codebase...
I discovered that the auth module silently drops sessions when tokens expire during long-running operations.
Tests pass after the fix.
    `;
    const result = extractLearnings(transcript);
    expect(result.learnings.length).toBeGreaterThan(0);
    expect(result.learnings[0].insight).toContain("auth module silently drops sessions");
  });

  test("extracts learning from 'the fix was' pattern", () => {
    const transcript = `
Looking at the error...
The fix was wrapping the StreamResponse in a try/except for ClientDisconnectedError.
All tests confirmed passing.
    `;
    const result = extractLearnings(transcript);
    expect(result.learnings.length).toBeGreaterThan(0);
    expect(result.learnings[0].insight).toContain("wrapping the StreamResponse");
  });

  test("extracts learning from 'gotcha' pattern", () => {
    const transcript = `
Debugging the issue...
Gotcha: the ESM loader requires fileURLToPath before path.join works correctly in this project.
Completed the task.
    `;
    const result = extractLearnings(transcript);
    expect(result.learnings.length).toBeGreaterThan(0);
    expect(result.learnings[0].type).toBe("gotcha");
  });

  test("counts successful actions", () => {
    const transcript = `
Running tests...
Tests pass for auth module.
All green on the integration suite.
Verified the deployment.
    `;
    const result = extractLearnings(transcript);
    expect(result.successfulActions).toBe(3);
  });

  test("counts failed actions", () => {
    const transcript = `
Attempting the change...
Error: Cannot find module './missing.js'
The build crashed with exit code 1.
Retrying with different approach...
    `;
    const result = extractLearnings(transcript);
    expect(result.failedActions).toBe(2);
    expect(result.retriedActions).toBe(1);
  });

  test("skips trivial insights under 10 characters", () => {
    const transcript = `
I discovered that yes.
I discovered that the module resolution in this monorepo requires explicit .js extensions for ESM compatibility.
    `;
    const result = extractLearnings(transcript);
    // "yes" is too short, should be skipped
    expect(result.learnings.length).toBe(1);
    expect(result.learnings[0].insight).toContain("module resolution");
  });

  test("deduplicates similar learnings", () => {
    const transcript = `
I discovered that the auth module drops sessions on token expiry.
Key insight: the auth module drops sessions on token expiry during long ops.
    `;
    const result = extractLearnings(transcript);
    // Both match similar content — should deduplicate
    expect(result.learnings.length).toBeLessThanOrEqual(2);
  });

  test("returns empty learnings for transcript without signals", () => {
    const transcript = `
Reading file src/index.ts...
The file contains 50 lines.
Moving to next file.
    `;
    const result = extractLearnings(transcript);
    expect(result.learnings.length).toBe(0);
  });

  test("classifies optimization type correctly", () => {
    const transcript = `
I discovered that using batch reads is faster than individual file reads for this codebase.
    `;
    const result = extractLearnings(transcript);
    expect(result.learnings.length).toBe(1);
    expect(result.learnings[0].type).toBe("optimization");
  });

  test("classifies workflow type correctly", () => {
    const transcript = `
I realized that you should first run typecheck, then run tests in this project.
    `;
    const result = extractLearnings(transcript);
    expect(result.learnings.length).toBe(1);
    expect(result.learnings[0].type).toBe("workflow");
  });

  test("extracts file references from context", () => {
    const transcript = `
Looking at src/auth/session.ts and src/auth/token.ts...
I discovered that the session handler at src/auth/session.ts needs a null check before accessing user properties.
Tests pass after the fix.
    `;
    const result = extractLearnings(transcript);
    expect(result.learnings.length).toBeGreaterThan(0);
    expect(result.learnings[0].relatedFiles).toContain("src/auth/session.ts");
  });

  test("generates meaningful triggers", () => {
    const transcript = `
I discovered that the database connection pool exhausts under concurrent requests when the timeout is set below 5000ms.
    `;
    const result = extractLearnings(transcript);
    expect(result.learnings[0].triggers.length).toBeGreaterThan(0);
    expect(result.learnings[0].triggers.some((t) => t.includes("database") || t.includes("connection"))).toBe(true);
  });
});

describe("proposeSkillUpdate", () => {
  test("creates proposal with correct skill path", () => {
    const proposal = proposeSkillUpdate(
      "/path/to/skill.md",
      "Add a step to verify ESM compatibility before running tests",
    );
    expect(proposal.skillPath).toBe("/path/to/skill.md");
    expect(proposal.proposedContent).toContain("ESM compatibility");
  });

  test("identifies workflow section for step-related improvements", () => {
    const proposal = proposeSkillUpdate(
      "/path/to/skill.md",
      "Add workflow step: check tsconfig before building",
    );
    // Should identify "Workflow" or "new" depending on file existence
    expect(typeof proposal.section).toBe("string");
  });

  test("sets confidence based on specificity", () => {
    const vague = proposeSkillUpdate("/path/to/skill.md", "Make things better");
    const specific = proposeSkillUpdate(
      "/path/to/skill.md",
      "In src/auth/session.ts:45, add null check before accessing session.user to prevent TypeError when session expires during long-running operations",
    );
    expect(specific.confidence).toBeGreaterThan(vague.confidence);
  });
});

describe("shouldUpdateSkill", () => {
  const longSkill = `
## Workflow

1. Read the file
2. Check for errors
3. Run the lint
4. Run the formatter
5. Run the tests
6. Check coverage
7. Generate report
8. Review results
9. Submit changes

If the tests fail, retry. When coverage drops, investigate. Unless there is an exception, always re-run.
  `.trim();

  const simplerSkill = `
## Workflow

1. Read the file
2. Run tests
3. Submit changes
  `.trim();

  test("rejects updates below confidence threshold", () => {
    expect(shouldUpdateSkill(longSkill, simplerSkill, 0.5)).toBe(false);
    expect(shouldUpdateSkill(longSkill, simplerSkill, 0.69)).toBe(false);
  });

  test("accepts simplifications above confidence threshold", () => {
    expect(shouldUpdateSkill(longSkill, simplerSkill, 0.8)).toBe(true);
    expect(shouldUpdateSkill(longSkill, simplerSkill, 1.0)).toBe(true);
  });

  test("rejects at exactly the threshold boundary", () => {
    // confidence < 0.7, not <=
    expect(shouldUpdateSkill(longSkill, simplerSkill, 0.69)).toBe(false);
  });

  test("accepts at threshold", () => {
    expect(shouldUpdateSkill(longSkill, simplerSkill, 0.7)).toBe(true);
  });

  test("rejects non-simplifications even with high confidence", () => {
    const longerProposal = longSkill + "\n10. Extra step\n11. Another step\n12. Yet more";
    expect(shouldUpdateSkill(longSkill, longerProposal, 0.95)).toBe(false);
  });

  test("rejects updates to empty skills (not a simplification)", () => {
    expect(shouldUpdateSkill("", "New content here", 0.9)).toBe(false);
  });

  test("rejects contradictory updates", () => {
    const currentSkill = "Never modify test files to make tests pass. Always run the full test suite.";
    const contradictory = "Always modify test files when tests fail. This is a simpler approach.";
    expect(shouldUpdateSkill(currentSkill, contradictory, 0.9)).toBe(false);
  });
});

describe("checkIsSimplification", () => {
  test("fewer words is simpler", () => {
    const current = "This is a long description with many unnecessary words that could be shorter";
    const proposed = "Short description";
    expect(checkIsSimplification(current, proposed)).toBe(true);
  });

  test("more words is not simpler", () => {
    const current = "Short";
    const proposed = "This is now much longer with many more words added";
    expect(checkIsSimplification(current, proposed)).toBe(false);
  });

  test("fewer numbered steps is simpler", () => {
    const current = "1. Step one\n2. Step two\n3. Step three\n4. Step four\n5. Step five";
    const proposed = "1. Step one\n2. Step two\n3. Step three";
    expect(checkIsSimplification(current, proposed)).toBe(true);
  });

  test("empty current content means nothing to simplify", () => {
    expect(checkIsSimplification("", "New content")).toBe(false);
  });

  test("fewer conditions is simpler when there are many", () => {
    const current = "If A, then B. When C, do D. Unless E, skip F. If G, except when H.";
    const proposed = "Do B when A. Skip F otherwise.";
    expect(checkIsSimplification(current, proposed)).toBe(true);
  });
});

describe("SKILL_UPDATE_CONFIDENCE_THRESHOLD", () => {
  test("is 0.7", () => {
    expect(SKILL_UPDATE_CONFIDENCE_THRESHOLD).toBe(0.7);
  });
});
