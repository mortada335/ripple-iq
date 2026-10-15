import type { MetadataRoute } from "next";

// This is an interactive demo dashboard, not a public content site.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
