import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.trackio.au";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/welcome", "/privacy-policy", "/terms-of-service"],
        disallow: [
          "/dashboard",
          "/admin",
          "/inventory",
          "/assets",
          "/consumables",
          "/staff",
          "/my-assets",
          "/my-consumables",
          "/settings",
          "/api",
          "/login",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
