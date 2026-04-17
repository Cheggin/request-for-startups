import { NextResponse } from "next/server";
import { getTraceEvents } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const events = getTraceEvents();
  return NextResponse.json({ events });
}
