export default function ThanksPage() {
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center px-5">
      <div className="max-w-sm w-full text-center">
        {/* Checkmark icon */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: "#dcfce7" }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M6 14.5l5.5 5.5L22 9"
              stroke="#22c55e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-3">Thank you!</h1>
        <p className="text-base text-muted-foreground mb-2">
          Your response has been recorded anonymously.
        </p>
        <p className="text-sm text-muted-foreground">
          Your feedback helps the team improve.
        </p>
      </div>

      {/* Branding */}
      <div className="mt-16 flex items-center gap-2">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{ backgroundColor: "#6d28d9" }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="4" stroke="white" strokeWidth="1.6" />
            <circle cx="6" cy="6" r="1.6" fill="white" />
          </svg>
        </div>
        <span className="text-xs font-medium text-muted-foreground">PulseCheck</span>
      </div>
    </div>
  );
}
