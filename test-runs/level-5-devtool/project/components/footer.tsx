import Link from "next/link";

const FOOTER_LINKS = {
  Product: [
    { href: "/playground", label: "Playground" },
    { href: "/docs", label: "Documentation" },
    { href: "/pricing", label: "Pricing" },
  ],
  Resources: [
    { href: "/docs", label: "Getting Started" },
    { href: "/docs", label: "CLI Reference" },
    { href: "/docs", label: "API Reference" },
  ],
  Links: [
    { href: "https://github.com/json2ts/json2ts", label: "GitHub", external: true },
    { href: "https://www.npmjs.com/package/json2ts", label: "npm", external: true },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="font-mono text-lg font-bold tracking-tight">
              <span className="text-accent">{"{ }"}</span> json2ts
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Convert JSON to TypeScript types instantly. CLI, playground, and API.
            </p>
          </div>
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="text-sm font-semibold">{heading}</h3>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    {"external" in link ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} json2ts. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
