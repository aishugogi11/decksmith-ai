import type { Metadata } from "next";
import { Syne, Figtree } from "next/font/google";
import "./globals.css";

const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Figtree({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lumen — Know where to go",
  description:
    "AI place discovery that ranks cafés and restaurants by vibe, parking, travel time, and what you actually care about.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full font-[family-name:var(--font-body)] text-slate-900">
        {children}
      </body>
    </html>
  );
}
