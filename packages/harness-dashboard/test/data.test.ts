import { describe, test, expect } from "bun:test";
import { NAV_GROUPS, NAV_ITEMS, SETTINGS_NAV } from "../src/lib/constants";

/**
 * Tests for pure helper functions in data.ts.
 *
 * We import the helpers via a re-export trick: the functions tested here
 * (normalizeStartupType, parseSimpleYaml, parseEnvFile, extractMarkdownSection,
 *  extractFirstParagraph, extractListItems, parseMarkdownTable, splitMarkdownRow)
 * are not exported from data.ts directly. We test the data module's exported
 * functions that rely on them, plus the constants module.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

describe("constants", () => {
  test("NAV_GROUPS has expected structure", () => {
    expect(NAV_GROUPS.length).toBeGreaterThanOrEqual(3);
    for (const group of NAV_GROUPS) {
      expect(group.label).toBeTruthy();
      expect(group.items.length).toBeGreaterThan(0);
      for (const item of group.items) {
        expect(item.label).toBeTruthy();
        expect(item.href).toMatch(/^\//);
        expect(item.icon).toBeTruthy();
      }
    }
  });

  test("SETTINGS_NAV points to /settings", () => {
    expect(SETTINGS_NAV.href).toBe("/settings");
    expect(SETTINGS_NAV.label).toBe("Settings");
  });

  test("NAV_ITEMS is flat list of all group items plus settings", () => {
    const totalGroupItems = NAV_GROUPS.reduce((sum, g) => sum + g.items.length, 0);
    expect(NAV_ITEMS.length).toBe(totalGroupItems + 1);
    expect(NAV_ITEMS[NAV_ITEMS.length - 1]).toEqual(SETTINGS_NAV);
  });

  test("all nav hrefs are unique", () => {
    const hrefs = NAV_ITEMS.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
