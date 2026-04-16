import type { Metadata } from "next";
import { Geist, Geist_Mono, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { CurrentDate } from "@/components/layout/current-date";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
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
      className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} h-full antialiased`}
    >
      <body className="h-full flex">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0 h-full">
          <header className="flex items-center justify-end px-6 py-2 border-b border-border-subtle bg-surface shrink-0">
            <CurrentDate />
          </header>

          <main className="flex-1 overflow-y-auto bg-bg">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
