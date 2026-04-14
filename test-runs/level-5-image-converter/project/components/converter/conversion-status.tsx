"use client";

interface ConversionStatusProps {
  status: "idle" | "converting" | "done" | "error";
  errorMessage?: string;
}

export function ConversionStatus({
  status,
  errorMessage,
}: ConversionStatusProps) {
  if (status === "idle") return null;

  return (
    <div data-testid="conversion-status" className="flex items-center gap-2 text-sm">
      {status === "converting" && (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-muted">Converting...</span>
        </>
      )}
      {status === "done" && (
        <>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="text-success"
          >
            <path
              d="M4 8l3 3 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-success font-medium">Conversion complete</span>
        </>
      )}
      {status === "error" && (
        <span className="text-error" data-testid="conversion-error">
          {errorMessage ?? "Conversion failed"}
        </span>
      )}
    </div>
  );
}
