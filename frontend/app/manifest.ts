import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RippleIQ — Decision Intelligence Platform",
    short_name: "RippleIQ",
    description: "Enterprise decision simulation and second-order ripple effect analysis for institutions.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#030712",
    theme_color: "#4f46e5",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
