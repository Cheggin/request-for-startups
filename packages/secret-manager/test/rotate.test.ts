import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { checkAge } from "../src/rotate";

describe("rotate", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "secret-rotate-test-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  test("returns empty array when no metadata exists", () => {
    const result = checkAge(tempDir);
    expect(result).toEqual([]);
  });

  test("flags secrets older than 90 days as warning", () => {
    const metaDir = join(tempDir, ".harness");
    mkdirSync(metaDir, { recursive: true });

    const ninetyFiveDaysAgo = new Date(
      Date.now() - 95 * 24 * 60 * 60 * 1000
    ).toISOString();

    writeFileSync(
      join(metaDir, "secrets-meta.json"),
      JSON.stringify({
        OLD_SECRET: { updatedAt: ninetyFiveDaysAgo },
      })
    );

    const result = checkAge(tempDir);
    expect(result.length).toBe(1);
    expect(result[0].key).toBe("OLD_SECRET");
    expect(result[0].status).toBe("warning");
    expect(result[0].ageDays).toBeGreaterThanOrEqual(95);
  });

  test("flags secrets older than 180 days as alert", () => {
    const metaDir = join(tempDir, ".harness");
    mkdirSync(metaDir, { recursive: true });

    const twoHundredDaysAgo = new Date(
      Date.now() - 200 * 24 * 60 * 60 * 1000
    ).toISOString();

    writeFileSync(
      join(metaDir, "secrets-meta.json"),
      JSON.stringify({
        ANCIENT_SECRET: { updatedAt: twoHundredDaysAgo },
      })
    );

    const result = checkAge(tempDir);
    expect(result.length).toBe(1);
    expect(result[0].key).toBe("ANCIENT_SECRET");
    expect(result[0].status).toBe("alert");
  });

  test("does not flag recent secrets", () => {
    const metaDir = join(tempDir, ".harness");
    mkdirSync(metaDir, { recursive: true });

    const yesterday = new Date(
      Date.now() - 1 * 24 * 60 * 60 * 1000
    ).toISOString();

    writeFileSync(
      join(metaDir, "secrets-meta.json"),
      JSON.stringify({
        FRESH_SECRET: { updatedAt: yesterday },
      })
    );

    const result = checkAge(tempDir);
    expect(result).toEqual([]);
  });

  test("sorts results by age descending", () => {
    const metaDir = join(tempDir, ".harness");
    mkdirSync(metaDir, { recursive: true });

    const ninetyFiveDays = new Date(
      Date.now() - 95 * 24 * 60 * 60 * 1000
    ).toISOString();
    const twoHundredDays = new Date(
      Date.now() - 200 * 24 * 60 * 60 * 1000
    ).toISOString();

    writeFileSync(
      join(metaDir, "secrets-meta.json"),
      JSON.stringify({
        MEDIUM: { updatedAt: ninetyFiveDays },
        OLD: { updatedAt: twoHundredDays },
      })
    );

    const result = checkAge(tempDir);
    expect(result.length).toBe(2);
    expect(result[0].key).toBe("OLD");
    expect(result[1].key).toBe("MEDIUM");
  });
});
