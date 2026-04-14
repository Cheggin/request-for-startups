"use client";

import { useState } from "react";

interface CodeExamplesClientProps {
  examples: { label: string; code: string }[];
}

export function CodeExamplesClient({ examples }: CodeExamplesClientProps) {
  const [active, setActive] = useState(0);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex gap-1 rounded-t-lg border border-b-0 border-border bg-muted/50 p-1">
        {examples.map((ex, i) => (
          <button
            key={ex.label}
            onClick={() => setActive(i)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              active === i
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {ex.label}
          </button>
        ))}
      </div>
      <div className="overflow-auto rounded-b-lg border border-border bg-code-bg p-5">
        <pre className="font-mono text-sm leading-relaxed text-code-fg">
          <code>{examples[active].code}</code>
        </pre>
      </div>
    </div>
  );
}
