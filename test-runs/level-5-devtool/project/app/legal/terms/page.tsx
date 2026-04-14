import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of service — json2ts",
  description: "Terms of service for the json2ts web playground and CLI tool.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Terms of service
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Last updated: April 14, 2026
      </p>

      <div className="mt-10 space-y-8 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            1. Acceptance of terms
          </h2>
          <p>
            By accessing or using json2ts (the &ldquo;Service&rdquo;), including
            the web playground at json2ts.dev, the CLI tool distributed via npm,
            and the programmatic API, you agree to be bound by these terms. If
            you do not agree, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            2. Description of service
          </h2>
          <p>
            json2ts converts JSON data into TypeScript type definitions. The
            Service is provided as a CLI tool, a browser-based playground, and a
            JavaScript library. All conversion happens locally in your browser or
            on your machine. No JSON data is transmitted to our servers.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            3. Use license
          </h2>
          <p>
            The json2ts CLI and library are distributed under the MIT License.
            You may use, copy, modify, and distribute the software in accordance
            with that license. The web playground is provided for personal and
            commercial use without restriction.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            4. Paid services
          </h2>
          <p>
            Certain features may require a paid subscription. Pricing,
            features, and billing terms are described on the pricing page.
            Subscriptions renew automatically unless cancelled. Refunds are
            handled on a case-by-case basis.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            5. Disclaimer of warranties
          </h2>
          <p>
            The Service is provided &ldquo;as is&rdquo; without warranty of any
            kind. We do not guarantee that generated TypeScript types will be
            correct, complete, or suitable for any particular purpose. You are
            responsible for reviewing and testing generated output before use in
            production systems.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            6. Limitation of liability
          </h2>
          <p>
            In no event shall json2ts or its maintainers be liable for any
            indirect, incidental, special, or consequential damages arising from
            your use of the Service, including but not limited to damages from
            incorrect type generation, data loss, or service interruption.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            7. Changes to terms
          </h2>
          <p>
            We may update these terms from time to time. Continued use of the
            Service after changes constitutes acceptance of the revised terms.
            Material changes will be communicated through the website or GitHub
            repository.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            8. Contact
          </h2>
          <p>
            Questions about these terms can be directed to the json2ts GitHub
            repository or by opening an issue at
            github.com/json2ts/json2ts.
          </p>
        </section>
      </div>
    </div>
  );
}
