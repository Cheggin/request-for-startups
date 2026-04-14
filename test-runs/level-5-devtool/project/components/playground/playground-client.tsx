"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { convert } from "@/lib/json-to-ts";
import type { ConvertOptions } from "@/lib/json-to-ts";

const EXAMPLES: Record<string, string> = {
  "GitHub User": JSON.stringify(
    {
      login: "octocat",
      id: 1,
      avatar_url: "https://avatars.githubusercontent.com/u/1",
      type: "User",
      site_admin: false,
      name: "The Octocat",
      company: "@github",
      blog: "https://github.blog",
      location: "San Francisco",
      email: null,
      bio: "Octocat is a cat.",
      public_repos: 8,
      followers: 10000,
      following: 9,
      created_at: "2011-01-25T18:44:36Z",
    },
    null,
    2
  ),
  "Stripe Invoice": JSON.stringify(
    {
      id: "in_1234",
      object: "invoice",
      amount_due: 2500,
      currency: "usd",
      customer: "cus_abc",
      lines: {
        data: [
          {
            id: "il_1",
            amount: 2500,
            description: "Pro plan",
            quantity: 1,
          },
        ],
        has_more: false,
      },
      status: "paid",
      created: 1234567890,
    },
    null,
    2
  ),
  "Simple Array": JSON.stringify(
    {
      users: [
        { name: "Alice", age: 30, email: "alice@test.com" },
        { name: "Bob", age: 25 },
        { name: "Charlie", age: 35, email: "charlie@test.com" },
      ],
    },
    null,
    2
  ),
};

const DEFAULT_JSON = EXAMPLES["GitHub User"];

export function PlaygroundClient() {
  const [input, setInput] = useState(DEFAULT_JSON);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [options, setOptions] = useState<ConvertOptions>({
    rootName: "Root",
    style: "interface",
    exportKeyword: true,
    readonly: false,
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const doConvert = useCallback(
    (json: string, opts: ConvertOptions) => {
      try {
        const result = convert(json, opts);
        setOutput(result);
        setError(null);
      } catch (e) {
        setError((e as Error).message);
      }
    },
    []
  );

  useEffect(() => {
    doConvert(input, options);
  }, [options, doConvert, input]);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      try {
        const decoded = decodeURIComponent(hash);
        setInput(decoded);
      } catch {
        // ignore bad hash
      }
    }
  }, []);

  const handleInputChange = (value: string) => {
    setInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doConvert(value, options);
    }, 150);
  };

  const copyOutput = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = () => {
    const url = `${window.location.origin}/playground#${encodeURIComponent(input)}`;
    navigator.clipboard.writeText(url);
    alert("Shareable URL copied to clipboard!");
  };

  const loadExample = (name: string) => {
    const json = EXAMPLES[name];
    setInput(json);
    doConvert(json, options);
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Options Bar */}
      <div className="border-b border-border bg-background px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Root name:</span>
            <input
              type="text"
              value={options.rootName}
              onChange={(e) => setOptions({ ...options, rootName: e.target.value || "Root" })}
              className="h-8 w-28 rounded border border-border bg-muted px-2 text-sm outline-none focus:ring-2 focus:ring-accent/50"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Style:</span>
            <select
              value={options.style}
              onChange={(e) => setOptions({ ...options, style: e.target.value as "interface" | "type" })}
              className="h-8 rounded border border-border bg-muted px-2 text-sm outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="interface">interface</option>
              <option value="type">type</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={options.exportKeyword}
              onChange={(e) => setOptions({ ...options, exportKeyword: e.target.checked })}
              className="rounded"
            />
            <span className="text-muted-foreground">export</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={options.readonly}
              onChange={(e) => setOptions({ ...options, readonly: e.target.checked })}
              className="rounded"
            />
            <span className="text-muted-foreground">readonly</span>
          </label>
          <div className="ml-auto flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Examples:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) loadExample(e.target.value);
                }}
                className="h-8 rounded border border-border bg-muted px-2 text-sm outline-none focus:ring-2 focus:ring-accent/50"
                defaultValue=""
              >
                <option value="" disabled>
                  Select...
                </option>
                {Object.keys(EXAMPLES).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* Editor Panels */}
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-0 sm:flex-row">
        {/* JSON Input */}
        <div className="flex flex-1 flex-col border-r border-border">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <span className="text-xs font-medium text-muted-foreground">JSON</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            className="flex-1 resize-none bg-code-bg p-4 font-mono text-sm text-code-fg outline-none"
            spellCheck={false}
            placeholder="Paste your JSON here..."
          />
        </div>

        {/* TypeScript Output */}
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <span className="text-xs font-medium text-muted-foreground">TypeScript</span>
            <div className="flex gap-2">
              <button
                onClick={share}
                className="rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Share
              </button>
              <button
                onClick={copyOutput}
                className="rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-code-bg p-4">
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
    </div>
  );
}
