import { describe, it, expect } from "vitest";
import { validateIssue } from "../src/validate-issue-create.js";

/** Markdown template body (agent-created issues) */
const TEMPLATE_BODY = `## Type
feat

## Severity
P1

## Description
Add webhook validation for incoming GitHub events.

## Affected Packages
packages/webhook-receiver

## Acceptance Criteria
- [ ] Webhook payloads are validated against schema
- [ ] Invalid payloads return 400

## Verification Steps
1. Send valid payload, confirm 200
2. Send invalid payload, confirm 400`;

/** GitHub form body — feature (### headings, no Type field) */
const FEATURE_FORM_BODY = `### Severity

P2 — Enhancement

### Description

Generate landing pages from structured startup taxonomy.

### Affected Packages

packages/website-template

### Acceptance Criteria

- [ ] Landing page renders for each startup type
- [ ] SEO metadata is populated

### Verification Steps

1. Run build and check output
2. Verify meta tags`;

/** GitHub form body — bug (### headings, "What happened" instead of "Description") */
const BUG_FORM_BODY = `### Severity

P0 — System broken

### What happened

The deploy hook crashes with ENOENT when .harness/secrets.env is missing.

### Expected behavior

Hook should skip gracefully if secrets file is absent.

### Acceptance Criteria

- [ ] Bug no longer reproduces
- [ ] Regression test added

### Verification Steps

1. Remove secrets.env and run deploy hook
2. Confirm no crash`;

describe("validate-issue-create", () => {
  describe("title validation", () => {
    it("rejects missing title", () => {
      const errors = validateIssue(null, TEMPLATE_BODY);
      expect(errors).toContain("Missing --title flag");
    });

    it("rejects title without [type] prefix", () => {
      const errors = validateIssue("Add webhook validation", TEMPLATE_BODY);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain("Title must match");
    });

    it("accepts valid [feat] title", () => {
      const errors = validateIssue("[feat] Add webhook validation", TEMPLATE_BODY);
      expect(errors).toEqual([]);
    });

    it("accepts valid [fix] title", () => {
      const errors = validateIssue("[fix] Resolve deploy crash", BUG_FORM_BODY);
      expect(errors).toEqual([]);
    });

    it("accepts all valid type prefixes", () => {
      const types = ["feat", "fix", "refactor", "test", "docs", "chore", "perf", "ci"];
      for (const t of types) {
        const errors = validateIssue(`[${t}] Some description`, TEMPLATE_BODY);
        expect(errors).toEqual([]);
      }
    });
  });

  describe("markdown template body (## headings)", () => {
    it("accepts a well-formed template body", () => {
      const errors = validateIssue("[feat] Add webhook validation", TEMPLATE_BODY);
      expect(errors).toEqual([]);
    });

    it("rejects body missing severity", () => {
      const body = TEMPLATE_BODY.replace("P1", "");
      const errors = validateIssue("[feat] Add something", body);
      expect(errors).toContain("Body missing severity (P0, P1, P2, or P3)");
    });

    it("rejects body missing description", () => {
      const body = TEMPLATE_BODY.replace("## Description", "## Details");
      const errors = validateIssue("[feat] Add something", body);
      expect(errors.some((e) => e.includes("Description"))).toBe(true);
    });

    it("rejects body missing acceptance criteria", () => {
      const body = TEMPLATE_BODY.replace("## Acceptance Criteria", "## Done When");
      const errors = validateIssue("[feat] Add something", body);
      expect(errors.some((e) => e.includes("Acceptance Criteria"))).toBe(true);
    });

    it("rejects body missing verification steps", () => {
      const body = TEMPLATE_BODY.replace("## Verification Steps", "## How to Test");
      const errors = validateIssue("[feat] Add something", body);
      expect(errors.some((e) => e.includes("Verification"))).toBe(true);
    });

    it("rejects body without checklist items", () => {
      const body = TEMPLATE_BODY.replace(/- \[ \]/g, "- Done");
      const errors = validateIssue("[feat] Add something", body);
      expect(errors).toContain("Acceptance criteria must include at least one checklist item (- [ ])");
    });
  });

  describe("GitHub form body — feature (### headings)", () => {
    it("accepts a well-formed feature form body", () => {
      const errors = validateIssue("[feat] Generate landing pages", FEATURE_FORM_BODY);
      expect(errors).toEqual([]);
    });

    it("does not require ## Type when title has [type] prefix", () => {
      // Feature forms never include a Type section — type comes from title
      expect(FEATURE_FORM_BODY.toLowerCase()).not.toContain("## type");
      const errors = validateIssue("[feat] Generate landing pages", FEATURE_FORM_BODY);
      expect(errors).toEqual([]);
    });

    it("accepts ### Description heading", () => {
      const errors = validateIssue("[feat] Generate landing pages", FEATURE_FORM_BODY);
      expect(errors.filter((e) => e.includes("Description"))).toEqual([]);
    });
  });

  describe("GitHub form body — bug (### headings, What happened)", () => {
    it("accepts a well-formed bug form body", () => {
      const errors = validateIssue("[fix] Resolve deploy crash", BUG_FORM_BODY);
      expect(errors).toEqual([]);
    });

    it("accepts '### What happened' as description equivalent", () => {
      const errors = validateIssue("[fix] Resolve deploy crash", BUG_FORM_BODY);
      expect(errors.filter((e) => e.includes("Description") || e.includes("What happened"))).toEqual([]);
    });

    it("accepts severity with description suffix (P0 — System broken)", () => {
      const errors = validateIssue("[fix] Resolve deploy crash", BUG_FORM_BODY);
      expect(errors.filter((e) => e.includes("severity"))).toEqual([]);
    });
  });

  describe("missing body", () => {
    it("rejects null body", () => {
      const errors = validateIssue("[feat] Something", null);
      expect(errors.some((e) => e.includes("Missing --body"))).toBe(true);
    });
  });

  describe("type field fallback", () => {
    it("requires Type in body when title lacks [type] prefix", () => {
      const bodyNoType = TEMPLATE_BODY.replace("## Type\nfeat\n", "");
      const errors = validateIssue("Add webhook validation", bodyNoType);
      // Should have both title format error and type error
      expect(errors.some((e) => e.includes("Title must match"))).toBe(true);
      expect(errors.some((e) => e.includes("Type"))).toBe(true);
    });
  });
});
