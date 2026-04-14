import { readFileSync, existsSync } from "fs";
import { join } from "path";

const METADATA_FILE = ".harness/secrets-meta.json";
const WARNING_THRESHOLD_DAYS = 90;
const ALERT_THRESHOLD_DAYS = 180;

export interface RotationCheck {
  key: string;
  updatedAt: string;
  ageDays: number;
  status: "ok" | "warning" | "alert";
}

/**
 * Read secret metadata to determine ages.
 */
function readMetadata(
  envPath: string
): Record<string, { updatedAt: string }> {
  const metaFile = join(envPath, METADATA_FILE);
  if (!existsSync(metaFile)) return {};
  try {
    return JSON.parse(readFileSync(metaFile, "utf-8"));
  } catch {
    return {};
  }
}

/**
 * Check the age of all secrets. Returns a list of secrets
 * that should be rotated (older than 90 days get flagged).
 */
export function checkAge(envPath: string): RotationCheck[] {
  const meta = readMetadata(envPath);
  const now = Date.now();
  const results: RotationCheck[] = [];

  for (const [key, info] of Object.entries(meta)) {
    const updatedAt = new Date(info.updatedAt).getTime();
    const ageDays = Math.floor((now - updatedAt) / (1000 * 60 * 60 * 24));

    let status: "ok" | "warning" | "alert" = "ok";
    if (ageDays >= ALERT_THRESHOLD_DAYS) {
      status = "alert";
    } else if (ageDays >= WARNING_THRESHOLD_DAYS) {
      status = "warning";
    }

    if (status !== "ok") {
      results.push({
        key,
        updatedAt: info.updatedAt,
        ageDays,
        status,
      });
    }
  }

  // Sort by age descending (oldest first)
  results.sort((a, b) => b.ageDays - a.ageDays);

  return results;
}
