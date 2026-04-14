"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { verifyCheckoutSession } from "@/lib/stripe-actions";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    verifyCheckoutSession(sessionId)
      .then((result) => {
        setEmail(result.customerEmail);
      })
      .catch(() => {
        // Verification failed — still show success since Stripe redirected here
      })
      .finally(() => setLoading(false));
  }, [sessionId]);

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          className="text-success"
        >
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-foreground">Welcome to Pro!</h1>

      {loading ? (
        <p className="mt-4 text-muted">Confirming your subscription...</p>
      ) : (
        <p className="mt-4 text-muted">
          Your Pro subscription is now active.
          {email && (
            <>
              {" "}
              A confirmation has been sent to{" "}
              <span className="font-medium text-foreground">{email}</span>.
            </>
          )}
        </p>
      )}

      <Link
        href="/"
        className="mt-8 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
      >
        Start Converting
      </Link>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-muted">Loading...</div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
