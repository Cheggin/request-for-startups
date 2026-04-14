import Link from "next/link";

export const metadata = {
  title: "Privacy policy — PulseCheck",
  description: "How PulseCheck handles your team's data, GDPR compliance, and privacy practices.",
};

const LAST_UPDATED = "April 1, 2026";

export default function PrivacyPage() {
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
          <h1 className="text-4xl font-bold text-[#0f172a] tracking-tight mb-2">Privacy policy</h1>
          <p className="text-sm text-[#94a3b8] mb-12">Last updated: {LAST_UPDATED}</p>

          <div className="flex flex-col gap-10 text-[#334155] leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-[#0f172a] mb-3">Overview</h2>
              <p>
                PulseCheck is a B2B team feedback tool. Your organization is the data controller; PulseCheck operates as the data processor. This policy describes what data we collect, how we process it, and the rights available to your organization and its members.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0f172a] mb-3">Data we collect</h2>
              <p className="mb-3">
                <strong>Account data:</strong> When a team administrator creates an account, we collect their name, email address, and organization name. Team members are added via email invitation.
              </p>
              <p className="mb-3">
                <strong>Survey response data:</strong> We collect responses to pulse survey questions (numerical ratings and optional open-text feedback). Responses are anonymized at the point of collection — we do not store any mapping between a response and the individual who submitted it.
              </p>
              <p>
                <strong>Usage data:</strong> We collect basic usage metrics (page views, feature usage, session duration) to improve the Service. We do not use third-party advertising trackers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0f172a] mb-3">Data processing</h2>
              <p className="mb-3">
                We process your data for the following purposes: delivering anonymized survey results to team administrators, generating trend analytics and engagement reports, sending scheduled survey invitations and digest notifications, and maintaining system security and performance.
              </p>
              <p>
                We use industry-standard encryption (TLS 1.3 in transit, AES-256 at rest) to protect all data. Survey responses are aggregated before being presented to administrators, with a minimum threshold of 4 respondents to prevent individual identification.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0f172a] mb-3">Team administrator access</h2>
              <p>
                Team administrators can access: aggregated survey scores and trends, anonymous open-text responses (without attribution), team-level analytics and department segmentation (Pro plan), response rate metrics (percentage only, not individual completion status), and data export functionality for all team survey data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0f172a] mb-3">GDPR compliance</h2>
              <p className="mb-3">
                PulseCheck complies with the General Data Protection Regulation (GDPR) for users in the European Economic Area (EEA). We operate as a data processor under Article 28 of the GDPR.
              </p>
              <p className="mb-3">
                <strong>Legal basis for processing:</strong> We process data based on the legitimate interest of the data controller (your organization) in understanding team engagement and wellbeing, and on the contractual necessity of providing the Service.
              </p>
              <p className="mb-3">
                <strong>Data subject rights:</strong> Individuals have the right to access, rectify, erase, restrict processing, and port their personal data. Because survey responses are anonymized, individual responses cannot be identified or modified after submission. Requests related to account data (name, email) can be fulfilled through the team administrator or by contacting us directly.
              </p>
              <p className="mb-3">
                <strong>Data Processing Agreement:</strong> We offer a Data Processing Agreement (DPA) to organizations that require one. Contact{" "}
                <a href="mailto:privacy@pulsecheck.io" className="text-[#6d28d9] hover:text-[#5b21b6] transition-colors">
                  privacy@pulsecheck.io
                </a>{" "}
                to request a DPA.
              </p>
              <p>
                <strong>Data location:</strong> Data is stored in the European Union (Frankfurt, Germany) for EEA-based organizations and in the United States (Virginia) for all other organizations. We do not transfer EEA data outside the EU without appropriate safeguards.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0f172a] mb-3">Data retention</h2>
              <p>
                Survey data is retained for the duration of your subscription. Upon cancellation, data is available for export for 30 days and permanently deleted within 60 days. Account data is deleted within 30 days of account closure. We retain aggregated, non-identifiable analytics data indefinitely for product improvement.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0f172a] mb-3">Sub-processors</h2>
              <p>
                We use the following sub-processors: cloud infrastructure (for hosting and data storage), email delivery (for survey invitations and notifications), and payment processing (for subscription billing). A complete list of sub-processors is available upon request. We notify customers of sub-processor changes 30 days in advance.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0f172a] mb-3">Cookies and tracking</h2>
              <p>
                We use essential cookies for authentication and session management. We do not use advertising cookies or third-party tracking pixels. Analytics are collected through privacy-respecting, first-party instrumentation only.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0f172a] mb-3">Changes to this policy</h2>
              <p>
                We will notify team administrators via email at least 30 days before material changes take effect. Continued use of the Service after changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0f172a] mb-3">Contact</h2>
              <p>
                For privacy inquiries, data subject requests, or to request a DPA, contact us at{" "}
                <a href="mailto:privacy@pulsecheck.io" className="text-[#6d28d9] hover:text-[#5b21b6] transition-colors">
                  privacy@pulsecheck.io
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
