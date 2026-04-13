import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Trackio — Asset & Consumable Tracker",
    short_name: "Trackio",
    description: "Internal asset and consumable management portal",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    orientation: "any",
    icons: [
      {
        src: "/trackio_t_logo.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/trackio_t_logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
