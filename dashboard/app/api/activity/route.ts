import { NextResponse } from "next/server";
import { getActivity } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const points = getActivity();
  return NextResponse.json({ points });
}
