import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PulseCheck — Weekly Team Pulse Surveys",
  description: "Lightweight pulse surveys for frontline managers. Anonymous feedback, trend analytics, and actionable insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
