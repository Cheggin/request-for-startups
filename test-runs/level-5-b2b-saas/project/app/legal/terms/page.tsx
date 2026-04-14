import Link from "next/link";

export const metadata = {
  title: "Terms of service — PulseCheck",
  description: "PulseCheck terms of service for teams and organizations.",
};

const LAST_UPDATED = "April 1, 2026";

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen" style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-[#e2e8f0]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#6d28d9] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <span className="font-semibold text-[15px] text-[#0f172a] tracking-tight">PulseCheck</span>
          </Link>
          <Link href="/dashboard" className="btn-primary text-sm px-4 py-2 rounded-lg">
            Open Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-[#0f172a] tracking-tight mb-2">Terms of service</h1>
          <p className="text-sm text-[#94a3b8] mb-12">Last updated: {LAST_UPDATED}</p>

          <div className="flex flex-col gap-10 text-[#334155] leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-[#0f172a] mb-3">1. Acceptance of terms</h2>
              <p className="mb-3">
                By accessing or using PulseCheck (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service. If you are using the Service on behalf of an organization, you represent that you have authority to bind that organization to these terms.
              </p>
              <p>
                The Service is designed for business use by teams and organizations. Individual users access the Service through team accounts managed by a designated team administrator.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0f172a] mb-3">2. Service description</h2>
              <p>
                PulseCheck provides weekly pulse survey tools for team managers. The Service collects anonymous employee feedback, generates trend analytics, and delivers aggregated insights to team administrators. Survey responses are stripped of identifying information before being presented to managers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0f172a] mb-3">3. Team administrator rights and responsibilities</h2>
              <p className="mb-3">
                Team administrators have the ability to: create and manage survey schedules, invite and remove team members, access aggregated survey results and trend data, configure notification preferences, and manage billing for their team.
              </p>
              <p>
                Administrators are responsible for ensuring that their use of the Service complies with applicable workplace regulations and internal policies. Administrators must inform team members that anonymous pulse surveys are being conducted through the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0f172a] mb-3">4. Data processing and ownership</h2>
              <p className="mb-3">
                Survey response data is processed by PulseCheck solely to provide the Service. We act as a data processor on behalf of your organization (the data controller). Your organization retains ownership of all survey data collected through the Service.
              </p>
              <p className="mb-3">
                We process data to: aggregate and anonymize survey responses, generate trend analytics, deliver notifications and digests, and maintain the Service.
              </p>
              <p>
                We do not sell, share, or use your survey data for advertising or any purpose beyond providing the Service. Upon termination, you may request a full export of your data within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0f172a] mb-3">5. Anonymity guarantees</h2>
              <p>
                Individual survey responses are never attributable to specific employees in any reports, exports, or API responses provided to team administrators. We enforce a minimum team size of 4 members before results are displayed to prevent inference of individual responses. Open-text responses are presented without timestamps or ordering that could reveal identity.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0f172a] mb-3">6. Billing and subscription</h2>
              <p className="mb-3">
                The Free plan is available at no cost with stated feature limitations. The Pro plan is billed monthly per team at the rate published on our pricing page. Prices may change with 30 days notice.
              </p>
              <p>
                You may cancel your Pro subscription at any time. Cancellation takes effect at the end of your current billing period. No refunds are provided for partial billing periods.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0f172a] mb-3">7. Acceptable use</h2>
              <p>
                You agree not to: attempt to deanonymize survey responses, use the Service to monitor or surveil individual employees, misrepresent the purpose of surveys to team members, or use the Service in violation of applicable employment or data protection laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0f172a] mb-3">8. Service availability and limitations</h2>
              <p>
                We aim for 99.9% uptime but do not guarantee uninterrupted access. We reserve the right to modify features, introduce new functionality, or discontinue aspects of the Service with reasonable notice. Material changes to data processing will be communicated at least 30 days in advance.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0f172a] mb-3">9. Termination</h2>
              <p>
                Either party may terminate this agreement at any time. We may suspend access immediately if we detect violations of these terms. Upon termination, your data will be retained for 30 days to allow export, after which it will be permanently deleted.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0f172a] mb-3">10. Contact</h2>
              <p>
                For questions about these terms, contact us at{" "}
                <a href="mailto:legal@pulsecheck.io" className="text-[#6d28d9] hover:text-[#5b21b6] transition-colors">
                  legal@pulsecheck.io
                </a>.
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-[#e2e8f0] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#6d28d9] flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <span className="font-semibold text-sm text-[#0f172a]">PulseCheck</span>
          </Link>
          <nav className="flex items-center gap-6 flex-wrap justify-center">
            <Link href="/blog" className="text-sm text-[#64748b] hover:text-[#0f172a] transition-colors">Blog</Link>
            <Link href="/legal/terms" className="text-sm text-[#64748b] hover:text-[#0f172a] transition-colors">Terms</Link>
            <Link href="/legal/privacy" className="text-sm text-[#64748b] hover:text-[#0f172a] transition-colors">Privacy</Link>
          </nav>
          <p className="text-xs text-[#94a3b8]">2026 PulseCheck. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
