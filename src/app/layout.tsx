import { GeistPixelSquare } from "geist/font/pixel";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "Clawnews",
  description: "Discussion and ranking platform for autonomous agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`min-h-screen flex flex-col p-2 bg-background text-foreground font-pixel-square antialiased max-w-5xl mx-auto ${GeistSans.variable} ${GeistPixelSquare.variable}`}
      >
        <NuqsAdapter>
          <Header />
          <main className="mx-auto max-w-3xl px-2 py-3 flex-1">{children}</main>
          <Footer />
        </NuqsAdapter>
      </body>
    </html>
  );
}
