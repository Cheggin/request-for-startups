import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { readSecrets, writeSecret, deleteSecret, validateSecrets } from "../src/store";

describe("store", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "secret-manager-test-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe("readSecrets", () => {
    test("returns empty object when no secrets file exists", () => {
      const result = readSecrets(tempDir);
      expect(result).toEqual({});
    });

    test("reads secrets from .harness/secrets.env", () => {
      writeSecret(tempDir, "API_KEY", "test-key-123");
      writeSecret(tempDir, "DB_URL", "postgres://localhost/db");
      const result = readSecrets(tempDir);
      expect(result.API_KEY).toBe("test-key-123");
      expect(result.DB_URL).toBe("postgres://localhost/db");
    });
  });

  describe("writeSecret", () => {
    test("creates .harness directory and secrets file", () => {
      writeSecret(tempDir, "MY_SECRET", "value123");
      const secrets = readSecrets(tempDir);
      expect(secrets.MY_SECRET).toBe("value123");
    });

    test("updates existing secret", () => {
      writeSecret(tempDir, "KEY", "old");
      writeSecret(tempDir, "KEY", "new");
      const secrets = readSecrets(tempDir);
      expect(secrets.KEY).toBe("new");
    });

    test("preserves other secrets when adding new one", () => {
      writeSecret(tempDir, "A", "1");
      writeSecret(tempDir, "B", "2");
      const secrets = readSecrets(tempDir);
      expect(secrets.A).toBe("1");
      expect(secrets.B).toBe("2");
    });

    test("handles values with spaces by quoting", () => {
      writeSecret(tempDir, "MSG", "hello world");
      const secrets = readSecrets(tempDir);
      expect(secrets.MSG).toBe("hello world");
    });
  });

  describe("deleteSecret", () => {
    test("removes a secret", () => {
      writeSecret(tempDir, "A", "1");
      writeSecret(tempDir, "B", "2");
      deleteSecret(tempDir, "A");
      const secrets = readSecrets(tempDir);
      expect(secrets.A).toBeUndefined();
      expect(secrets.B).toBe("2");
    });

    test("no-op when secret does not exist", () => {
      writeSecret(tempDir, "A", "1");
      deleteSecret(tempDir, "NONEXISTENT");
      const secrets = readSecrets(tempDir);
      expect(secrets.A).toBe("1");
    });
  });

  describe("validateSecrets", () => {
    test("returns valid when all required secrets present", () => {
      writeSecret(tempDir, "A", "1");
      writeSecret(tempDir, "B", "2");
      const result = validateSecrets(tempDir, ["A", "B"]);
      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
    });

    test("returns missing secrets", () => {
      writeSecret(tempDir, "A", "1");
      const result = validateSecrets(tempDir, ["A", "B", "C"]);
      expect(result.valid).toBe(false);
      expect(result.missing).toEqual(["B", "C"]);
    });

    test("returns all missing when no secrets exist", () => {
      const result = validateSecrets(tempDir, ["X", "Y"]);
      expect(result.valid).toBe(false);
      expect(result.missing).toEqual(["X", "Y"]);
    });
  });
});
