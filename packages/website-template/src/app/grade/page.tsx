"use client";

import { useState } from "react";
import type { Metadata } from "next";

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

const STARTUP_TYPES: { value: StartupType; label: string }[] = [
  { value: "b2c", label: "B2C / Consumer" },
  { value: "b2b-saas", label: "B2B SaaS" },
  { value: "devtool", label: "Developer Tool" },
  { value: "marketplace", label: "Marketplace" },
];

const GRADE_COLOR: Record<Grade, string> = {
  A: "#16a34a", B: "#65a30d", C: "#ca8a04", D: "#ea580c", F: "#dc2626",
};

const SEVERITY_COLOR: Record<string, string> = {
  high: "#dc2626", medium: "#ca8a04", low: "#6b7280",
};

const DIMENSION_LABELS: Record<keyof ScoreBreakdown, string> = {
  problemClarity: "Problem Clarity",
  marketSize: "Market Size",
  differentiation: "Differentiation",
  feasibility: "Feasibility",
  founderMarketFit: "Founder-Market Fit",
};

function ScoreBar({ value, max = 20 }: { value: number; max?: number }) {
  const pct = (value / max) * 100;
  const color = pct >= 70 ? "#16a34a" : pct >= 40 ? "#ca8a04" : "#dc2626";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "#e5e7eb", borderRadius: 3 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.4s ease" }} />
      </div>
      <span style={{ fontSize: 13, fontVariantNumeric: "tabular-nums", minWidth: 36, textAlign: "right" }}>{value}/{max}</span>
    </div>
  );
}

export default function GradePage() {
  const [idea, setIdea] = useState("");
  const [audience, setAudience] = useState("");
  const [startupType, setStartupType] = useState<StartupType | "">("");
  const [report, setReport] = useState<GraderReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!idea.trim() || !audience.trim()) return;

    setLoading(true);
    setError("");
    setReport(null);

    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: idea.trim(),
          audience: audience.trim(),
          startupType: startupType || undefined,
        }),
      });

      if (!res.ok) throw new Error("Grading failed");
      const data = await res.json();
      setReport(data);

      // PostHog tracking
      if (typeof window !== "undefined" && (window as any).posthog) {
        (window as any).posthog.capture("grader_report_generated", {
          score: data.score,
          grade: data.grade,
          startup_type: data.startupType,
        });
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function trackCTAClick(cta: string) {
    if (typeof window !== "undefined" && (window as any).posthog) {
      (window as any).posthog.capture("grader_cta_clicked", {
        cta,
        score: report?.score,
        grade: report?.grade,
      });
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 8 }}>
        Grade Your Startup Idea
      </h1>
      <p style={{ fontSize: 15, color: "#6b7280", marginBottom: 32, lineHeight: 1.5 }}>
        Get a deterministic score across 5 dimensions in under 5 seconds. No AI hallucinations — pure pattern analysis.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 40 }}>
        <div>
          <label htmlFor="idea" style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            Your startup idea
          </label>
          <textarea
            id="idea"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Describe the problem you're solving and how your product works..."
            rows={4}
            required
            style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: "1px solid #d1d5db", borderRadius: 6, resize: "vertical", fontFamily: "inherit" }}
          />
        </div>

        <div>
          <label htmlFor="audience" style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            Target audience
          </label>
          <input
            id="audience"
            type="text"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="e.g., B2B SaaS founders with 1-10 employees"
            required
            style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: "1px solid #d1d5db", borderRadius: 6, fontFamily: "inherit" }}
          />
        </div>

        <div>
          <label htmlFor="type" style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            Startup type <span style={{ fontWeight: 400, color: "#9ca3af" }}>(optional — auto-detected if blank)</span>
          </label>
          <select
            id="type"
            value={startupType}
            onChange={(e) => setStartupType(e.target.value as StartupType | "")}
            style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: "1px solid #d1d5db", borderRadius: 6, fontFamily: "inherit", background: "#fff" }}
          >
            <option value="">Auto-detect</option>
            {STARTUP_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading || !idea.trim() || !audience.trim()}
          style={{
            padding: "12px 24px", fontSize: 15, fontWeight: 600,
            background: loading ? "#9ca3af" : "#111", color: "#fff",
            border: "none", borderRadius: 6, cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Grading..." : "Grade My Idea"}
        </button>
      </form>

      {error && <p style={{ color: "#dc2626", marginBottom: 24 }}>{error}</p>}

      {report && (
        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 32 }}>
          {/* Score header */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 24 }}>
            <span style={{ fontSize: 56, fontWeight: 700, lineHeight: 1, color: GRADE_COLOR[report.grade], fontVariantNumeric: "tabular-nums" }}>
              {report.score}
            </span>
            <div>
              <span style={{ fontSize: 24, fontWeight: 700, color: GRADE_COLOR[report.grade] }}>
                Grade {report.grade}
              </span>
              <p style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
                {report.startupType} / scored {new Date(report.generatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Breakdown */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Score Breakdown</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(Object.entries(report.breakdown) as [keyof ScoreBreakdown, number][]).map(([key, val]) => (
                <div key={key}>
                  <div style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>{DIMENSION_LABELS[key]}</div>
                  <ScoreBar value={val} />
                </div>
              ))}
            </div>
          </div>

          {/* Risks */}
          {report.risks.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Risks</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {report.risks.map((risk) => (
                  <div key={risk.id} style={{ padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: SEVERITY_COLOR[risk.severity] }}>
                        {risk.severity}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{risk.label}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.4, margin: 0 }}>{risk.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next step */}
          <div style={{ padding: "16px 20px", background: "#f9fafb", borderRadius: 8, marginBottom: 32 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Recommended Next Step</h2>
            <p style={{ fontSize: 14, lineHeight: 1.5, margin: 0 }}>{report.nextStep}</p>
          </div>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a
              href="https://github.com/anthropics/claude-code"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackCTAClick("install_claude_code")}
              style={{
                padding: "10px 20px", fontSize: 14, fontWeight: 600,
                background: "#111", color: "#fff", borderRadius: 6,
                textDecoration: "none",
              }}
            >
              Install Claude Code
            </a>
            <a
              href="https://github.com/Cheggin/request-for-startups"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackCTAClick("view_harness")}
              style={{
                padding: "10px 20px", fontSize: 14, fontWeight: 600,
                border: "1px solid #d1d5db", borderRadius: 6,
                textDecoration: "none", color: "#111",
              }}
            >
              View Startup Harness
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
