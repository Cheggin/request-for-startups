import { describe, it, expect } from "bun:test";
import {
  detectStartupType,
  getTemplate,
  TEMPLATES,
  type StartupType,
} from "./templates.js";

describe("templates", () => {
  describe("TEMPLATES", () => {
    it("has all four startup types", () => {
      expect(Object.keys(TEMPLATES)).toEqual([
        "b2c",
        "devtool",
        "b2b-saas",
        "marketplace",
      ]);
    });

    it("every template has required fields", () => {
      for (const [key, template] of Object.entries(TEMPLATES)) {
        expect(template.type).toBe(key);
        expect(template.label).toBeTruthy();
        expect(template.systemPrompt).toBeTruthy();
        expect(template.defaultPages.length).toBeGreaterThan(0);
        expect(template.commonModels.length).toBeGreaterThan(0);
        expect(template.commonFlows.length).toBeGreaterThan(0);
      }
    });
  });

  describe("detectStartupType", () => {
    it("detects devtool from API/SDK keywords", () => {
      expect(detectStartupType("Build an API for developers to manage webhooks")).toBe("devtool");
    });

    it("detects b2b-saas from enterprise/team keywords", () => {
      expect(detectStartupType("B2B SaaS platform for team collaboration and workspace management")).toBe("b2b-saas");
    });

    it("detects marketplace from buyer/seller keywords", () => {
      expect(detectStartupType("A marketplace connecting freelancer sellers with buyers")).toBe("marketplace");
    });

    it("detects b2c from consumer keywords", () => {
      expect(detectStartupType("A social fitness app for personal health tracking")).toBe("b2c");
    });

    it("falls back to b2c for ambiguous ideas", () => {
      expect(detectStartupType("Something new and exciting")).toBe("b2c");
    });

    it("handles mixed signals by picking highest score", () => {
      const result = detectStartupType(
        "An API SDK CLI developer tool with webhook integration support"
      );
      expect(result).toBe("devtool");
    });
  });

  describe("getTemplate", () => {
    it("returns the correct template for each type", () => {
      const types: StartupType[] = ["b2c", "devtool", "b2b-saas", "marketplace"];
      for (const type of types) {
        const template = getTemplate(type);
        expect(template.type).toBe(type);
      }
    });
  });
});
