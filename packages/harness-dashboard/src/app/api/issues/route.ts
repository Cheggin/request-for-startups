import { NextResponse } from "next/server";
import { getGitHubIssues } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const issues = getGitHubIssues();
  return NextResponse.json(issues);
}
