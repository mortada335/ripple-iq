import type { MetadataRoute } from "next";

/**
 * Enhanced robots.txt optimized for standard search engines (Google, Bing)
 * and Generative AI Search Engines (Perplexity, ChatGPT, Claude, Gemini, Copilot).
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://ripple-iq.vercel.app");

  return {
    rules: [
      // Standard search engine crawlers
      {
        userAgent: "*",
        allow: ["/", "/login", "/register", "/onboarding", "/llms.txt", "/llms-full.txt"],
        disallow: ["/api/", "/dashboard", "/decisions/*", "/settings"],
      },
      // OpenAI / ChatGPT search crawler
      {
        userAgent: ["GPTBot", "ChatGPT-User"],
        allow: ["/", "/llms.txt", "/llms-full.txt", "/onboarding", "/login", "/register"],
        disallow: ["/api/", "/dashboard", "/decisions/*", "/settings"],
      },
      // Perplexity AI search crawler
      {
        userAgent: "PerplexityBot",
        allow: ["/", "/llms.txt", "/llms-full.txt", "/onboarding"],
        disallow: ["/api/", "/dashboard", "/decisions/*", "/settings"],
      },
      // Anthropic Claude search crawler
      {
        userAgent: ["ClaudeBot", "anthropic-ai"],
        allow: ["/", "/llms.txt", "/llms-full.txt", "/onboarding"],
        disallow: ["/api/", "/dashboard", "/decisions/*", "/settings"],
      },
      // Google Gemini / Extended AI training & search
      {
        userAgent: "Google-Extended",
        allow: ["/", "/llms.txt", "/llms-full.txt"],
        disallow: ["/api/", "/dashboard", "/decisions/*", "/settings"],
      },
      // Apple Intelligence & Siri
      {
        userAgent: "Applebot-Extended",
        allow: ["/", "/llms.txt", "/llms-full.txt"],
        disallow: ["/api/", "/dashboard", "/decisions/*", "/settings"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
