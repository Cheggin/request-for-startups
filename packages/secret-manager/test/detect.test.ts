import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { scanFile, scanDirectory } from "../src/detect";

// Build test keys at runtime to avoid triggering GitHub push protection.
// These are NOT real keys — they are deterministic fakes assembled from parts.
const FAKE_STRIPE_SK = ["sk", "live", "abcdefghijklmnopqrstuvwx"].join("_");
const FAKE_STRIPE_PK = ["pk", "live", "abcdefghijklmnopqrstuvwx"].join("_");
const FAKE_GHP = "ghp" + "_" + "abcdefghijklmnopqrstuvwxyz0123456789";
const FAKE_AWS_KEY = "AKIA" + "IOSFODNN7EXAMPLE";

describe("detect", () => {
  describe("scanFile", () => {
    test("detects Stripe secret keys", () => {
      const content = `const key = "${FAKE_STRIPE_SK}";`;
      const result = scanFile(content);
      expect(result.hasSecrets).toBe(true);
      expect(result.matches.length).toBe(1);
      expect(result.matches[0].pattern).toBe("stripe-secret-key");
      expect(result.matches[0].line).toBe(1);
    });

    test("detects Stripe publishable keys", () => {
      const content = `const pk = "${FAKE_STRIPE_PK}";`;
      const result = scanFile(content);
      expect(result.hasSecrets).toBe(true);
      expect(result.matches[0].pattern).toBe("stripe-publishable-key");
    });

    test("detects GitHub PATs", () => {
      const content = `GITHUB_TOKEN=${FAKE_GHP}`;
      const result = scanFile(content);
      expect(result.hasSecrets).toBe(true);
      expect(result.matches.some((m) => m.pattern === "github-pat")).toBe(true);
    });

    test("detects AWS access keys", () => {
      const content = `aws_access_key_id = ${FAKE_AWS_KEY}`;
      const result = scanFile(content);
      expect(result.hasSecrets).toBe(true);
      expect(result.matches.some((m) => m.pattern === "aws-access-key")).toBe(true);
    });

    test("detects database connection strings", () => {
      const content = `DATABASE_URL=postgres://user:pass@host:5432/mydb`;
      const result = scanFile(content);
      expect(result.hasSecrets).toBe(true);
      expect(result.matches.some((m) => m.pattern === "database-url")).toBe(true);
    });

    test("detects private keys", () => {
      const content = `-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAK...`;
      const result = scanFile(content);
      expect(result.hasSecrets).toBe(true);
      expect(result.matches.some((m) => m.pattern === "private-key")).toBe(true);
    });

    test("detects JWT tokens", () => {
      // Construct JWT parts separately to avoid push protection
      const header = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
      const payload = "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0";
      const sig = "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
      const content = `token = "${header}.${payload}.${sig}"`;
      const result = scanFile(content);
      expect(result.hasSecrets).toBe(true);
      expect(result.matches.some((m) => m.pattern === "jwt-token")).toBe(true);
    });

    test("detects Slack tokens", () => {
      const slackToken = ["xoxb", "1234567890", "abcdefghij"].join("-");
      const content = `SLACK_TOKEN=${slackToken}`;
      const result = scanFile(content);
      expect(result.hasSecrets).toBe(true);
      expect(result.matches.some((m) => m.pattern === "slack-token")).toBe(true);
    });

    test("skips comments", () => {
      const content = `// ${FAKE_STRIPE_SK}\n# ${FAKE_GHP}`;
      const result = scanFile(content);
      expect(result.hasSecrets).toBe(false);
    });

    test("returns no matches for clean code", () => {
      const content = `const x = 42;\nfunction hello() { return "world"; }`;
      const result = scanFile(content);
      expect(result.hasSecrets).toBe(false);
      expect(result.matches).toEqual([]);
    });

    test("masks detected values", () => {
      const content = `const key = "${FAKE_STRIPE_SK}";`;
      const result = scanFile(content);
      // Value should be masked (first 4, asterisks, last 4)
      expect(result.matches[0].value).not.toBe(FAKE_STRIPE_SK);
      expect(result.matches[0].value).toContain("*");
    });
  });

  describe("scanDirectory", () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = mkdtempSync(join(tmpdir(), "secret-detect-test-"));
    });

    afterEach(() => {
      rmSync(tempDir, { recursive: true, force: true });
    });

    test("scans directory and finds secrets in files", () => {
      const srcDir = join(tempDir, "src");
      mkdirSync(srcDir);
      writeFileSync(
        join(srcDir, "config.ts"),
        `const key = "${FAKE_STRIPE_SK}";`
      );
      writeFileSync(join(srcDir, "clean.ts"), `const x = 42;`);

      const result = scanDirectory(tempDir);
      expect(result.scannedFiles).toBeGreaterThanOrEqual(2);
      expect(result.filesWithSecrets.length).toBe(1);
      expect(result.filesWithSecrets[0].path).toContain("config.ts");
    });

    test("respects gitignore patterns", () => {
      mkdirSync(join(tempDir, "node_modules"), { recursive: true });
      writeFileSync(
        join(tempDir, "node_modules", "secret.ts"),
        `const key = "${FAKE_STRIPE_SK}";`
      );
      writeFileSync(join(tempDir, "app.ts"), `const x = 42;`);

      const result = scanDirectory(tempDir);
      expect(result.filesWithSecrets.length).toBe(0);
    });

    test("returns zero results for empty directory", () => {
      const result = scanDirectory(tempDir);
      expect(result.totalFiles).toBe(0);
      expect(result.scannedFiles).toBe(0);
      expect(result.filesWithSecrets).toEqual([]);
    });
  });
});
