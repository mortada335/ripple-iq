import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rippleiq.org";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/dashboard", "/decisions", "/settings", "/onboarding", "/api/"] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
