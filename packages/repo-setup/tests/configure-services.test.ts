import { describe, it, expect, vi } from "vitest";
import {
  linkVercel,
  linkRailway,
  initConvex,
  configureGitHubWebhook,
  configureServices,
} from "../src/configure-services.js";

describe("configure-services", () => {
  const baseConfig = { projectDir: "/tmp/test-project" };

  describe("linkVercel", () => {
    it("should succeed when vercel link works", () => {
      const mockExec = vi.fn().mockReturnValue("");
      const result = linkVercel(baseConfig, mockExec);
      expect(result.service).toBe("vercel");
      expect(result.success).toBe(true);
      expect(mockExec).toHaveBeenCalledWith("vercel link --yes", {
        cwd: "/tmp/test-project",
      });
    });

    it("should pass team scope when provided", () => {
      const mockExec = vi.fn().mockReturnValue("");
      const result = linkVercel(
        { ...baseConfig, vercelTeam: "my-team" },
        mockExec
      );
      expect(result.success).toBe(true);
      expect(mockExec).toHaveBeenCalledWith(
        "vercel link --yes --scope my-team",
        { cwd: "/tmp/test-project" }
      );
    });

    it("should return failure on error", () => {
      const mockExec = vi.fn().mockImplementation(() => {
        throw new Error("vercel not found");
      });
      const result = linkVercel(baseConfig, mockExec);
      expect(result.success).toBe(false);
      expect(result.message).toContain("Failed to link Vercel");
    });
  });

  describe("linkRailway", () => {
    it("should succeed when railway link works", () => {
      const mockExec = vi.fn().mockReturnValue("");
      const result = linkRailway(baseConfig, mockExec);
      expect(result.service).toBe("railway");
      expect(result.success).toBe(true);
    });

    it("should return failure on error", () => {
      const mockExec = vi.fn().mockImplementation(() => {
        throw new Error("railway not found");
      });
      const result = linkRailway(baseConfig, mockExec);
      expect(result.success).toBe(false);
    });
  });

  describe("initConvex", () => {
    it("should succeed when convex initializes", () => {
      const mockExec = vi.fn().mockReturnValue("");
      const result = initConvex(baseConfig, mockExec);
      expect(result.service).toBe("convex");
      expect(result.success).toBe(true);
      expect(mockExec).toHaveBeenCalledWith("npx convex dev --once", {
        cwd: "/tmp/test-project",
      });
    });

    it("should return failure on error", () => {
      const mockExec = vi.fn().mockImplementation(() => {
        throw new Error("convex failed");
      });
      const result = initConvex(baseConfig, mockExec);
      expect(result.success).toBe(false);
    });
  });

  describe("configureGitHubWebhook", () => {
    it("should call gh api to create webhook", () => {
      const mockExec = vi.fn().mockReturnValue("");
      const result = configureGitHubWebhook(
        "acme/my-startup",
        "https://cubic.dev/webhook",
        mockExec
      );
      expect(result.service).toBe("github-webhook");
      expect(result.success).toBe(true);
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining("gh api repos/acme/my-startup/hooks")
      );
    });

    it("should return failure on error", () => {
      const mockExec = vi.fn().mockImplementation(() => {
        throw new Error("api error");
      });
      const result = configureGitHubWebhook(
        "acme/my-startup",
        "https://cubic.dev/webhook",
        mockExec
      );
      expect(result.success).toBe(false);
    });
  });

  describe("configureServices", () => {
    it("should run all service configurations", () => {
      const mockExec = vi.fn().mockReturnValue("");
      const results = configureServices(
        { ...baseConfig, cubicWebhookUrl: "https://cubic.dev/webhook" },
        "acme/my-startup",
        mockExec
      );
      expect(results).toHaveLength(4);
      expect(results.map((r) => r.service)).toEqual([
        "vercel",
        "railway",
        "convex",
        "github-webhook",
      ]);
    });

    it("should skip webhook if no URL provided", () => {
      const mockExec = vi.fn().mockReturnValue("");
      const results = configureServices(
        baseConfig,
        "acme/my-startup",
        mockExec
      );
      expect(results).toHaveLength(3);
      expect(results.map((r) => r.service)).toEqual([
        "vercel",
        "railway",
        "convex",
      ]);
    });
  });
});
