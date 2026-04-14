import Link from "next/link";

const FEATURES = [
  {
    title: "Anonymous Feedback",
    description:
      "Employees answer honestly when they know responses are private. PulseCheck strips all identifying data before results reach managers.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Trend Analytics",
    description:
      "Track morale, workload, and engagement week over week. Spot problems before they become attrition with visual trend charts.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    title: "Dead Simple",
    description:
      "Three questions, once a week, under 60 seconds. No training required. Teams onboard in minutes, not weeks.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
];

const PRICING = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For small teams getting started.",
    features: [
      "Up to 10 team members",
      "3 pulse questions per week",
      "30-day history",
      "Basic summary reports",
    ],
    cta: "Start for free",
    href: "/dashboard",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "per team / month",
    description: "For growing teams that need deeper insight.",
    features: [
      "Unlimited team members",
      "Custom question sets",
      "Full trend history",
      "Segment by department or role",
      "Slack + email digest",
      "Priority support",
    ],
    cta: "Start Pro trial",
    href: "/dashboard",
    highlighted: true,
  },
];

// Dashboard mockup data
const MOCK_SCORES = [
  { label: "Morale", value: 78, color: "#6d28d9" },
  { label: "Workload", value: 62, color: "#8b5cf6" },
  { label: "Clarity", value: 85, color: "#a78bfa" },
  { label: "Connection", value: 71, color: "#c4b5fd" },
];

