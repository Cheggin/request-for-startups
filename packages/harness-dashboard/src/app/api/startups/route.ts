import { NextResponse } from "next/server";
import { getStartups } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const startups = getStartups();
  return NextResponse.json(startups);
}
