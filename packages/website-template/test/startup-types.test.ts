// @vitest-environment node
import { describe, test, expect } from "vitest";
import { STARTUP_TYPES, getStartupType, getAllSlugs } from "../src/data/startup-types";

describe("STARTUP_TYPES", () => {
  test("contains at least 5 startup types", () => {
    expect(STARTUP_TYPES.length).toBeGreaterThanOrEqual(5);
  });

  test("every type has required fields", () => {
    for (const type of STARTUP_TYPES) {
      expect(type.slug).toBeTruthy();
      expect(type.name).toBeTruthy();
      expect(type.headline).toBeTruthy();
      expect(type.description).toBeTruthy();
      expect(type.metaTitle).toBeTruthy();
      expect(type.metaDescription).toBeTruthy();
      expect(type.harnessApproach.length).toBeGreaterThan(0);
      expect(type.proofPoints.length).toBeGreaterThan(0);
    }
  });

  test("all slugs are unique", () => {
    const slugs = STARTUP_TYPES.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  test("slugs are URL-safe (lowercase, hyphens only)", () => {
    for (const type of STARTUP_TYPES) {
      expect(type.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  test("examples have valid stack entries when present", () => {
    const withExamples = STARTUP_TYPES.filter((t) => t.example !== null);
    expect(withExamples.length).toBeGreaterThan(0);

    for (const type of withExamples) {
      expect(type.example!.name).toBeTruthy();
      expect(type.example!.oneLiner).toBeTruthy();
      expect(type.example!.stack.length).toBeGreaterThan(0);
      for (const entry of type.example!.stack) {
        expect(entry.layer).toBeTruthy();
        expect(entry.technology).toBeTruthy();
      }
    }
  });

  test("examples have valid routes when present", () => {
    const withExamples = STARTUP_TYPES.filter((t) => t.example !== null);
    for (const type of withExamples) {
      expect(type.example!.routes.length).toBeGreaterThan(0);
      for (const route of type.example!.routes) {
        expect(route.path).toMatch(/^\//);
        expect(route.description).toBeTruthy();
      }
    }
  });
});

describe("getStartupType", () => {
  test("returns the correct type for a known slug", () => {
    const result = getStartupType("b2b-saas");
    expect(result).toBeDefined();
    expect(result!.name).toBe("B2B SaaS");
  });

  test("returns undefined for unknown slug", () => {
    expect(getStartupType("nonexistent-slug")).toBeUndefined();
  });
});

describe("getAllSlugs", () => {
  test("returns all slugs", () => {
    const slugs = getAllSlugs();
    expect(slugs.length).toBe(STARTUP_TYPES.length);
    expect(slugs).toContain("b2b-saas");
    expect(slugs).toContain("devtools");
  });
});
