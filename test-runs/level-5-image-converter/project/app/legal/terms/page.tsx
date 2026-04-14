import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "Terms of service for Convertify, the free browser-based image converter.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Terms of service
      </h1>
      <p className="mt-2 text-sm text-muted">Last updated: April 14, 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="text-lg font-semibold text-foreground">
            What this service does
          </h2>
          <p className="mt-2">
            Convertify is a free image conversion tool that runs entirely in your
            browser. You can convert images between PNG, JPG, and WebP formats.
            All processing happens on your device — your files are never uploaded
            to a server.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            Acceptable use
          </h2>
          <p className="mt-2">You agree not to use Convertify to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Process or distribute illegal content</li>
            <li>
              Infringe on the intellectual property rights of others
            </li>
            <li>
              Attempt to interfere with or disrupt the service
            </li>
            <li>
              Use automated tools to scrape or overload the site
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            How your data is handled
          </h2>
          <p className="mt-2">
            Your images are processed using your browser&apos;s Canvas API.
            Files never leave your device and are never sent to any server. Once
            you close or refresh the page, all image data is discarded from
            memory. We have no access to the files you convert.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            Limitation of liability
          </h2>
          <p className="mt-2">
            Convertify is provided &ldquo;as is&rdquo; without warranties of
            any kind. We do our best to keep the service reliable, but we
            can&apos;t guarantee uninterrupted availability or that conversions
            will produce a specific result. You are responsible for verifying
            that converted files meet your needs before using them.
          </p>
          <p className="mt-2">
            We are not liable for any loss of data, image quality degradation, or
            other damages arising from your use of this service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            Changes to these terms
          </h2>
          <p className="mt-2">
            We may update these terms from time to time. If we make significant
            changes, we&apos;ll update the date at the top of this page.
            Continued use of the service after changes are posted means you
            accept the updated terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Contact</h2>
          <p className="mt-2">
            Questions about these terms? Reach out at{" "}
            <span className="font-medium text-foreground">
              support@convertify.app
            </span>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
