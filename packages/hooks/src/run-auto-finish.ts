#!/usr/bin/env bun
/**
 * Auto-finish Stop hook.
 * Commits and pushes the current agent's session-scoped changes, then closes
 * the linked GitHub issue with a commit reference comment.
 */

import { readStopInputFromStdin, runAutoFinish } from "./auto-finish.js";

try {
  const input = await readStopInputFromStdin(process.stdin);
  const result = runAutoFinish(input);

  if (result.status === "committed") {
    console.log(
      `[AutoFinish] committed ${result.commitSha?.slice(0, 7)} and closed #${result.issueNumber}`
    );
  }
} catch (error) {
  // Stop hooks must never block session shutdown.
  console.error(`[AutoFinish] Failed: ${String(error)}`);
}