const MOCK_TREND = [42, 55, 51, 67, 72, 69, 78];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen" style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-[#e2e8f0]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#6d28d9] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <span className="font-semibold text-[15px] text-[#0f172a] tracking-tight">PulseCheck</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-[#64748b] hover:text-[#0f172a] transition-colors">Features</a>
            <a href="#preview" className="text-sm text-[#64748b] hover:text-[#0f172a] transition-colors">Preview</a>
            <a href="#pricing" className="text-sm text-[#64748b] hover:text-[#0f172a] transition-colors">Pricing</a>
          </nav>
          <Link href="/dashboard" className="btn-primary text-sm px-4 py-2 rounded-lg">
            Open Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-white pt-20 pb-24 px-6">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(109,40,217,0.08) 0%, transparent 70%)",
            }}
          />
          <div className="relative max-w-3xl mx-auto text-center">
            <div className="badge mb-6" style={{ background: "#ede9fe", color: "#6d28d9" }}>
              Weekly team pulse surveys
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-[#0f172a] leading-[1.1] mb-5">
              Know how your team{" "}
              <span style={{ color: "#6d28d9" }}>actually</span> feels
            </h1>
            <p className="text-xl text-[#64748b] leading-relaxed mb-8 max-w-xl mx-auto">
              PulseCheck sends a 3-question anonymous survey every week. You get
              trend charts, not guesswork.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/dashboard"
                className="btn-primary px-7 py-3 text-base rounded-xl font-semibold"
              >
                Get started free
              </Link>
              <a
                href="#preview"
                className="btn-secondary px-7 py-3 text-base rounded-xl font-semibold"
              >
                See how it works
              </a>
            </div>
            <p className="mt-4 text-sm text-[#94a3b8]">No credit card required. Free forever for small teams.</p>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="bg-[#faf8ff] py-20 px-6 border-y border-[#ede9fe]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-[#0f172a] tracking-tight mb-3">Everything managers need</h2>
              <p className="text-[#64748b] text-lg max-w-xl mx-auto">Built for frontline managers who need signal, not noise.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="card flex flex-col gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#ede9fe", color: "#6d28d9" }}
                  >
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0f172a] text-[17px] mb-1">{feature.title}</h3>
                    <p className="text-[#64748b] text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Dashboard Preview */}
        <section id="preview" className="py-20 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-[#0f172a] tracking-tight mb-3">Your dashboard, at a glance</h2>
              <p className="text-[#64748b] text-lg max-w-xl mx-auto">
                Clear scores, weekly trends, and team sentiment — all in one view.
              </p>
            </div>

            {/* Mockup window */}
            <div
              className="rounded-2xl overflow-hidden shadow-2xl mx-auto max-w-4xl"
              style={{ border: "1px solid #e2e8f0" }}
            >
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-4 h-10 bg-[#f8fafc] border-b border-[#e2e8f0]">
                <div className="w-3 h-3 rounded-full bg-[#ef4444]/70" />
                <div className="w-3 h-3 rounded-full bg-[#eab308]/70" />
                <div className="w-3 h-3 rounded-full bg-[#22c55e]/70" />
                <div className="ml-3 flex-1 bg-[#e2e8f0] rounded h-5 max-w-[220px] flex items-center px-3">
                  <span className="text-[11px] text-[#94a3b8]">app.pulsecheck.io/dashboard</span>
                </div>
              </div>

              {/* Mockup content */}
              <div className="bg-[#faf8ff] p-6 flex gap-5">
                {/* Sidebar */}
                <div className="w-44 flex-shrink-0 hidden sm:flex flex-col gap-1">
                  {["Overview", "Surveys", "Trends", "Team", "Settings"].map((item, i) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                      style={
                        i === 0
                          ? { background: "#ede9fe", color: "#6d28d9", fontWeight: 600 }
                          : { color: "#64748b" }
                      }
                    >
                      <div
                        className="w-4 h-4 rounded"
                        style={{ background: i === 0 ? "#6d28d9" : "#e2e8f0" }}
                      />
                      {item}
                    </div>
                  ))}
                </div>

                {/* Main content */}
                <div className="flex-1 flex flex-col gap-4">
                  {/* Score cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {MOCK_SCORES.map((s) => (
                      <div key={s.label} className="bg-white rounded-xl p-3 border border-[#e2e8f0]">
                        <div className="text-[11px] text-[#94a3b8] mb-1 font-medium uppercase tracking-wide">{s.label}</div>
                        <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                        <div className="mt-2 h-1.5 rounded-full bg-[#f1f5f9] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${s.value}%`, background: s.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Trend chart */}
                  <div className="bg-white rounded-xl p-4 border border-[#e2e8f0]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-[#0f172a]">Morale trend — last 7 weeks</span>
                      <span className="badge text-[11px]" style={{ background: "#dcfce7", color: "#16a34a" }}>+8 pts</span>
                    </div>
                    <div className="flex items-end gap-2 h-20">
                      {MOCK_TREND.map((v, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className="w-full rounded-t-sm transition-all"
                            style={{
                              height: `${(v / 100) * 72}px`,
                              background: i === MOCK_TREND.length - 1 ? "#6d28d9" : "#ede9fe",
                            }}
                          />
                          <span className="text-[10px] text-[#94a3b8]">W{i + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent responses row */}
                  <div className="bg-white rounded-xl p-4 border border-[#e2e8f0]">
                    <div className="text-sm font-semibold text-[#0f172a] mb-3">Recent open responses</div>
                    {[
                      { text: "Sprint planning could use more time for estimation.", sentiment: "neutral" },
                      { text: "Cross-team communication has improved a lot this month.", sentiment: "positive" },
                    ].map((r, i) => (
                      <div key={i} className="flex items-start gap-3 py-2 border-t border-[#f1f5f9] first:border-0">
                        <div
                          className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                          style={{ background: r.sentiment === "positive" ? "#22c55e" : "#94a3b8" }}
                        />
                        <span className="text-sm text-[#64748b]">{r.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20 px-6 bg-[#faf8ff] border-t border-[#ede9fe]">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-[#0f172a] tracking-tight mb-3">Simple, honest pricing</h2>
              <p className="text-[#64748b] text-lg">Start free. Upgrade when you need more.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {PRICING.map((plan) => (
                <div
                  key={plan.name}
                  className="card flex flex-col gap-6"
                  style={
                    plan.highlighted
                      ? { border: "2px solid #6d28d9", background: "#ffffff" }
                      : {}
                  }
                >
                  {plan.highlighted && (
                    <div className="badge self-start" style={{ background: "#6d28d9", color: "#fff" }}>
                      Most popular
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-semibold text-[#64748b] uppercase tracking-wide mb-1">{plan.name}</div>
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-bold text-[#0f172a]">{plan.price}</span>
                      <span className="text-sm text-[#94a3b8] mb-1.5">/ {plan.period}</span>
                    </div>
                    <p className="text-sm text-[#64748b] mt-1">{plan.description}</p>
                  </div>
                  <ul className="flex flex-col gap-2.5 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-[#0f172a]">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.href}
                    className={`text-center py-3 rounded-xl font-semibold text-sm transition-opacity ${
                      plan.highlighted
                        ? "btn-primary"
                        : "btn-secondary"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#e2e8f0] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#6d28d9] flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <span className="font-semibold text-sm text-[#0f172a]">PulseCheck</span>
            <span className="text-[#94a3b8] text-sm ml-2">Weekly team pulse surveys</span>
          </div>
          <nav className="flex items-center gap-6 flex-wrap justify-center">
            <Link href="/dashboard" className="text-sm text-[#64748b] hover:text-[#0f172a] transition-colors">Dashboard</Link>
            <a href="#features" className="text-sm text-[#64748b] hover:text-[#0f172a] transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-[#64748b] hover:text-[#0f172a] transition-colors">Pricing</a>
            <a href="mailto:hello@pulsecheck.io" className="text-sm text-[#64748b] hover:text-[#0f172a] transition-colors">Contact</a>
            <a href="#" className="text-sm text-[#64748b] hover:text-[#0f172a] transition-colors">Privacy</a>
            <a href="#" className="text-sm text-[#64748b] hover:text-[#0f172a] transition-colors">Terms</a>
          </nav>
          <p className="text-xs text-[#94a3b8]">2026 PulseCheck. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
