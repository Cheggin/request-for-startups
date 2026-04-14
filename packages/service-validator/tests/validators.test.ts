import { describe, it, expect, vi } from "vitest";
import {
  validateGitHub,
  validateVercel,
  validateRailway,
  validateConvex,
  validateCubic,
  validateSlack,
  validateFigma,
} from "../src/validators.js";

describe("validators", () => {
  describe("validateGitHub", () => {
    it("should pass when gh auth status succeeds", () => {
      const mockExec = vi.fn().mockReturnValue("Logged in to github.com");
      const result = validateGitHub(mockExec);
      expect(result.status).toBe("pass");
      expect(result.service).toBe("github");
      expect(result.critical).toBe(true);
      expect(mockExec).toHaveBeenCalledWith("gh auth status");
    });

    it("should fail when gh auth status throws", () => {
      const mockExec = vi.fn().mockImplementation(() => {
        throw new Error("not logged in");
      });
      const result = validateGitHub(mockExec);
      expect(result.status).toBe("fail");
      expect(result.critical).toBe(true);
      expect(result.diagnostic).toContain("gh auth login");
    });
  });

  describe("validateVercel", () => {
    it("should pass and include username", () => {
      const mockExec = vi.fn().mockReturnValue("reagan\n");
      const result = validateVercel(mockExec);
      expect(result.status).toBe("pass");
      expect(result.message).toContain("reagan");
      expect(result.critical).toBe(true);
    });

    it("should fail when vercel whoami throws", () => {
      const mockExec = vi.fn().mockImplementation(() => {
        throw new Error("not logged in");
      });
      const result = validateVercel(mockExec);
      expect(result.status).toBe("fail");
      expect(result.diagnostic).toContain("vercel login");
    });
  });

  describe("validateRailway", () => {
    it("should pass when railway status succeeds", () => {
      const mockExec = vi.fn().mockReturnValue("Project: my-app");
      const result = validateRailway(mockExec);
      expect(result.status).toBe("pass");
      expect(result.critical).toBe(false);
    });

    it("should warn (not fail) when railway is unavailable", () => {
      const mockExec = vi.fn().mockImplementation(() => {
        throw new Error("not linked");
      });
      const result = validateRailway(mockExec);
      expect(result.status).toBe("warn");
      expect(result.critical).toBe(false);
    });
  });

  describe("validateConvex", () => {
    it("should pass when convex env succeeds", () => {
      const mockExec = vi.fn().mockReturnValue("CONVEX_URL=https://...");
      const result = validateConvex(mockExec);
      expect(result.status).toBe("pass");
      expect(result.critical).toBe(true);
    });

    it("should fail when convex is unreachable", () => {
      const mockExec = vi.fn().mockImplementation(() => {
        throw new Error("no deployment");
      });
      const result = validateConvex(mockExec);
      expect(result.status).toBe("fail");
      expect(result.critical).toBe(true);
      expect(result.diagnostic).toContain("npx convex dev");
    });
  });

  describe("validateCubic", () => {
    it("should pass when cubic app is found", () => {
      const mockExec = vi.fn().mockReturnValue("12345\n");
      const result = validateCubic(mockExec);
      expect(result.status).toBe("pass");
      expect(result.service).toBe("cubic");
    });

    it("should warn when cubic app is not found", () => {
      const mockExec = vi.fn().mockReturnValue("\n");
      const result = validateCubic(mockExec);
      expect(result.status).toBe("warn");
      expect(result.critical).toBe(false);
    });

    it("should warn when gh api call fails", () => {
      const mockExec = vi.fn().mockImplementation(() => {
        throw new Error("api error");
      });
      const result = validateCubic(mockExec);
      expect(result.status).toBe("warn");
      expect(result.critical).toBe(false);
    });
  });

  describe("validateSlack", () => {
    it("should pass when slack is authenticated", () => {
      const mockExec = vi.fn().mockReturnValue("authenticated as bot");
      const result = validateSlack(mockExec);
      expect(result.status).toBe("pass");
      expect(result.critical).toBe(false);
    });

    it("should warn when slack is not authenticated", () => {
      const mockExec = vi.fn().mockReturnValue("not connected");
      const result = validateSlack(mockExec);
      expect(result.status).toBe("warn");
      expect(result.critical).toBe(false);
    });

    it("should warn when slack check throws", () => {
      const mockExec = vi.fn().mockImplementation(() => {
        throw new Error("command not found");
      });
      const result = validateSlack(mockExec);
      expect(result.status).toBe("warn");
      expect(result.critical).toBe(false);
    });
  });

  describe("validateFigma", () => {
    it("should pass and include username", () => {
      const mockExec = vi.fn().mockReturnValue("reagan\n");
      const result = validateFigma(mockExec);
      expect(result.status).toBe("pass");
      expect(result.message).toContain("reagan");
      expect(result.critical).toBe(false);
    });

    it("should warn when figma auth fails", () => {
      const mockExec = vi.fn().mockImplementation(() => {
        throw new Error("no token");
      });
      const result = validateFigma(mockExec);
      expect(result.status).toBe("warn");
      expect(result.critical).toBe(false);
      expect(result.diagnostic).toContain("FIGMA_PERSONAL_ACCESS_TOKEN");
    });
  });
});
