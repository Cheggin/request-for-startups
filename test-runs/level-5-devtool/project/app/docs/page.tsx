import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation — json2ts",
  description: "Learn how to install and use json2ts to convert JSON to TypeScript types.",
};

const CLI_FLAGS = [
  { flag: "--output", short: "-o", defaultVal: "stdout", description: "Write to file instead of stdout" },
  { flag: "--name", short: "-n", defaultVal: "Root", description: "Name of the root type" },
  { flag: "--type", short: "-t", defaultVal: "interface", description: "Output style: interface or type" },
  { flag: "--export", short: "-e", defaultVal: "true", description: "Add export keyword" },
  { flag: "--optional", short: "", defaultVal: "false", description: "Mark all properties as optional" },
  { flag: "--readonly", short: "", defaultVal: "false", description: "Mark all properties as readonly" },
  { flag: "--clipboard", short: "-c", defaultVal: "false", description: "Read JSON from system clipboard" },
];

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-bold">Documentation</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Everything you need to convert JSON to TypeScript types.
      </p>

      {/* Getting Started */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold" id="getting-started">Getting Started</h2>
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold">Installation</h3>
          <CodeBlock title="Install globally via npm">
            npm install -g json2ts
          </CodeBlock>

          <h3 className="mt-8 text-lg font-semibold">Your first conversion</h3>
          <p className="text-muted-foreground">
            Create a JSON file and convert it to TypeScript:
          </p>
          <CodeBlock title="input.json">{`{
  "name": "Ada Lovelace",
  "age": 36,
  "email": "ada@example.com"
}`}</CodeBlock>
          <CodeBlock title="Terminal">{`$ json2ts input.json

export interface Root {
  name: string;
  age: number;
  email: string;
}`}</CodeBlock>
        </div>
      </section>

      {/* CLI Reference */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold" id="cli-reference">CLI Reference</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 pr-4 font-semibold">Flag</th>
                <th className="pb-3 pr-4 font-semibold">Short</th>
                <th className="pb-3 pr-4 font-semibold">Default</th>
                <th className="pb-3 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody>
              {CLI_FLAGS.map((f) => (
                <tr key={f.flag} className="border-b border-border/50">
                  <td className="py-3 pr-4 font-mono text-sm">{f.flag}</td>
                  <td className="py-3 pr-4 font-mono text-sm text-muted-foreground">{f.short || "—"}</td>
                  <td className="py-3 pr-4 font-mono text-sm text-muted-foreground">{f.defaultVal}</td>
                  <td className="py-3 text-sm text-muted-foreground">{f.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Usage Examples */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold" id="examples">Usage Examples</h2>
        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Pipe from curl</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Pipe any API response directly into json2ts:
            </p>
            <CodeBlock title="Terminal">
              curl -s https://api.github.com/users/octocat | json2ts --name GitHubUser
            </CodeBlock>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Output to file</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Write the generated types directly to a file:
            </p>
            <CodeBlock title="Terminal">
              json2ts input.json -o types.ts --name UserResponse
            </CodeBlock>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Type aliases instead of interfaces</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Use type aliases with the --type flag:
            </p>
            <CodeBlock title="Terminal">
              json2ts input.json --type type
            </CodeBlock>
          </div>
        </div>
      </section>

      {/* Programmatic Usage */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold" id="programmatic">Programmatic Usage</h2>
        <p className="mt-4 text-muted-foreground">
          Use the converter directly in your Node.js scripts:
        </p>
        <CodeBlock title="convert.ts">{`import { convert } from "json2ts";

const json = \`{
  "id": 1,
  "name": "Ada Lovelace",
  "roles": ["admin", "user"]
}\`;

const types = convert(json, {
  rootName: "User",
  style: "interface",
  exportKeyword: true,
});

console.log(types);
// export interface User {
//   id: number;
//   name: string;
//   roles: string[];
// }`}</CodeBlock>
      </section>

      {/* API Reference */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold" id="api">REST API</h2>
        <p className="mt-4 text-muted-foreground">
          Convert JSON to TypeScript via HTTP. Requires an API key from your dashboard.
        </p>
        <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-3">
            <span className="rounded bg-green-500/10 px-2 py-1 text-xs font-bold text-green-600">POST</span>
            <code className="font-mono text-sm">https://api.json2ts.dev/v1/convert</code>
          </div>
        </div>
        <CodeBlock title="Request">{`curl -X POST https://api.json2ts.dev/v1/convert \\
  -H "Authorization: Bearer j2t_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "json": "{\\"name\\": \\"Ada\\"}",
    "options": { "name": "User" }
  }'`}</CodeBlock>
        <CodeBlock title="Response">{`{
  "typescript": "export interface User {\\n  name: string;\\n}",
  "meta": {
    "types_generated": 1,
    "inference_time_ms": 2
  }
}`}</CodeBlock>
      </section>

      {/* Type Inference Rules */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold" id="type-inference">Type Inference Rules</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 pr-6 font-semibold">JSON Value</th>
                <th className="pb-3 font-semibold">TypeScript Type</th>
              </tr>
            </thead>
            <tbody className="font-mono text-sm">
              {[
                ['"hello"', "string"],
                ["42", "number"],
                ["true", "boolean"],
                ["null", "null"],
                ["[1, 2, 3]", "number[]"],
                ['["a", 1]', "(string | number)[]"],
                ["[]", "unknown[]"],
                ["{}", "Record<string, unknown>"],
                ["Nested object", "Named interface"],
                ["Array of objects", "Merged interface[]"],
              ].map(([json, ts]) => (
                <tr key={json} className="border-b border-border/50">
                  <td className="py-3 pr-6 text-muted-foreground">{json}</td>
                  <td className="py-3 text-accent">{ts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
          <h3 className="font-semibold">Optional field detection</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            When processing an array of objects, if a key appears in some objects but not all,
            it is marked as optional with the <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">?</code> modifier.
          </p>
        </div>
      </section>
    </div>
  );
}

function CodeBlock({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-border">
      {title && (
        <div className="border-b border-border bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
          {title}
        </div>
      )}
      <pre className="overflow-x-auto bg-code-bg p-4 font-mono text-sm leading-relaxed text-code-fg">
        <code>{children}</code>
      </pre>
    </div>
  );
}
