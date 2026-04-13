import type { Metadata } from "next";
import { Inter, Exo } from "next/font/google";
import { PWARegister } from "@/components/pwa-register";
import { ToastProvider } from "@/components/ui/toast";
import { CookieConsent } from "@/components/privacy/cookie-consent";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { SplashScreen } from "@/components/splash-screen";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const exo = Exo({ subsets: ["latin"], variable: "--font-exo", weight: ["300", "400", "500", "600", "700", "800"] });

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.trackio.au";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "trackio — Asset & Supply Tracking for Operational Teams",
    template: "%s | trackio",
  },
  description: "Know exactly what you have, where it is, and who has it. trackio is the all-in-one asset and consumable tracking platform built for operational teams across Australia.",
  keywords: ["asset tracking", "inventory management", "consumable tracking", "equipment tracking", "supply tracking", "asset management software", "operational teams", "Australia"],
  authors: [{ name: "trackio" }],
  creator: "trackio",
  publisher: "trackio",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/trackio_t_logo.svg", type: "image/svg+xml" },
    ],
    apple: "/trackio_t_logo.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: SITE_URL,
    siteName: "trackio",
    title: "trackio — Asset & Supply Tracking for Operational Teams",
    description: "Know exactly what you have, where it is, and who has it. The all-in-one tracking platform built for operational teams.",
    images: [{ url: "/trackio_t_full_logo.svg", width: 1200, height: 630, alt: "trackio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "trackio — Asset & Supply Tracking for Operational Teams",
    description: "Know exactly what you have, where it is, and who has it. The all-in-one tracking platform built for operational teams.",
    images: ["/trackio_t_full_logo.svg"],
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
  alternates: {
    canonical: SITE_URL,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "trackio",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/trackio_t_logo.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/trackio_t_logo.svg" />
        <meta name="theme-color" content="#f5f5f5" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className={`${inter.className} ${exo.variable} antialiased`}>
        <SplashScreen />
        <ToastProvider>
          <PWARegister />
          <OfflineIndicator />
          {children}
          <CookieConsent />
          <Analytics />
          <SpeedInsights />
        </ToastProvider>
      </body>
    </html>
  );
}
