import { NextResponse } from "next/server";
import { getAgents, getFleetSummary } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const agents = getAgents();
  const summary = getFleetSummary(agents);
  return NextResponse.json({ agents, summary });
}
