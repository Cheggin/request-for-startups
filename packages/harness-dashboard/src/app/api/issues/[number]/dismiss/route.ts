import { NextResponse } from "next/server";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  const { number } = await params;
  const issueNum = parseInt(number, 10);

  if (!issueNum || issueNum < 1) {
    return NextResponse.json({ error: "Invalid issue number" }, { status: 400 });
  }

  try {
    // Close the issue via gh CLI with a "dismissed from dashboard" comment
    execSync(
      `gh issue close ${issueNum} --comment "Dismissed from Harness Dashboard" 2>&1`,
      { encoding: "utf-8", timeout: 10000 }
    );

    console.log(`[issues/dismiss] Closed issue #${issueNum}`);
    return NextResponse.json({ ok: true, number: issueNum });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error(`[issues/dismiss] Failed to close issue #${issueNum}:`, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
