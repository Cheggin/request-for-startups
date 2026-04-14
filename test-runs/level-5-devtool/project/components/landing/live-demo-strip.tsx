"use client";

import { useState, useCallback } from "react";
import { convert } from "@/lib/json-to-ts";

const DEFAULT_JSON = `{
  "name": "Ada Lovelace",
  "age": 36,
  "email": "ada@example.com",
  "languages": ["TypeScript", "Rust"]
}`;

export function LiveDemoStrip() {
  const [input, setInput] = useState(DEFAULT_JSON);
  const [output, setOutput] = useState(() => {
    try {
      return convert(DEFAULT_JSON);
    } catch {
      return "";
    }
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback((value: string) => {
    setInput(value);
    try {
      const result = convert(value);
      setOutput(result);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div>
        <label className="mb-2 block text-sm font-medium text-muted-foreground">JSON Input</label>
        <textarea
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          className="h-48 w-full resize-none rounded-lg border border-border bg-code-bg p-4 font-mono text-sm text-code-fg outline-none focus:ring-2 focus:ring-accent/50"
          spellCheck={false}
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-muted-foreground">TypeScript Output</label>
        <div className="relative h-48 overflow-auto rounded-lg border border-border bg-code-bg p-4">
          {error ? (
            <p className="font-mono text-sm text-red-400">{error}</p>
          ) : (
            <pre className="font-mono text-sm text-code-fg">
              <code>{output}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
