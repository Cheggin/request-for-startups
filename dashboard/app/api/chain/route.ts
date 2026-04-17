import { NextResponse } from "next/server";
import { getSkillChain } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const chain = getSkillChain();
  return NextResponse.json({ chain });
}
