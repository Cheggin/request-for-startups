import { NextResponse } from "next/server";
import { getLoops } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const loops = getLoops();
  return NextResponse.json(loops);
}
