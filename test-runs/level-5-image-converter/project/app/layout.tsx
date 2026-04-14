import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: {
    default: "Convertify — Fast, Private Image Converter",
    template: "%s | Convertify",
  },
  description:
    "Convert images between PNG, JPG, and WebP instantly in your browser. No uploads, no servers — your images never leave your device.",
  openGraph: {
    title: "Convertify — Fast, Private Image Converter",
    description:
      "Convert images between PNG, JPG, and WebP instantly in your browser. No uploads, no servers — your images never leave your device.",
    type: "website",
    siteName: "Convertify",
    locale: "en_US",
    url: "https://convertify.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "Convertify — Fast, Private Image Converter",
    description:
      "Convert images between PNG, JPG, and WebP instantly in your browser. No uploads, no servers.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  metadataBase: new URL("https://convertify.app"),
  alternates: {
    canonical: "/",
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
