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
import { StructuredData } from "@/components/StructuredData";

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
    default: "RippleIQ — ذكاء القرارات المؤسسية ومحاكاة الأثر | Decision Impact Analysis",
    template: "%s | RippleIQ",
  },
  description:
    "منظومة رائدة لذكاء القرارات المؤسسية، تحاكي الآثار التتابعية غير المرئية (Second-Order Ripples)، المقايضات المالية، واحتكاك أصحاب المصلحة قبل تنفيذ السياسات الاستراتيجية.",
  applicationName: "RippleIQ",
  keywords: [
    "Decision Intelligence",
    "ذكاء القرارات المؤسسية",
    "محاكاة أثر القرارات",
    "Second-Order Ripple Effect",
    "Enterprise Decision Support",
    "Monte Carlo Simulation",
    "حوكمة المؤسسات",
    "تحليل المخاطر الاستراتيجية",
    "ركائز الحوكمة الأربع",
    "نمذجة السياسات الأكاديمية والحكومية",
    "AI Governance Platform",
    "RippleIQ",
  ],
  authors: [{ name: "RippleIQ Research & Governance Team", url: "https://rippleiq.org" }],
  creator: "RippleIQ Intelligence",
  publisher: "RippleIQ Intelligence Inc.",
  category: "Enterprise Decision Support",
  alternates: {
    canonical: "/",
    languages: {
      "ar-IQ": "/",
      "ar-SA": "/",
      "en-US": "/",
    },
  },
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
    title: "RippleIQ — ذكاء القرارات ومحاكاة الأثر التتابعي | Decision Impact Analysis",
    description:
      "Explore how strategic and operational decisions impact stakeholders, resources, and institutional trust before execution.",
    url: "https://rippleiq.org",
    locale: "ar_IQ",
    alternateLocale: ["ar_SA", "en_US"],
  },
  twitter: {
    card: "summary_large_image",
    title: "RippleIQ — Decision Impact Analysis",
    description:
      "Simulate second-order consequences, stakeholder trade-offs, and multi-scenario risks before enacting institutional policies.",
    site: "@RippleIQ",
    creator: "@RippleIQ",
  },
};

import { cookies } from "next/headers";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("rippleiq_theme")?.value;
  const localeCookie = (cookieStore.get("rippleiq_locale")?.value || "ar") as "ar" | "en";
  const isDark = themeCookie !== "light"; // Default to dark obsidian mode

  return (
    <html
      lang={localeCookie}
      dir={localeCookie === "ar" ? "rtl" : "ltr"}
      className={`${inter.variable} ${cairo.variable} h-full antialiased ${isDark ? "dark" : ""}`}
      style={{
        colorScheme: isDark ? "dark" : "light",
        backgroundColor: isDark ? "#0b0d13" : "#f8fafc",
      }}
      suppressHydrationWarning
    >
      <head>
        <StructuredData />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=document.cookie.match(/rippleiq_theme=([^;]+)/);var t=m?decodeURIComponent(m[1].trim()):localStorage.getItem('rippleiq_theme');var d=t==='dark'||(t!=='light');if(d){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';document.documentElement.style.backgroundColor='#0b0d13';}else{document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme='light';document.documentElement.style.backgroundColor='#f8fafc';}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <ThemeProvider initialTheme={isDark ? "dark" : "light"}>
          <LocaleProvider initialLocale={localeCookie}>
            <Toaster position="top-right" richColors closeButton />
            <AuthProvider>
              <AppShell>{children}</AppShell>
            </AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
