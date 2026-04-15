"use client";

import Image from "next/image";
import { useState } from "react";

const AGENTS = [
  { name: "researcher", output: "scanning 12 repos for auth patterns...", active: true },
  { name: "backend", output: "writing convex/schema.ts migration...", active: true },
  { name: "frontend", output: "waiting for design tokens", active: false },
  { name: "qa-tester", output: "running 48 integration tests...", active: true },
  { name: "docs", output: "generating API reference from types...", active: true },
  { name: "deployer", output: "queued behind qa-tester", active: false },
  { name: "reviewer", output: "reviewing PR #34 diff (1,204 lines)...", active: true },
  { name: "monitor", output: "all systems nominal, 0 errors", active: true },
];

const FEATURES = [
  {
    title: "Visual Agent Grid",
    body: "Eight panes, one window. Every agent visible at a glance — no tab switching, no context lost.",
  },
  {
    title: "Real-time Output",
    body: "Watch agents think, write, and build simultaneously. Stdout streams live in every pane.",
  },
  {
    title: "One-Command Dispatch",
    body: "Send any skill to any pane with a single command. Agents begin working in seconds.",
  },
  {
    title: "Session Persistence",
    body: "Detach and reattach without losing state. Your agents keep running while you step away.",
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="px-3 py-1 text-sm font-sans text-stone hover:text-ink transition-colors duration-150"
      aria-label={copied ? "Copied to clipboard" : `Copy "${text}" to clipboard`}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function GridCell({
  name,
  output,
  active,
}: {
  name: string;
  output: string;
  active: boolean;
}) {
  return (
    <div className="bg-parchment-dark/50 p-4 flex flex-col justify-between gap-3 min-h-[88px]">
      <div className="flex items-center justify-between gap-2">
        <span className="font-sans text-[11px] font-semibold tracking-widest uppercase text-stone">
          {name}
        </span>
        <span
          className={`w-[6px] h-[6px] rounded-full shrink-0 ${
            active ? "bg-garden" : "bg-stone-light"
          }`}
          aria-label={active ? "Active" : "Idle"}
        />
      </div>
      <p className="font-mono text-[11px] leading-relaxed text-stone/80 truncate">
        {output}
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* ——— Hero ——— */}
      <section className="relative w-full">
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: "21 / 9", maxHeight: 560 }}>
          <Image
            src="/hero.jpeg"
            alt="Pixel-art landscape of classical columns and gardens overlooking a vast sky"
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, oklch(0.955 0.012 75 / 0) 50%, oklch(0.955 0.012 75) 100%)",
            }}
          />
        </div>

        <div className="relative max-w-2xl mx-auto px-6 -mt-20 sm:-mt-28 z-10">
          <h1
            className="font-serif tracking-tight text-ink"
            style={{ fontSize: "clamp(2.75rem, 6vw, 4.5rem)", lineHeight: 1.05 }}
          >
            Command your agents.
          </h1>
          <p className="mt-5 text-stone max-w-lg" style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.25rem)", lineHeight: 1.65 }}>
            A tmux-based grid for orchestrating AI agents from your terminal.
            Eight panes. One window. Total visibility.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="https://chromewebstore.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-ink text-parchment font-sans font-medium text-[15px] tracking-tight hover:opacity-90 transition-opacity duration-150"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="4" />
                <line x1="21.17" y1="8" x2="12" y2="8" />
                <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
                <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
              </svg>
              Add to Chrome
            </a>
            <a
              href="https://github.com/tab-commander"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2 py-3.5 font-sans text-[15px] text-stone hover:text-ink transition-colors duration-150"
            >
              View source
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ——— Problem ——— */}
      <section className="max-w-2xl mx-auto px-6 pt-36 pb-24">
        <p
          className="font-serif text-ink tracking-tight"
          style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", lineHeight: 1.2 }}
        >
          You&rsquo;re running six agents.{" "}
          <span className="text-stone">You can&rsquo;t see any of them.</span>
        </p>
        <p className="mt-8 text-stone max-w-xl" style={{ fontSize: "clamp(1rem, 1.6vw, 1.125rem)", lineHeight: 1.7 }}>
          Every agent buries its output in a separate terminal tab. You
          alt-tab between them, lose context, miss errors. By the time you
          notice one agent stalled, three others went off the rails.
        </p>
      </section>

      {/* ——— The Grid ——— */}
      <section className="max-w-3xl mx-auto px-6 pb-32 w-full">
        <h2
          className="font-serif tracking-tight text-ink mb-12"
          style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", lineHeight: 1.15 }}
        >
          One window. Every agent.
        </h2>
        <div
          className="grid grid-cols-2 sm:grid-cols-4 border border-stone/15"
          style={{ gap: "1px", background: "oklch(0.5 0.02 70 / 0.15)" }}
        >
          {AGENTS.map((agent) => (
            <GridCell key={agent.name} {...agent} />
          ))}
        </div>
        <p className="mt-5 text-[13px] text-stone/60 font-sans tracking-wide">
          The 2&times;4 tmux grid — each pane runs a live agent session.
        </p>
      </section>

      {/* ——— Features ——— */}
      <section className="max-w-2xl mx-auto px-6 pb-32 w-full">
        <div className="flex flex-col gap-12">
          {FEATURES.map((feature, i) => (
            <div key={feature.title} className="flex gap-6 items-baseline">
              <span
                className="font-serif text-stone/30 select-none shrink-0"
                style={{ fontSize: "clamp(1.25rem, 2vw, 1.5rem)" }}
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-sans text-[17px] font-semibold text-ink tracking-tight">
                  {feature.title}
                </h3>
                <p className="mt-2 text-[15px] text-stone leading-relaxed max-w-md">
                  {feature.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ——— Install CTA ——— */}
      <section className="max-w-2xl mx-auto px-6 pb-24 w-full">
        <div className="border-t border-stone/15 pt-20">
          <h2
            className="font-serif tracking-tight text-ink"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", lineHeight: 1.15 }}
          >
            Start commanding.
          </h2>
          <p className="mt-4 text-[17px] text-stone leading-relaxed">
            Works with Claude Code. That&rsquo;s it.
          </p>

          <div className="mt-10 flex items-center gap-2 bg-parchment-dark border border-stone/15 px-5 py-3.5 w-fit max-w-full">
            <code className="font-mono text-[15px] text-ink truncate">
              npx tab-commander init
            </code>
            <CopyButton text="npx tab-commander init" />
          </div>

          <div className="mt-8">
            <a
              href="https://chromewebstore.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-ink text-parchment font-sans font-medium text-[15px] tracking-tight hover:opacity-90 transition-opacity duration-150"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="4" />
                <line x1="21.17" y1="8" x2="12" y2="8" />
                <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
                <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
              </svg>
              Add to Chrome
            </a>
          </div>
        </div>
      </section>

      {/* ——— Footer ——— */}
      <footer className="max-w-2xl mx-auto px-6 pb-16 w-full">
        <div className="border-t border-stone/15 pt-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <span className="font-serif text-[19px] text-ink">Tab Commander</span>
          <nav className="flex gap-8 text-[13px] text-stone" aria-label="Footer links">
            <a
              href="https://github.com/tab-commander"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink transition-colors duration-150"
            >
              GitHub
            </a>
            <a
              href="https://chromewebstore.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink transition-colors duration-150"
            >
              Chrome Web Store
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
