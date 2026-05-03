import type { Metadata, Viewport } from "next";
import { Inter, Exo } from "next/font/google";
import { PWARegister } from "@/components/pwa-register";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeProvider } from "@/components/theme-provider";
import { CookieConsent } from "@/components/privacy/cookie-consent";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
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
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/trackio_t_logo.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: SITE_URL,
    siteName: "trackio",
    title: "trackio — Asset & Supply Tracking for Operational Teams",
    description: "Know exactly what you have, where it is, and who has it. The all-in-one tracking platform built for operational teams.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "trackio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "trackio — Asset & Supply Tracking for Operational Teams",
    description: "Know exactly what you have, where it is, and who has it. The all-in-one tracking platform built for operational teams.",
    images: ["/og-image.png"],
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

// Viewport is exported separately — Next.js merges this into a single
// <meta name="viewport"> tag. Having it here AND manually in <head>
// creates duplicates that cause mobile browsers to ignore device-width.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/trackio_t_logo.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#f5f5f5" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              // Dark mode is only for the app — not the marketing site
              if (window.location.pathname.indexOf('/welcome') === 0) return;
              var theme = localStorage.getItem('trackio-theme');
              if (theme === 'dark') {
                document.documentElement.classList.add('dark');
              }
            } catch(e) {}
          })();
        ` }} />
        {/* Capture PWA install event as early as possible — before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html: `
          window.addEventListener('beforeinstallprompt', function(e) {
            e.preventDefault();
            window.__pwaPrompt = e;
          });
        ` }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "trackio",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description: "Asset and consumable tracking platform built for operational teams across Australia.",
              url: SITE_URL,
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "AUD",
              },
              creator: {
                "@type": "Organization",
                name: "trackio",
                url: SITE_URL,
              },
            }),
          }}
        />
      </head>
      <body className={`${inter.className} ${exo.variable} antialiased`}>
        {/* Portrait-only overlay — hidden in CSS, shown via @media landscape on phones */}
        <div id="rotate-notice" aria-live="polite">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
          </svg>
          <p style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}>Please rotate your device</p>
          <p style={{ fontSize: "0.875rem", opacity: 0.55, margin: 0 }}>trackio works in portrait mode</p>
        </div>
        <ThemeProvider>
          <ToastProvider>
            <PWARegister />
            <OfflineIndicator />
            {children}
            <CookieConsent />
            <Analytics />
            <SpeedInsights />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
