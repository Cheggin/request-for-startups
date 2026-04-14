/**
 * GateGuard - PreToolUse hook on Edit/Write
 *
 * Maintains a Set of files Read in the current session.
 * On Read tool call: adds the file to the set.
 * On Edit/Write tool call: checks if the file is in the set.
 * Returns { decision: "ALLOW" } or { decision: "DENY", message: "..." }
 */

export interface ToolCall {
  tool_name: string;
  tool_input: Record<string, unknown>;
}

export interface HookResult {
  decision: "ALLOW" | "DENY";
  message?: string;
}

const GATED_TOOLS = new Set(["Edit", "Write"]);

export function createGateGuard() {
  const readFiles = new Set<string>();

  function handleToolCall(call: ToolCall): HookResult {
    const { tool_name, tool_input } = call;
    const filePath = (tool_input.file_path as string) || "";

    if (tool_name === "Read" && filePath) {
      readFiles.add(filePath);
      return { decision: "ALLOW" };
    }

    if (GATED_TOOLS.has(tool_name) && filePath) {
      if (readFiles.has(filePath)) {
        return { decision: "ALLOW" };
      }
      return {
        decision: "DENY",
        message: `File ${filePath} must be Read before it can be edited. Use the Read tool first to inspect the file contents.`,
      };
    }

    return { decision: "ALLOW" };
  }

  function getReadFiles(): Set<string> {
    return readFiles;
  }

  function reset(): void {
    readFiles.clear();
  }

  return { handleToolCall, getReadFiles, reset };
}
