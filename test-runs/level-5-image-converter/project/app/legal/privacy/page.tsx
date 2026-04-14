import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "Privacy policy for Convertify. Your images are processed locally and never uploaded to any server.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Privacy policy
      </h1>
      <p className="mt-2 text-sm text-muted">Last updated: April 14, 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="text-lg font-semibold text-foreground">
            The short version
          </h2>
          <p className="mt-2">
            Convertify processes images entirely in your browser. We don&apos;t
            collect, store, or transmit your files. Your images never leave your
            device.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            What data we collect
          </h2>
          <p className="mt-2">
            For the free conversion tool, we collect no personal data and no
            image data. All conversion happens client-side using your
            browser&apos;s Canvas API.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Cookies</h2>
          <p className="mt-2">
            We do not set cookies by default. If analytics is configured (via
            PostHog), anonymous usage cookies may be set to help us understand
            how the site is used. These cookies do not track your identity or
            link to any personal information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            Data sharing
          </h2>
          <p className="mt-2">
            We do not sell, share, or transfer any user data to third parties.
            Since we don&apos;t collect your files or personal information, there
            is nothing to share.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            Third-party services
          </h2>
          <p className="mt-2">
            The site may use third-party analytics (PostHog) if configured.
            Analytics data is limited to anonymous page views and feature usage.
            No image data or personal information is sent to any third party.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            Changes to this policy
          </h2>
          <p className="mt-2">
            If we change this policy, we&apos;ll update the date at the top of
            the page. We encourage you to review this page periodically.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Contact</h2>
          <p className="mt-2">
            Privacy questions? Reach out at{" "}
            <span className="font-medium text-foreground">
              privacy@convertify.app
            </span>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
