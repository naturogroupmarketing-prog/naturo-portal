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

export const metadata: Metadata = {
  title: "Trackio",
  description: "Asset & Consumable Tracker - Internal management portal",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/trackio_t_logo.svg", type: "image/svg+xml" },
    ],
    apple: "/trackio_t_logo.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Trackio",
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
