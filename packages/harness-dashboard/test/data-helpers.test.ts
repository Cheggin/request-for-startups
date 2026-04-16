import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { getCosts } from "../src/lib/data";

describe("getCosts", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "harness-dashboard-test-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  test("returns empty array when costs directory does not exist", () => {
    const result = getCosts(tempDir);
    expect(result).toEqual([]);
  });

  test("reads cost files from .harness/costs/", () => {
    const costsDir = join(tempDir, ".harness", "costs");
    mkdirSync(costsDir, { recursive: true });

    writeFileSync(
      join(costsDir, "backend.json"),
      JSON.stringify({ agent: "backend", totalCost: 1.25 })
    );
    writeFileSync(
      join(costsDir, "frontend.json"),
      JSON.stringify({ agent: "frontend", cost: 0.50 })
    );

    const result = getCosts(tempDir);
    expect(result).toHaveLength(2);

    const backend = result.find((c) => c.agent === "backend");
    expect(backend?.cost).toBe(1.25);

    const frontend = result.find((c) => c.agent === "frontend");
    expect(frontend?.cost).toBe(0.50);
  });

  test("uses filename as agent name when agent field missing", () => {
    const costsDir = join(tempDir, ".harness", "costs");
    mkdirSync(costsDir, { recursive: true });

    writeFileSync(
      join(costsDir, "ops.json"),
      JSON.stringify({ totalCost: 2.00 })
    );

    const result = getCosts(tempDir);
    expect(result[0].agent).toBe("ops");
    expect(result[0].cost).toBe(2.00);
  });

  test("returns zero cost when no cost fields present", () => {
    const costsDir = join(tempDir, ".harness", "costs");
    mkdirSync(costsDir, { recursive: true });

    writeFileSync(
      join(costsDir, "empty.json"),
      JSON.stringify({ agent: "empty" })
    );

    const result = getCosts(tempDir);
    expect(result[0].cost).toBe(0);
  });

  test("ignores non-json files", () => {
    const costsDir = join(tempDir, ".harness", "costs");
    mkdirSync(costsDir, { recursive: true });

    writeFileSync(join(costsDir, "notes.txt"), "some notes");
    writeFileSync(
      join(costsDir, "valid.json"),
      JSON.stringify({ agent: "valid", totalCost: 1.00 })
    );

    const result = getCosts(tempDir);
    expect(result).toHaveLength(1);
    expect(result[0].agent).toBe("valid");
  });
});
