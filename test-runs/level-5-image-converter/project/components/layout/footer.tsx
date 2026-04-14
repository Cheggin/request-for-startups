import Link from "next/link";

export function Footer() {
  return (
    <footer
      data-testid="footer"
      className="border-t border-border bg-surface"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM6.5 7.5h3v5h-3v-5z"
              fill="currentColor"
              opacity="0.5"
            />
          </svg>
          <span>Your images never leave your browser.</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/legal/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
          <Link href="/legal/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <span>&copy; {new Date().getFullYear()} Convertify</span>
        </div>
      </div>
    </footer>
  );
}
