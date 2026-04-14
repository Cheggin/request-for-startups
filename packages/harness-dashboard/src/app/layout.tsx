import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { StartupSwitcher } from "@/components/layout/startup-switcher";
import { AgentPanel } from "@/components/agents/agent-panel";
import { CurrentDate } from "@/components/layout/current-date";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Harness Dashboard",
  description: "Founder command center — agents, growth, competitors, deploy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full flex">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0 h-full">
          <header className="flex items-center justify-between px-6 py-2.5 border-b border-border bg-surface shrink-0">
            <StartupSwitcher />
            <CurrentDate />
          </header>

          <main className="flex-1 overflow-y-auto">
            {children}
          </main>

          <AgentPanel />
        </div>
      </body>
    </html>
  );
}
