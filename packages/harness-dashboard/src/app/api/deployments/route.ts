import { NextResponse } from "next/server";
import { getDeployments } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const deployments = getDeployments();
  return NextResponse.json(deployments);
}
