import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Convertify — Fast, Private Image Converter",
  description:
    "Convert images between PNG, JPG, and WebP instantly in your browser. No uploads, no servers — your images never leave your device.",
  openGraph: {
    title: "Convertify — Fast, Private Image Converter",
    description:
      "Convert images between PNG, JPG, and WebP instantly in your browser.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
