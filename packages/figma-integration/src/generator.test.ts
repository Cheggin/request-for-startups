import { describe, test, expect } from "bun:test";
import { buildDesignPrompt, parsePageSpecs } from "./generator.js";
import type { DesignSystem } from "./design-system.js";

const EMPTY_DESIGN_SYSTEM: DesignSystem = {
  colors: [],
  typography: [],
  spacing: [],
  rawVariables: [],
};

describe("buildDesignPrompt", () => {
  test("builds prompt with page info and design system tokens", () => {
    const page = {
      name: "Dashboard",
      slug: "dashboard",
      description: "Main dashboard page",
      layout: "two-column",
      contentRequirements: ["Chart widget", "Stats bar"],
      responsive: true,
    };
    const ds: DesignSystem = {
      ...EMPTY_DESIGN_SYSTEM,
      colors: [{ name: "primary", value: "#007AFF" }],
    };
    const prompt = buildDesignPrompt(page, ds);
    expect(prompt).toContain("Dashboard");
    expect(prompt).toContain("two-column");
    expect(prompt).toContain("Chart widget");
    expect(prompt).toContain("primary: #007AFF");
  });

  test("handles empty design system", () => {
    const page = {
      name: "Home",
      slug: "home",
      description: "Landing page",
      layout: "single-column",
      contentRequirements: [],
      responsive: true,
    };
    const prompt = buildDesignPrompt(page, EMPTY_DESIGN_SYSTEM);
    expect(prompt).toContain("Home");
    expect(prompt).toContain("none specified");
  });
});

describe("parsePageSpecs", () => {
  test("parses pages from markdown with H2 sections", () => {
    const spec = `## Home
Landing page for new users
Layout: hero-split
- Hero headline
- CTA button

## About
Company information
Layout: single-column
Responsive: false
`;
    const pages = parsePageSpecs(spec);
    expect(pages.length).toBe(2);
    expect(pages[0].name).toBe("Home");
    expect(pages[0].slug).toBe("home");
    expect(pages[0].layout).toBe("hero-split");
    expect(pages[0].contentRequirements).toEqual(["Hero headline", "CTA button"]);
    expect(pages[0].responsive).toBe(true);
    expect(pages[1].name).toBe("About");
    expect(pages[1].responsive).toBe(false);
  });

  test("returns empty array for spec with no H2 sections", () => {
    const pages = parsePageSpecs("# Title\nSome text.");
    expect(pages).toEqual([]);
  });
});
