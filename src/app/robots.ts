import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/privacy-policy", "/terms-of-service"],
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
          "/set-password",
          "/setup",
        ],
      },
    ],
    sitemap: "https://trackio.au/sitemap.xml",
  };
}
