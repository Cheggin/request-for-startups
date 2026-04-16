import { NextResponse } from "next/server";
import { execFileSync } from "child_process";

export const dynamic = "force-dynamic";

const VALID_NAME_RE = /^[a-z0-9_-]+$/i;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  console.log("[loops/stop] Stopping loop:", name);

  if (!VALID_NAME_RE.test(name)) {
    return NextResponse.json({ ok: false, error: "Invalid loop name" }, { status: 400 });
  }

  try {
    // Check if session exists first
    try {
      execFileSync("tmux", ["has-session", "-t", name], { encoding: "utf-8", stdio: "pipe" });
    } catch {
      return NextResponse.json({ ok: false, error: `Session "${name}" not found` }, { status: 404 });
    }

    // Kill the tmux session
    execFileSync("tmux", ["kill-session", "-t", name], {
      encoding: "utf-8",
      timeout: 10000,
    });
    console.log("[loops/stop] Killed tmux session:", name);

    return NextResponse.json({ ok: true, output: `Stopped tmux session "${name}"` });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[loops/stop] Failed to stop loop:", name, msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
