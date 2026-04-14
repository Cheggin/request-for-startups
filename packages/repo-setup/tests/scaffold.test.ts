import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createGitHubRepo,
  copyWebsiteTemplate,
  generateTaskfile,
  setupFeaturesDir,
  setupHarnessConfigs,
  setupGitignore,
  setupCIWorkflow,
  scaffold,
} from "../src/scaffold.js";
import { existsSync, readFileSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("scaffold", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `repo-setup-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe("createGitHubRepo", () => {
    it("should call gh repo create with correct args for public repo", () => {
      const mockExec = vi.fn().mockReturnValue("");
      createGitHubRepo({ name: "my-startup" }, mockExec);
      expect(mockExec).toHaveBeenCalledWith(
        "gh repo create my-startup --public --clone"
      );
    });

    it("should call gh repo create with org prefix", () => {
      const mockExec = vi.fn().mockReturnValue("");
      createGitHubRepo({ name: "my-startup", org: "acme" }, mockExec);
      expect(mockExec).toHaveBeenCalledWith(
        "gh repo create acme/my-startup --public --clone"
      );
    });

    it("should create private repo when specified", () => {
      const mockExec = vi.fn().mockReturnValue("");
      createGitHubRepo(
        { name: "my-startup", private: true },
        mockExec
      );
      expect(mockExec).toHaveBeenCalledWith(
        "gh repo create my-startup --private --clone"
      );
    });

    it("should return the repo name", () => {
      const mockExec = vi.fn().mockReturnValue("");
      const result = createGitHubRepo(
        { name: "my-startup", org: "acme" },
        mockExec
      );
      expect(result).toBe("acme/my-startup");
    });
  });

  describe("copyWebsiteTemplate", () => {
    it("should throw if template directory does not exist", () => {
      const mockExec = vi.fn();
      expect(() =>
        copyWebsiteTemplate(testDir, "/nonexistent/template", mockExec)
      ).toThrow("Template directory not found");
    });

    it("should copy template when directory exists", () => {
      const templateDir = join(testDir, "template");
      mkdirSync(templateDir, { recursive: true });
      const mockExec = vi.fn().mockReturnValue("");
      copyWebsiteTemplate(testDir, templateDir, mockExec);
      expect(mockExec).toHaveBeenCalledWith(
        `cp -r ${templateDir}/. ${testDir}/`
      );
    });
  });

  describe("generateTaskfile", () => {
    it("should create Taskfile.yml with standard tasks", () => {
      generateTaskfile(testDir);
      const content = readFileSync(join(testDir, "Taskfile.yml"), "utf-8");
      expect(content).toContain('version: "3"');
      expect(content).toContain("dev:");
      expect(content).toContain("test:");
      expect(content).toContain("build:");
      expect(content).toContain("deploy:");
      expect(content).toContain("feature:list:");
      expect(content).toContain("feature:status:");
    });
  });

  describe("setupFeaturesDir", () => {
    it("should create features directory with .gitkeep", () => {
      setupFeaturesDir(testDir);
      expect(existsSync(join(testDir, "features"))).toBe(true);
      expect(existsSync(join(testDir, "features", ".gitkeep"))).toBe(true);
    });
  });

  describe("setupHarnessConfigs", () => {
    it("should create .harness directory with stacks.yml", () => {
      setupHarnessConfigs(testDir);
      expect(existsSync(join(testDir, ".harness"))).toBe(true);
      const content = readFileSync(
        join(testDir, ".harness", "stacks.yml"),
        "utf-8"
      );
      expect(content).toContain("nextjs");
      expect(content).toContain("convex");
      expect(content).toContain("vercel");
      expect(content).toContain("vitest");
    });
  });

  describe("setupGitignore", () => {
    it("should create .gitignore with common patterns", () => {
      setupGitignore(testDir);
      const content = readFileSync(join(testDir, ".gitignore"), "utf-8");
      expect(content).toContain("node_modules/");
      expect(content).toContain(".env");
      expect(content).toContain("dist/");
      expect(content).toContain(".next/");
      expect(content).toContain("*.pem");
    });
  });

  describe("setupCIWorkflow", () => {
    it("should create .github/workflows/ci.yml", () => {
      setupCIWorkflow(testDir);
      const ciPath = join(testDir, ".github", "workflows", "ci.yml");
      expect(existsSync(ciPath)).toBe(true);
      const content = readFileSync(ciPath, "utf-8");
      expect(content).toContain("npm run lint");
      expect(content).toContain("npm run typecheck");
      expect(content).toContain("npm run test");
    });
  });

  describe("scaffold (integration)", () => {
    it("should call createGitHubRepo and set up all directories", () => {
      const mockExec = vi.fn().mockReturnValue("");
      const originalCwd = process.cwd;

      // Mock process.cwd to return testDir so scaffold creates inside it
      process.cwd = () => testDir;

      const projectDir = join(testDir, "test-project");
      mkdirSync(projectDir, { recursive: true });

      const result = scaffold({ name: "test-project" }, mockExec);

      expect(result).toBe("test-project");
      expect(mockExec).toHaveBeenCalledWith(
        "gh repo create test-project --public --clone"
      );
      expect(existsSync(join(projectDir, "Taskfile.yml"))).toBe(true);
      expect(existsSync(join(projectDir, "features"))).toBe(true);
      expect(existsSync(join(projectDir, ".harness"))).toBe(true);
      expect(existsSync(join(projectDir, ".gitignore"))).toBe(true);
      expect(
        existsSync(join(projectDir, ".github", "workflows", "ci.yml"))
      ).toBe(true);

      process.cwd = originalCwd;
    });
  });
});
