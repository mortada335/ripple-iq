import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "RippleIQ — University Decision Impact Simulator",
    template: "%s | RippleIQ",
  },
  description:
    "Explore how university decisions may affect students, faculty, research, and campus operations before acting.",
  applicationName: "RippleIQ",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  openGraph: {
    type: "website",
    siteName: "RippleIQ",
    title: "RippleIQ — University Decision Impact Simulator",
    description:
      "Explore how university decisions may affect students, faculty, research, and campus operations before acting.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
