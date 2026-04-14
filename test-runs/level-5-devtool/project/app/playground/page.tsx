import type { Metadata } from "next";
import { PlaygroundClient } from "@/components/playground/playground-client";

export const metadata: Metadata = {
  title: "Playground — json2ts",
  description: "Paste JSON and get TypeScript types instantly. No server calls, runs entirely in your browser.",
};

export default function PlaygroundPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-border bg-muted/30 px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-xl font-bold">Playground</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste JSON on the left, get TypeScript types on the right. Everything runs locally in your browser.
          </p>
        </div>
      </div>
      <PlaygroundClient />
    </div>
  );
}
