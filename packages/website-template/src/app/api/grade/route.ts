import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/grade — deterministic startup idea grader.
 *
 * Runs pure keyword/pattern analysis (no LLM calls).
 * Duplicates the scoring logic inline to avoid cross-package import issues
 * in Next.js server routes.
 */

type StartupType = "b2c" | "devtool" | "b2b-saas" | "marketplace";
type Grade = "A" | "B" | "C" | "D" | "F";

interface ScoreBreakdown {
  problemClarity: number;
  marketSize: number;
  differentiation: number;
  feasibility: number;
  founderMarketFit: number;
}

interface Risk {
  id: string;
  label: string;
  severity: "high" | "medium" | "low";
  detail: string;
}

interface GraderReport {
  score: number;
  grade: Grade;
  breakdown: ScoreBreakdown;
  risks: Risk[];
  nextStep: string;
  startupType: StartupType;
  idea: string;
  audience: string;
  generatedAt: string;
}

// ─── Keyword banks ───────────────────────────────────────────────────────

const PROBLEM_KW = ["problem","pain","struggle","frustrate","frustrating","difficult","expensive","slow","broken","waste","inefficient","manual","tedious","annoying","hate","can't","cannot","no way to","hard to","impossible","lacking","missing","need","gap"];
const SOLUTION_KW = ["solve","fix","automate","simplify","replace","eliminate","reduce","streamline","enable","empower","help","make it easy","platform for","tool for","app that","service that","system that"];
const DIFF_KW = ["unlike","better than","faster than","cheaper than","first","only","unique","novel","proprietary","patent","moat","advantage","different from","instead of","no one else","new approach","innovative","breakthrough","10x"];
const REVENUE_KW = ["subscription","saas","freemium","premium","pricing","revenue","monetize","charge","pay","fee","commission","per seat","usage-based","tiered","enterprise","contract","ads","advertising","marketplace take","transaction fee"];
const BROAD_KW = ["everyone","all people","the world","billion","million users","consumer","global","mainstream","mass market"];
const NICHE_KW = ["small business","smb","enterprise","developers","engineers","designers","marketers","salespeople","freelancers","creators","teachers","doctors","lawyers","accountants","real estate","restaurants","retail","e-commerce","logistics","healthcare","fintech","edtech","proptech","legaltech","insurtech"];
const COMPLEX_KW = ["ai","ml","machine learning","blockchain","hardware","robotics","self-driving","quantum","biotech","deep tech","satellite","nuclear","manufacturing"];
const SIMPLE_KW = ["web app","mobile app","saas","dashboard","api","plugin","extension","integration","marketplace","platform","landing page","website","portal","tool"];

