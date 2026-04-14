import Link from "next/link";
import { LiveDemoStrip } from "@/components/landing/live-demo-strip";
import { InstallCommand } from "@/components/landing/install-command";

const FEATURES = [
  {
    title: "Pipe-friendly",
    description: "Works with stdin. Pipe curl responses directly into json2ts.",
    icon: "│",
  },
  {
    title: "Smart type inference",
    description: "Detects unions, optionals, and nullable fields automatically.",
    icon: "◇",
  },
  {
    title: "Nested objects",
    description: "Recursively extracts named interfaces for every nested object.",
    icon: "{}",
  },
  {
    title: "Zero config",
    description: "Works out of the box. No config files, no setup, just run it.",
    icon: "→",
  },
  {
    title: "Programmatic API",
    description: "Import convert() and use it in your scripts and build tools.",
    icon: "fn",
  },
  {
    title: "Blazing fast",
    description: "Pure local conversion. No network calls, no waiting.",
    icon: "⚡",
  },
];

const COMPARISON = [
  { tool: "json2ts", cli: true, optionals: true, mixed: true, maintained: true, size: "12KB" },
  { tool: "quicktype", cli: true, optionals: false, mixed: true, maintained: true, size: "2.4MB" },
  { tool: "json-to-ts", cli: false, optionals: false, mixed: false, maintained: false, size: "45KB" },
  { tool: "Manual", cli: false, optionals: false, mixed: false, maintained: false, size: "—" },
];

const CODE_EXAMPLES = [
  {
    label: "File conversion",
    code: `$ cat user.json
{
  "name": "Ada Lovelace",
  "age": 36,
  "languages": ["TypeScript", "Rust"]
}

$ json2ts user.json

export interface Root {
  name: string;
  age: number;
  languages: string[];
}`,
  },
  {
    label: "Pipe from curl",
    code: `$ curl -s https://api.github.com/users/octocat | json2ts --name GitHubUser

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  url: string;
  // ... all fields inferred
}`,
  },
  {
    label: "Programmatic usage",
    code: `import { convert } from "json2ts";

const json = '{"name": "Ada", "age": 36}';
const types = convert(json, { rootName: "User" });

console.log(types);
// export interface User {
//   name: string;
//   age: number;
// }`,
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              JSON to TypeScript
              <br />
              <span className="text-accent">in one command</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Paste JSON, get TypeScript types. Works as a CLI, in the browser, or as a library.
              Smart inference handles nested objects, optional fields, and union types.
            </p>
            <div className="mt-8">
              <InstallCommand />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/playground"
                className="inline-flex h-11 items-center rounded-lg bg-accent px-6 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
              >
                Try the Playground
              </Link>
              <a
                href="https://github.com/json2ts/json2ts"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center rounded-lg border border-border px-6 text-sm font-medium transition-colors hover:bg-muted"
              >
                Star on GitHub
              </a>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-code-bg p-5 font-mono text-sm text-code-fg shadow-2xl">
            <div className="mb-3 flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-500/70" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <span className="h-3 w-3 rounded-full bg-green-500/70" />
            </div>
            <pre className="overflow-x-auto leading-relaxed">
              <code>{`$ curl -s api.example.com/user | json2ts

export interface Root {
  id: number;
  name: string;
  email: string;
  address: Address;
  roles: string[];
}

export interface Address {
  street: string;
  city: string;
  zip: string;
}`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Live Demo Strip */}
      <section className="border-y border-border bg-muted/30 py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="mb-8 text-center text-2xl font-bold">Try it live</h2>
          <LiveDemoStrip />
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="mb-12 text-center text-3xl font-bold">Built for developer workflows</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border p-6 transition-colors hover:bg-muted/50"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 font-mono text-sm font-bold text-accent">
                {feature.icon}
              </div>
              <h3 className="mb-2 font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="border-y border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="mb-10 text-center text-3xl font-bold">How we compare</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 pr-6 font-semibold">Tool</th>
                  <th className="pb-3 pr-6 font-semibold">CLI</th>
                  <th className="pb-3 pr-6 font-semibold">Optionals</th>
                  <th className="pb-3 pr-6 font-semibold">Mixed Arrays</th>
                  <th className="pb-3 pr-6 font-semibold">Maintained</th>
                  <th className="pb-3 font-semibold">Size</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.tool} className="border-b border-border/50">
                    <td className="py-3 pr-6 font-medium">{row.tool}</td>
                    <td className="py-3 pr-6">{row.cli ? "✓" : "—"}</td>
                    <td className="py-3 pr-6">{row.optionals ? "✓" : "—"}</td>
                    <td className="py-3 pr-6">{row.mixed ? "✓" : "—"}</td>
                    <td className="py-3 pr-6">{row.maintained ? "✓" : "—"}</td>
                    <td className="py-3">{row.size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Code Examples */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="mb-10 text-center text-3xl font-bold">See it in action</h2>
        <CodeExamples examples={CODE_EXAMPLES} />
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold">Ready to stop writing types by hand?</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Try the playground or install the CLI in seconds.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/playground"
              className="inline-flex h-12 items-center rounded-lg bg-accent px-8 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
            >
              Try the Playground
            </Link>
            <a
              href="https://github.com/json2ts/json2ts"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center rounded-lg border border-border px-8 text-sm font-medium transition-colors hover:bg-muted"
            >
              Star on GitHub
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function CodeExamples({ examples }: { examples: { label: string; code: string }[] }) {
  return <CodeExamplesClient examples={examples} />;
}

import { CodeExamplesClient } from "@/components/landing/code-examples-client";
