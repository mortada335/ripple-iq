import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "RippleIQ — Decision Impact Analysis",
    template: "%s | RippleIQ",
  },
  description:
    "Explore how organizational decisions may affect people, operations, and resources before acting.",
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
    title: "RippleIQ — Decision Impact Analysis",
    description:
      "Explore how organizational decisions may affect people, operations, and resources before acting.",
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
        <Toaster position="top-right" richColors closeButton />
        <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
