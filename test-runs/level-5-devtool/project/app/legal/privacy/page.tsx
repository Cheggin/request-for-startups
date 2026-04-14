import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy — json2ts",
  description:
    "Privacy policy for the json2ts web playground and CLI tool.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Privacy policy
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Last updated: April 14, 2026
      </p>

      <div className="mt-10 space-y-8 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            1. Data we collect
          </h2>
          <p>
            The json2ts web playground performs all JSON-to-TypeScript conversion
            locally in your browser. We do not collect, transmit, or store any
            JSON data you paste into the playground. The CLI tool runs entirely
            on your machine and makes no network requests.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            2. Analytics
          </h2>
          <p>
            We may collect anonymous usage analytics such as page views,
            referral sources, and browser type to understand how the Service is
            used and to improve it. This data does not include any JSON input,
            generated output, or personally identifiable information. You can
            opt out by enabling your browser&rsquo;s Do Not Track setting.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            3. Cookies
          </h2>
          <p>
            The website may use essential cookies for functionality such as
            theme preference and session state. We do not use third-party
            advertising cookies. Analytics cookies, if used, are anonymized and
            do not track individual users across sites.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            4. Third-party services
          </h2>
          <p>
            If you purchase a paid plan, payment processing is handled by
            Stripe. Stripe collects and processes payment information under
            their own privacy policy. We do not store credit card numbers or
            full payment details on our servers.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            5. Data retention
          </h2>
          <p>
            Since we do not collect JSON input data, there is nothing to
            retain or delete. Account information for paid users is retained
            for the duration of the subscription and deleted upon request after
            cancellation.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            6. Your rights
          </h2>
          <p>
            You have the right to request access to, correction of, or deletion
            of any personal data we hold about you. For paid users, this
            includes account email and billing history. To exercise these
            rights, contact us through the json2ts GitHub repository.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            7. Changes to this policy
          </h2>
          <p>
            We may update this privacy policy from time to time. Changes will
            be posted on this page with an updated date. Continued use of the
            Service constitutes acceptance of the revised policy.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            8. Contact
          </h2>
          <p>
            Privacy questions can be directed to the json2ts GitHub repository
            or by opening an issue at github.com/json2ts/json2ts.
          </p>
        </section>
      </div>
    </div>
  );
}
