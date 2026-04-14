import { $ } from "bun";

/**
 * Sync secrets to Vercel project environment variables.
 * Uses `vercel env add` CLI — expects Vercel CLI to be installed and linked.
 */
export async function syncToVercel(
  secrets: Record<string, string>,
  environment: "production" | "preview" | "development" = "production"
): Promise<{ synced: string[]; errors: string[] }> {
  const synced: string[] = [];
  const errors: string[] = [];

  for (const [key, value] of Object.entries(secrets)) {
    try {
      // vercel env add reads value from stdin
      const proc = Bun.spawn(
        ["vercel", "env", "add", key, environment, "--force"],
        { stdin: "pipe" }
      );
      proc.stdin.write(value);
      proc.stdin.end();
      const exitCode = await proc.exited;
      if (exitCode === 0) {
        synced.push(key);
      } else {
        errors.push(`Failed to set ${key}: exit code ${exitCode}`);
      }
    } catch (err) {
      errors.push(
        `Failed to set ${key}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return { synced, errors };
}

/**
 * Sync secrets to Railway project environment variables.
 * Uses `railway variables set` CLI.
 */
export async function syncToRailway(
  secrets: Record<string, string>
): Promise<{ synced: string[]; errors: string[] }> {
  const synced: string[] = [];
  const errors: string[] = [];

  // Railway supports setting multiple variables at once
  const assignments = Object.entries(secrets).map(
    ([key, value]) => `${key}=${value}`
  );

  if (assignments.length === 0) return { synced, errors };

  try {
    const result = await $`railway variables set ${assignments.join(" ")}`.quiet();
    if (result.exitCode === 0) {
      synced.push(...Object.keys(secrets));
    } else {
      // Fall back to setting one at a time
      for (const [key, value] of Object.entries(secrets)) {
        try {
          const r = await $`railway variables set ${key}=${value}`.quiet();
          if (r.exitCode === 0) {
            synced.push(key);
          } else {
            errors.push(`Failed to set ${key}: exit code ${r.exitCode}`);
          }
        } catch (err) {
          errors.push(
            `Failed to set ${key}: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }
    }
  } catch {
    // Batch failed, try individually
    for (const [key, value] of Object.entries(secrets)) {
      try {
        const r = await $`railway variables set ${key}=${value}`.quiet();
        if (r.exitCode === 0) {
          synced.push(key);
        } else {
          errors.push(`Failed to set ${key}: exit code ${r.exitCode}`);
        }
      } catch (err) {
        errors.push(
          `Failed to set ${key}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  }

  return { synced, errors };
}

/**
 * Sync secrets to Convex environment variables.
 * Uses `npx convex env set` CLI.
 */
export async function syncToConvex(
  secrets: Record<string, string>
): Promise<{ synced: string[]; errors: string[] }> {
  const synced: string[] = [];
  const errors: string[] = [];

  for (const [key, value] of Object.entries(secrets)) {
    try {
      const result = await $`npx convex env set ${key} ${value}`.quiet();
      if (result.exitCode === 0) {
        synced.push(key);
      } else {
        errors.push(`Failed to set ${key}: exit code ${result.exitCode}`);
      }
    } catch (err) {
      errors.push(
        `Failed to set ${key}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return { synced, errors };
}
