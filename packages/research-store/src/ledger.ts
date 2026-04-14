/**
 * Experiment ledger -- TSV-based experiment log (autoresearch pattern).
 * Stores experiment results in .harness/research/ledger.tsv.
 */
import * as fs from "fs";
import * as path from "path";
import { RESEARCH_DIR, LEDGER_FILE, LEDGER_HEADERS, STATUSES, type Category, type ExperimentStatus } from "./constants";

export interface ExperimentRecord {
  timestamp: string;
  category: Category;
  experiment_description: string;
  metric: string;
  result: string;
  status: ExperimentStatus;
  confidence: number;
}

export interface AppendInput {
  category: Category;
  experiment_description: string;
  metric: string;
  result: string;
  status: ExperimentStatus;
  confidence: number;
}

function getLedgerPath(projectRoot: string): string {
  const dir = path.join(projectRoot, RESEARCH_DIR);
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, LEDGER_FILE);
}

function escapeField(value: string): string {
  return value.replace(/\t/g, " ").replace(/\n/g, " ").replace(/\r/g, "");
}

function rowToRecord(fields: string[]): ExperimentRecord | null {
  if (fields.length < LEDGER_HEADERS.length) return null;
  const status = fields[5] as ExperimentStatus;
  if (!STATUSES.includes(status)) return null;
  return {
    timestamp: fields[0],
    category: fields[1] as Category,
    experiment_description: fields[2],
    metric: fields[3],
    result: fields[4],
    status,
    confidence: parseFloat(fields[6]) || 0,
  };
}

export function appendResult(projectRoot: string, experiment: AppendInput): void {
  const ledgerPath = getLedgerPath(projectRoot);
  if (!fs.existsSync(ledgerPath)) {
    fs.writeFileSync(ledgerPath, LEDGER_HEADERS.join("\t") + "\n");
  }
  const timestamp = new Date().toISOString();
  const row = [
    timestamp,
    escapeField(experiment.category),
    escapeField(experiment.experiment_description),
    escapeField(experiment.metric),
    escapeField(experiment.result),
    experiment.status,
    experiment.confidence.toString(),
  ].join("\t");
  fs.appendFileSync(ledgerPath, row + "\n");
}

export function readHistory(projectRoot: string): ExperimentRecord[] {
  const ledgerPath = getLedgerPath(projectRoot);
  if (!fs.existsSync(ledgerPath)) return [];
  const content = fs.readFileSync(ledgerPath, "utf-8").trim();
  const lines = content.split("\n");
  if (lines.length <= 1) return [];
  const records: ExperimentRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const record = rowToRecord(line.split("\t"));
    if (record) records.push(record);
  }
  return records;
}

export function getWins(projectRoot: string): ExperimentRecord[] {
  return readHistory(projectRoot).filter((r) => r.status === "keep");
}

export function getLosses(projectRoot: string): ExperimentRecord[] {
  return readHistory(projectRoot).filter((r) => r.status === "discard");
}

export function getCrashes(projectRoot: string): ExperimentRecord[] {
  return readHistory(projectRoot).filter((r) => r.status === "crash");
}

export function wasAlreadyTried(
  projectRoot: string,
  description: string,
  category?: Category,
): ExperimentRecord | null {
  const history = readHistory(projectRoot);
  const terms = description.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  for (const record of history) {
    if (category && record.category !== category) continue;
    const recordLower = record.experiment_description.toLowerCase();
    const matchCount = terms.filter((t) => recordLower.includes(t)).length;
    if (terms.length > 0 && matchCount / terms.length >= 0.7) {
      return record;
    }
  }
  return null;
}
