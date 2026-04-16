import { NextResponse } from "next/server";
import { getGrowthSnapshot } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = getGrowthSnapshot();
  return NextResponse.json(snapshot);
}
