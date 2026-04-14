import { describe, it, expect } from "bun:test";
import { buildSpecPrompt, parseSpecSections, validateSpec } from "./generator.js";

describe("generator", () => {
  describe("buildSpecPrompt", () => {
    it("includes the startup idea in the prompt", () => {
      const prompt = buildSpecPrompt({
        idea: "A dog walking app",
        researchReport: "# Research\nCompetitors exist.",
        stacksYml: "framework: next.js",
        startupType: "b2c",
      });
      expect(prompt).toContain("A dog walking app");
    });

    it("includes the research report", () => {
      const prompt = buildSpecPrompt({
        idea: "Test idea",
        researchReport: "# Market Analysis\nThe TAM is large.",
        stacksYml: "db: convex",
        startupType: "devtool",
      });
      expect(prompt).toContain("# Market Analysis");
      expect(prompt).toContain("The TAM is large.");
    });

    it("includes the stacks yml", () => {
      const prompt = buildSpecPrompt({
        idea: "Test idea",
        researchReport: "report",
        stacksYml: "framework: next.js\ndb: convex",
        startupType: "b2c",
      });
      expect(prompt).toContain("framework: next.js");
    });

    it("uses the correct template system prompt", () => {
      const prompt = buildSpecPrompt({
        idea: "Test",
        researchReport: "report",
        stacksYml: "stack",
        startupType: "marketplace",
      });
      expect(prompt).toContain("two-sided marketplaces");
    });

    it("includes template default pages", () => {
      const prompt = buildSpecPrompt({
        idea: "Test",
        researchReport: "report",
        stacksYml: "stack",
        startupType: "b2b-saas",
      });
      expect(prompt).toContain("Team Management");
      expect(prompt).toContain("Workspace Setup");
    });

    it("requires Given/When/Then acceptance criteria", () => {
      const prompt = buildSpecPrompt({
        idea: "Test",
        researchReport: "report",
        stacksYml: "stack",
        startupType: "b2c",
      });
      expect(prompt).toContain("Given/When/Then");
    });

    it("requires all six spec sections", () => {
      const prompt = buildSpecPrompt({
        idea: "Test",
        researchReport: "report",
        stacksYml: "stack",
        startupType: "b2c",
      });
      expect(prompt).toContain("### 1. Pages");
      expect(prompt).toContain("### 2. Features");
      expect(prompt).toContain("### 3. Data Models");
      expect(prompt).toContain("### 4. API Routes");
      expect(prompt).toContain("### 5. User Flows");
      expect(prompt).toContain("### 6. Dependency Map");
    });
  });

  describe("parseSpecSections", () => {
    it("parses sections from markdown", () => {
      const raw = `### 1. Pages
Landing page content here

### 2. Features
Feature content here

### 3. Data Models
Model content here`;

      const sections = parseSpecSections(raw);
      expect(sections).toHaveLength(3);
      expect(sections[0].title).toBe("Pages");
      expect(sections[0].content).toContain("Landing page content");
      expect(sections[1].title).toBe("Features");
      expect(sections[2].title).toBe("Data Models");
    });

    it("handles ## headings too", () => {
      const raw = `## Pages
Page content

## Features
Feature content`;

      const sections = parseSpecSections(raw);
      expect(sections).toHaveLength(2);
    });

    it("returns empty array for empty input", () => {
      expect(parseSpecSections("")).toEqual([]);
    });

    it("handles headings without numbers", () => {
      const raw = `### Pages
content

### Features
content`;
      const sections = parseSpecSections(raw);
      expect(sections).toHaveLength(2);
      expect(sections[0].title).toBe("Pages");
    });
  });

  describe("validateSpec", () => {
    it("returns no warnings for a complete spec", () => {
      const sections = [
        { title: "Pages", content: "Landing page" },
        {
          title: "Features",
          content: "Given a user\nWhen they click\nThen it works",
        },
        { title: "Data Models", content: "User model" },
        { title: "API Routes", content: "GET /api/users" },
        { title: "User Flows", content: "Sign up flow" },
        { title: "Dependency Map", content: "Auth -> Dashboard" },
      ];
      const warnings = validateSpec(sections);
      expect(warnings).toEqual([]);
    });

    it("warns about missing sections", () => {
      const sections = [
        { title: "Pages", content: "content" },
        { title: "Features", content: "Given x When y Then z" },
      ];
      const warnings = validateSpec(sections);
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some((w) => w.includes("data models"))).toBe(true);
    });

    it("warns about missing acceptance criteria format", () => {
      const sections = [
        { title: "Pages", content: "content" },
        { title: "Features", content: "Some feature without criteria" },
        { title: "Data Models", content: "content" },
        { title: "API Routes", content: "content" },
        { title: "User Flows", content: "content" },
        { title: "Dependency Map", content: "content" },
      ];
      const warnings = validateSpec(sections);
      expect(
        warnings.some((w) => w.includes("Given/When/Then"))
      ).toBe(true);
    });
  });
});
