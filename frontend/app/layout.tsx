import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://rippleiq.org"),
  title: {
    default: "RippleIQ — Decision Impact Analysis",
    template: "%s | RippleIQ",
  },
  description:
    "Explore how organizational decisions may affect people, operations, and resources before acting.",
  applicationName: "RippleIQ",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: "RippleIQ",
    title: "RippleIQ — Decision Impact Analysis",
    description:
      "Explore how organizational decisions may affect people, operations, and resources before acting.",
  },
  twitter: {
    card: "summary_large_image",
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
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <ThemeProvider>
          <Toaster position="top-right" richColors closeButton />
          <AuthProvider>
            <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
              <AppShell>{children}</AppShell>
            </Suspense>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
