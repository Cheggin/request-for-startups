import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as fs from "fs";
import * as path from "path";
import {
  appendResult,
  readHistory,
  getWins,
  getLosses,
  getCrashes,
  wasAlreadyTried,
} from "../src/ledger.js";

const TEST_ROOT = path.join(import.meta.dir, ".tmp-ledger-test");

beforeEach(() => {
  fs.mkdirSync(TEST_ROOT, { recursive: true });
});

afterEach(() => {
  fs.rmSync(TEST_ROOT, { recursive: true, force: true });
});

describe("appendResult", () => {
  it("creates ledger file with headers on first append", () => {
    appendResult(TEST_ROOT, {
      category: "coding",
      experiment_description: "baseline run",
      metric: "val_bpb",
      result: "0.997",
      status: "keep",
      confidence: 0.9,
    });

    const ledgerPath = path.join(TEST_ROOT, ".harness/research/ledger.tsv");
    expect(fs.existsSync(ledgerPath)).toBe(true);

    const content = fs.readFileSync(ledgerPath, "utf-8");
    const lines = content.trim().split("\n");
    expect(lines[0]).toBe(
      "timestamp\tcategory\texperiment_description\tmetric\tresult\tstatus\tconfidence",
    );
    expect(lines.length).toBe(2);
  });

  it("appends multiple results", () => {
    appendResult(TEST_ROOT, {
      category: "coding",
      experiment_description: "baseline",
      metric: "val_bpb",
      result: "0.997",
      status: "keep",
      confidence: 0.9,
    });

    appendResult(TEST_ROOT, {
      category: "coding",
      experiment_description: "increase LR",
      metric: "val_bpb",
      result: "0.993",
      status: "keep",
      confidence: 0.8,
    });

    appendResult(TEST_ROOT, {
      category: "coding",
      experiment_description: "switch to GeLU",
      metric: "val_bpb",
      result: "1.005",
      status: "discard",
      confidence: 0.6,
    });

    const history = readHistory(TEST_ROOT);
    expect(history.length).toBe(3);
  });

  it("escapes tabs and newlines in fields", () => {
    appendResult(TEST_ROOT, {
      category: "coding",
      experiment_description: "test\twith\ttabs\nand\nnewlines",
      metric: "score",
      result: "42",
      status: "keep",
      confidence: 0.5,
    });

    const history = readHistory(TEST_ROOT);
    expect(history.length).toBe(1);
    expect(history[0].experiment_description).not.toContain("\t");
    expect(history[0].experiment_description).not.toContain("\n");
  });
});

describe("readHistory", () => {
  it("returns empty array when no ledger exists", () => {
    const history = readHistory(TEST_ROOT);
    expect(history).toEqual([]);
  });

  it("parses all fields correctly", () => {
    appendResult(TEST_ROOT, {
      category: "growth",
      experiment_description: "A/B test hero copy",
      metric: "conversion_rate",
      result: "0.045",
      status: "keep",
      confidence: 0.85,
    });

    const history = readHistory(TEST_ROOT);
    expect(history.length).toBe(1);

    const record = history[0];
    expect(record.category).toBe("growth");
    expect(record.experiment_description).toBe("A/B test hero copy");
    expect(record.metric).toBe("conversion_rate");
    expect(record.result).toBe("0.045");
    expect(record.status).toBe("keep");
    expect(record.confidence).toBe(0.85);
    expect(record.timestamp).toBeTruthy();
  });
});

describe("getWins / getLosses / getCrashes", () => {
  beforeEach(() => {
    appendResult(TEST_ROOT, {
      category: "coding",
      experiment_description: "kept experiment",
      metric: "score",
      result: "100",
      status: "keep",
      confidence: 0.9,
    });
    appendResult(TEST_ROOT, {
      category: "coding",
      experiment_description: "discarded experiment",
      metric: "score",
      result: "50",
      status: "discard",
      confidence: 0.4,
    });
    appendResult(TEST_ROOT, {
      category: "coding",
      experiment_description: "crashed experiment",
      metric: "score",
      result: "0",
      status: "crash",
      confidence: 0.1,
    });
  });

  it("getWins returns only kept experiments", () => {
    const wins = getWins(TEST_ROOT);
    expect(wins.length).toBe(1);
    expect(wins[0].status).toBe("keep");
    expect(wins[0].experiment_description).toBe("kept experiment");
  });

  it("getLosses returns only discarded experiments", () => {
    const losses = getLosses(TEST_ROOT);
    expect(losses.length).toBe(1);
    expect(losses[0].status).toBe("discard");
  });

  it("getCrashes returns only crashed experiments", () => {
    const crashes = getCrashes(TEST_ROOT);
    expect(crashes.length).toBe(1);
    expect(crashes[0].status).toBe("crash");
  });
});

describe("wasAlreadyTried", () => {
  beforeEach(() => {
    appendResult(TEST_ROOT, {
      category: "coding",
      experiment_description: "increase learning rate to 0.04",
      metric: "val_bpb",
      result: "0.993",
      status: "keep",
      confidence: 0.8,
    });
    appendResult(TEST_ROOT, {
      category: "growth",
      experiment_description: "add social proof testimonials to landing page",
      metric: "conversion",
      result: "0.03",
      status: "discard",
      confidence: 0.5,
    });
  });

  it("finds similar experiment by fuzzy match", () => {
    const match = wasAlreadyTried(
      TEST_ROOT,
      "increase the learning rate to higher value",
    );
    expect(match).not.toBeNull();
    expect(match!.experiment_description).toContain("learning rate");
  });

  it("filters by category", () => {
    const match = wasAlreadyTried(
      TEST_ROOT,
      "increase learning rate",
      "growth",
    );
    expect(match).toBeNull();
  });

  it("returns null for unrelated experiment", () => {
    const match = wasAlreadyTried(
      TEST_ROOT,
      "completely different quantum experiment",
    );
    expect(match).toBeNull();
  });
});