function hits(text: string, kws: string[]): number {
  const l = text.toLowerCase();
  let c = 0;
  for (const k of kws) if (l.includes(k)) c++;
  return c;
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function scoreIdea(idea: string, audience: string, st: StartupType): ScoreBreakdown {
  const wc = idea.split(/\s+/).length;
  const combined = `${idea} ${audience}`;
  const aw = audience.split(/\s+/).length;

  // Problem clarity (0-20)
  let pc = 4 + clamp(hits(idea, PROBLEM_KW) * 2, 0, 8) + clamp(hits(idea, SOLUTION_KW) * 2, 0, 6);
  if (wc >= 15 && wc <= 100) pc += 2; else if (wc >= 10) pc += 1;

  // Market size (0-20)
  let ms = 6 + clamp(hits(combined, NICHE_KW) * 2, 0, 6) + clamp(hits(combined, BROAD_KW), 0, 3);
  if (aw >= 3 && aw <= 20) ms += 3; else if (aw >= 2) ms += 1;
  if (st === "b2b-saas" || st === "marketplace") ms += 2;

  // Differentiation (0-20)
  let df = 3 + clamp(hits(idea, DIFF_KW) * 3, 0, 10) + clamp(hits(idea, REVENUE_KW) * 2, 0, 4);
  if (wc < 10) df -= 2;

  // Feasibility (0-20)
  let fs = 12 + clamp(hits(idea, SIMPLE_KW) * 2, 0, 6) - clamp(hits(idea, COMPLEX_KW) * 3, 0, 8);
  if (st === "devtool" || st === "b2b-saas") fs += 2;

  // Founder-market fit (0-20)
  let ff = 5 + clamp(hits(combined, NICHE_KW) * 2, 0, 6);
  if (aw >= 5) ff += 4; else if (aw >= 3) ff += 2;
  if (wc >= 30) ff += 3; else if (wc >= 20) ff += 2; else if (wc >= 10) ff += 1;

  return {
    problemClarity: clamp(pc, 0, 20),
    marketSize: clamp(ms, 0, 20),
    differentiation: clamp(df, 0, 20),
    feasibility: clamp(fs, 0, 20),
    founderMarketFit: clamp(ff, 0, 20),
  };
}

function detectType(idea: string): StartupType {
  const l = idea.toLowerCase();
  if (/\bdev(eloper)?\s*(tool|platform|sdk|api|cli|library)\b/i.test(l)) return "devtool";
  if (/\bmarketplace\b|\btwo.?sided\b|\bbuyer.*seller\b|\bseller.*buyer\b/i.test(l)) return "marketplace";
  if (/\bb2b\b|\benterprise\b|\bsaas\b|\bteams?\b.*\bplatform\b/i.test(l)) return "b2b-saas";
  return "b2c";
}

function gradeFromScore(s: number): Grade {
  if (s >= 80) return "A";
  if (s >= 60) return "B";
  if (s >= 40) return "C";
  if (s >= 20) return "D";
  return "F";
}

function detectRisks(idea: string, audience: string, st: StartupType, bd: ScoreBreakdown): Risk[] {
  const risks: Risk[] = [];
  if (bd.problemClarity < 8) risks.push({ id: "vague-problem", label: "Vague problem statement", severity: "high", detail: "The idea doesn't clearly articulate the problem being solved. Add specifics about who suffers and how." });
  if (bd.marketSize < 8) risks.push({ id: "unclear-market", label: "Unclear target market", severity: "medium", detail: "The audience description is too broad or missing. Define a specific first customer segment." });
  if (bd.differentiation < 6) risks.push({ id: "weak-moat", label: "Weak differentiation", severity: "high", detail: "No clear advantage over alternatives. What makes this 10x better, not just 10% better?" });
  if (bd.feasibility < 10) risks.push({ id: "high-complexity", label: "High technical complexity", severity: "medium", detail: "Deep tech increases timeline and cost. Consider starting with a simpler MVP." });
  if (bd.founderMarketFit < 8) risks.push({ id: "low-fit", label: "Low founder-market signal", severity: "low", detail: "The idea lacks domain-specific language. Founders who know their market describe it differently." });
  if (idea.split(/\s+/).length < 15) risks.push({ id: "too-short", label: "Idea too brief", severity: "medium", detail: "Short descriptions score lower across all dimensions. Add specifics: the problem, your approach, and your audience." });
  return risks;
}

function getNextStep(grade: Grade, st: StartupType, risks: Risk[]): string {
  const highRisks = risks.filter(r => r.severity === "high");
  if (highRisks.length > 0) return `Address the highest-risk gap first: ${highRisks[0].label.toLowerCase()}. Write a one-paragraph problem statement that a stranger could understand.`;
  if (grade === "A" || grade === "B") return `Strong foundation. Run /startup-harness:startup-init to generate a full spec and start building.`;
  if (grade === "C") return `Refine your differentiation. What happens if you don't build this? Who suffers and how much?`;
  return `Sharpen the idea. Talk to 5 people in your target audience this week and document their exact words about the problem.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idea, audience, startupType } = body;

    if (!idea || typeof idea !== "string" || !audience || typeof audience !== "string") {
      return NextResponse.json({ error: "idea and audience are required" }, { status: 400 });
    }

    const st: StartupType = startupType ?? detectType(idea);
    const breakdown = scoreIdea(idea, audience, st);
    const score = breakdown.problemClarity + breakdown.marketSize + breakdown.differentiation + breakdown.feasibility + breakdown.founderMarketFit;
    const grade = gradeFromScore(score);
    const risks = detectRisks(idea, audience, st, breakdown);
    const nextStep = getNextStep(grade, st, risks);

    const report: GraderReport = {
      score, grade, breakdown, risks, nextStep,
      startupType: st, idea, audience,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(report);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
