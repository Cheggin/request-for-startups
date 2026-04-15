import { NextResponse } from "next/server";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ paneId: string }> }
) {
  const { paneId } = await params;

  if (!paneId || !/^%\d+$/.test(paneId)) {
    return NextResponse.json({ error: "Invalid pane ID" }, { status: 400 });
  }

  try {
    // Send Ctrl-C to interrupt current process, then re-run last command
    execSync(`tmux send-keys -t "${paneId}" C-c`, { timeout: 3000 });
    // Small delay to let the process exit
    execSync("sleep 0.5", { timeout: 3000 });
    // Send Up arrow + Enter to re-run the last command
    execSync(`tmux send-keys -t "${paneId}" Up Enter`, { timeout: 3000 });

    console.log(`[agents/restart] Restarted pane ${paneId}`);
    return NextResponse.json({ ok: true, paneId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error(`[agents/restart] Failed to restart pane ${paneId}:`, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
