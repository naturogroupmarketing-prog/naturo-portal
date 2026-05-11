import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const marketingUrl = "https://trackio.au";
  const appUrl = "https://app.trackio.au";

  return [
    // Marketing pages (indexed under trackio.au)
    {
      url: `${marketingUrl}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${marketingUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${marketingUrl}/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    // App pages (lower priority, mostly gated)
    {
      url: `${appUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
