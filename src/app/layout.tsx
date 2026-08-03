import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "EchoFlow — Design presentations by talking",
  description:
    "Design beautiful, editable presentations by talking. Not another PowerPoint.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${sans.variable} min-h-full bg-zinc-100 font-[family-name:var(--font-body)] text-zinc-950 antialiased [--font-display:var(--font-body)]`}
      >
        {children}
      </body>
    </html>
  );
}
