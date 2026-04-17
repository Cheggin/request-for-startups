import { NextResponse } from "next/server";
import { sendNudge } from "@/lib/data";
import type { NudgeRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as NudgeRequest;

  if (!body.paneId || !body.message) {
    return NextResponse.json(
      { success: false, error: "paneId and message required" },
      { status: 400 }
    );
  }

  if (!/^%\d+$/.test(body.paneId)) {
    return NextResponse.json(
      { success: false, error: "Invalid pane ID format" },
      { status: 400 }
    );
  }

  const result = sendNudge(body.paneId, body.message);
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
