import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";

const SECRETS_FILE = ".harness/secrets.env";
const METADATA_FILE = ".harness/secrets-meta.json";

/**
 * Parse a .env-style file into a key-value record.
 * Handles quoted values, comments, and blank lines.
 */
function parseEnvContent(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

/**
 * Serialize a key-value record into .env format.
 */
function serializeEnv(secrets: Record<string, string>): string {
  return Object.entries(secrets)
    .map(([key, value]) => {
      // Quote values that contain spaces or special characters
      const needsQuotes = /[\s#"'\\]/.test(value);
      const escaped = needsQuotes ? `"${value.replace(/"/g, '\\"')}"` : value;
      return `${key}=${escaped}`;
    })
    .join("\n");
}

/**
 * Resolve the full path for the secrets file relative to envPath.
 */
function secretsPath(envPath: string): string {
  return join(envPath, SECRETS_FILE);
}

function metadataPath(envPath: string): string {
  return join(envPath, METADATA_FILE);
}

/**
 * Read secret metadata (tracks when each secret was last set).
 */
function readMetadata(
  envPath: string
): Record<string, { updatedAt: string }> {
  const metaFile = metadataPath(envPath);
  if (!existsSync(metaFile)) return {};
  try {
    return JSON.parse(readFileSync(metaFile, "utf-8"));
  } catch {
    return {};
  }
}

/**
 * Write secret metadata.
 */
function writeMetadata(
  envPath: string,
  meta: Record<string, { updatedAt: string }>
): void {
  const metaFile = metadataPath(envPath);
  const dir = dirname(metaFile);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(metaFile, JSON.stringify(meta, null, 2), "utf-8");
}

/**
 * Read all secrets from .harness/secrets.env
 */
export function readSecrets(envPath: string): Record<string, string> {
  const filePath = secretsPath(envPath);
  if (!existsSync(filePath)) return {};
  const content = readFileSync(filePath, "utf-8");
  return parseEnvContent(content);
}

/**
 * Write or update a single secret. Updates metadata timestamp.
 */
export function writeSecret(
  envPath: string,
  key: string,
  value: string
): void {
  const secrets = readSecrets(envPath);
  secrets[key] = value;

  const filePath = secretsPath(envPath);
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(filePath, serializeEnv(secrets) + "\n", "utf-8");

  // Update metadata
  const meta = readMetadata(envPath);
  meta[key] = { updatedAt: new Date().toISOString() };
  writeMetadata(envPath, meta);
}

/**
 * Delete a secret by key.
 */
export function deleteSecret(envPath: string, key: string): void {
  const secrets = readSecrets(envPath);
  if (!(key in secrets)) return;
  delete secrets[key];

  const filePath = secretsPath(envPath);
  writeFileSync(filePath, serializeEnv(secrets) + "\n", "utf-8");

  // Clean metadata
  const meta = readMetadata(envPath);
  delete meta[key];
  writeMetadata(envPath, meta);
}

/**
 * Validate that all required secrets are present.
 */
export function validateSecrets(
  envPath: string,
  required: string[]
): { valid: boolean; missing: string[] } {
  const secrets = readSecrets(envPath);
  const missing = required.filter((key) => !(key in secrets));
  return { valid: missing.length === 0, missing };
}
