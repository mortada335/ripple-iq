import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { WorkspaceShellSkeleton } from "@/components/LoadingSkeleton";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

import { LocaleProvider } from "@/components/LocaleProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-arabic",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
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
    <html lang="en" className={`${inter.variable} ${cairo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <ThemeProvider>
          <LocaleProvider>
            <Toaster position="top-right" richColors closeButton />
            <AuthProvider>
              <Suspense fallback={<WorkspaceShellSkeleton />}>
                <AppShell>{children}</AppShell>
              </Suspense>
            </AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
