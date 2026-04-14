import { exists } from "fs/promises";
import { getLogPath, initKnowledgeBase } from "./store.js";
import { type Category, type OperationType, LOG_PREFIXES } from "./constants.js";

export interface LogEntry {
  operation: OperationType;
  details: string;
  timestamp?: string;
}

export interface ParsedLogEntry {
  timestamp: string;
  operation: OperationType;
  details: string;
  raw: string;
}

function formatLogEntry(entry: LogEntry): string {
  const timestamp = entry.timestamp ?? new Date().toISOString();
  const prefix = LOG_PREFIXES[entry.operation];
  return `- ${timestamp} ${prefix} ${entry.details}`;
}

export async function logOperation(
  rootPath: string,
  category: Category,
  entry: LogEntry
): Promise<void> {
  await initKnowledgeBase(rootPath, category);
  const logPath = getLogPath(rootPath, category);
  const currentContent = await Bun.file(logPath).text();
  const newEntry = formatLogEntry(entry);
  const updatedContent = currentContent.trimEnd() + "\n" + newEntry + "\n";
  await Bun.write(logPath, updatedContent);
}

export async function readLog(
  rootPath: string,
  category: Category
): Promise<ParsedLogEntry[]> {
  const logPath = getLogPath(rootPath, category);

  if (!(await exists(logPath))) {
    return [];
  }

  const content = await Bun.file(logPath).text();
  return parseLogContent(content);
}

export async function recentLog(
  rootPath: string,
  category: Category,
  n: number
): Promise<ParsedLogEntry[]> {
  const entries = await readLog(rootPath, category);
  return entries.slice(-n);
}

function parseLogContent(content: string): ParsedLogEntry[] {
  const lines = content.split("\n");
  const entries: ParsedLogEntry[] = [];

  for (const line of lines) {
    const match = line.match(
      /^- (\d{4}-\d{2}-\d{2}T[\d:.]+Z?) \[(\w+)\] (.+)$/
    );
    if (match) {
      entries.push({
        timestamp: match[1],
        operation: match[2].toLowerCase() as OperationType,
        details: match[3],
        raw: line,
      });
    }
  }

  return entries;
}
