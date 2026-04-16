import { NextResponse } from "next/server";
import { execFileSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { resolve, join } from "path";

export const dynamic = "force-dynamic";

const REPO_ROOT_CANDIDATES = [
  resolve(process.cwd(), "../.."),
  resolve(process.cwd(), ".."),
  resolve(process.cwd()),
];
const PROJECT_DIR =
  REPO_ROOT_CANDIDATES.find((c) => existsSync(join(c, ".harness"))) ||
  REPO_ROOT_CANDIDATES[0];
const LOOPS_YML_PATH = join(PROJECT_DIR, ".harness", "loops.yml");
const VALID_NAME_RE = /^[a-z0-9_-]+$/i;

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  console.log("[loops/start] Starting loop:", name);

  if (!VALID_NAME_RE.test(name)) {
    return NextResponse.json({ ok: false, error: "Invalid loop name" }, { status: 400 });
  }

  // Read loops.yml to get the loop's skill and prompt
  if (!existsSync(LOOPS_YML_PATH)) {
    return NextResponse.json({ ok: false, error: "loops.yml not found" }, { status: 404 });
  }

  try {
    // Check if session already exists
    try {
      execFileSync("tmux", ["has-session", "-t", name], { encoding: "utf-8", stdio: "pipe" });
      return NextResponse.json({ ok: false, error: `Session "${name}" already running` }, { status: 409 });
    } catch {
      // Session doesn't exist — good, we'll create it
    }

    // Read the skill from loops.yml for this loop
    const raw = readFileSync(LOOPS_YML_PATH, "utf-8");
    const skillMatch = raw.match(new RegExp(`^${escapeRegExp(name)}:[\\s\\S]*?skill:\\s*(.+)`, "m"));
    const skill = skillMatch ? skillMatch[1].trim() : null;

    if (!skill) {
      return NextResponse.json({ ok: false, error: `Loop "${name}" not found in loops.yml or missing skill` }, { status: 404 });
    }

    // Create tmux session running claude with the loop's skill
    execFileSync("tmux", [
      "new-session", "-d", "-s", name, "-c", PROJECT_DIR,
      `claude --dangerously-skip-permissions '/${skill}'`,
    ], { encoding: "utf-8", timeout: 10000 });

    console.log("[loops/start] Started tmux session:", name, "with skill:", skill);
    return NextResponse.json({ ok: true, output: `Started tmux session "${name}" with skill /${skill}` });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[loops/start] Failed to start loop:", name, msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
