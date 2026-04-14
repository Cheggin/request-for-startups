import { NextResponse } from "next/server";
import { getRunningAgents } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const agents = getRunningAgents();
  return NextResponse.json(agents);
}
