// @vitest-environment node
import { describe, test, expect } from "vitest";
import {
  getComparisonData,
  getAllComparisonSlugs,
  getAllComparisons,
  getRelatedComparisons,
} from "../src/lib/comparison-data";

describe("getAllComparisons", () => {
  test("returns all comparison routes", () => {
    const all = getAllComparisons();
    expect(all.length).toBeGreaterThanOrEqual(3);
  });

  test("every comparison has required fields", () => {
    for (const route of getAllComparisons()) {
      expect(route.slug).toBeTruthy();
      expect(route.competitorName).toBeTruthy();
      expect(route.competitorUrl).toMatch(/^https?:\/\//);
      expect(route.title).toBeTruthy();
      expect(route.metaDescription).toBeTruthy();
      expect(route.headline).toBeTruthy();
      expect(route.summary).toBeTruthy();
      expect(route.criteria.length).toBeGreaterThan(0);
      expect(route.ourStrengths.length).toBeGreaterThan(0);
      expect(route.competitorStrengths.length).toBeGreaterThan(0);
      expect(route.bestFor.ourProduct).toBeTruthy();
      expect(route.bestFor.competitor).toBeTruthy();
      expect(route.ctaText).toBeTruthy();
      expect(route.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  test("all comparison slugs are unique", () => {
    const slugs = getAllComparisonSlugs();
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  test("criteria have source URLs and dates", () => {
    for (const route of getAllComparisons()) {
      for (const criterion of route.criteria) {
        expect(criterion.name).toBeTruthy();
        expect(criterion.ourProduct).toBeTruthy();
        expect(criterion.competitor).toBeTruthy();
        expect(criterion.sourceUrl).toMatch(/^https?:\/\//);
        expect(criterion.sourceDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });
});

describe("getComparisonData", () => {
  test("returns data for a known slug", () => {
    const slugs = getAllComparisonSlugs();
    const result = getComparisonData(slugs[0]);
    expect(result).not.toBeNull();
    expect(result!.slug).toBe(slugs[0]);
  });

  test("returns null for unknown slug", () => {
    expect(getComparisonData("nonexistent-comparison")).toBeNull();
  });
});

describe("getRelatedComparisons", () => {
  test("excludes the current slug", () => {
    const slugs = getAllComparisonSlugs();
    const related = getRelatedComparisons(slugs[0]);
    expect(related.every((r) => r.slug !== slugs[0])).toBe(true);
  });

  test("returns one fewer than total", () => {
    const all = getAllComparisons();
    const related = getRelatedComparisons(all[0].slug);
    expect(related.length).toBe(all.length - 1);
  });
});
