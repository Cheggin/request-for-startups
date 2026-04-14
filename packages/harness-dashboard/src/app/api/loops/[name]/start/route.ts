import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";

export const dynamic = "force-dynamic";

const LOOPS_YML_PATH = "/Users/reagan/Documents/GitHub/request-for-startups/.harness/loops.yml";
const PROJECT_DIR = "/Users/reagan/Documents/GitHub/request-for-startups";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  console.log("[loops/start] Starting loop:", name);

  // Read loops.yml to get the loop's skill and prompt
  if (!existsSync(LOOPS_YML_PATH)) {
    return NextResponse.json({ ok: false, error: "loops.yml not found" }, { status: 404 });
  }

  try {
    // Check if session already exists
    try {
      execSync(`tmux has-session -t "${name}" 2>/dev/null`, { encoding: "utf-8" });
      return NextResponse.json({ ok: false, error: `Session "${name}" already running` }, { status: 409 });
    } catch {
      // Session doesn't exist — good, we'll create it
    }

    // Read the skill from loops.yml for this loop
    const raw = readFileSync(LOOPS_YML_PATH, "utf-8");
    const skillMatch = raw.match(new RegExp(`^${name}:[\\s\\S]*?skill:\\s*(.+)`, "m"));
    const skill = skillMatch ? skillMatch[1].trim() : null;

    if (!skill) {
      return NextResponse.json({ ok: false, error: `Loop "${name}" not found in loops.yml or missing skill` }, { status: 404 });
    }

    // Create tmux session running claude with the loop's skill
    const cmd = `tmux new-session -d -s "${name}" -c "${PROJECT_DIR}" "claude --dangerously-skip-permissions '/${skill}'"`;
    console.log("[loops/start] Running:", cmd);
    execSync(cmd, { encoding: "utf-8", timeout: 10000 });

    return NextResponse.json({ ok: true, output: `Started tmux session "${name}" with skill /${skill}` });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[loops/start] Failed to start loop:", name, msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
