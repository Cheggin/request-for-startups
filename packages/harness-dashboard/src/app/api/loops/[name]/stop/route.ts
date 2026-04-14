import { NextResponse } from "next/server";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  console.log("[loops/stop] Stopping loop:", name);

  try {
    // Check if session exists first
    try {
      execSync(`tmux has-session -t "${name}" 2>/dev/null`, { encoding: "utf-8" });
    } catch {
      return NextResponse.json({ ok: false, error: `Session "${name}" not found` }, { status: 404 });
    }

    // Kill the tmux session
    execSync(`tmux kill-session -t "${name}" 2>/dev/null`, {
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
