import { NextResponse } from "next/server";
import { execFileSync } from "child_process";

export const dynamic = "force-dynamic";

const VALID_PANE_RE = /^%\d+$/;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ paneId: string }> }
) {
  const { paneId } = await params;

  if (!paneId || !VALID_PANE_RE.test(paneId)) {
    return NextResponse.json({ error: "Invalid pane ID" }, { status: 400 });
  }

  try {
    // Send Ctrl-C to interrupt current process
    execFileSync("tmux", ["send-keys", "-t", paneId, "C-c"], { timeout: 3000 });
    // Small delay to let the process exit
    execFileSync("sleep", ["0.5"], { timeout: 3000 });
    // Send Up arrow + Enter to re-run the last command
    execFileSync("tmux", ["send-keys", "-t", paneId, "Up", "Enter"], { timeout: 3000 });

    console.log(`[agents/restart] Restarted pane ${paneId}`);
    return NextResponse.json({ ok: true, paneId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error(`[agents/restart] Failed to restart pane ${paneId}:`, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
