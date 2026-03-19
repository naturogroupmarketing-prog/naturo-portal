import type { Metadata } from "next";
import { Inter, Exo } from "next/font/google";
import { PWARegister } from "@/components/pwa-register";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const exo = Exo({ subsets: ["latin"], variable: "--font-exo", weight: ["600", "700", "800"] });

export const metadata: Metadata = {
  title: "Trackio",
  description: "Asset & Consumable Tracker - Internal management portal",
  manifest: "/manifest.webmanifest",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0f172a" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            const t = localStorage.getItem('trackio-theme');
            if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
              document.documentElement.classList.add('dark');
            }
          } catch(e) {}
        `}} />
      </head>
      <body className={`${inter.className} ${exo.variable} antialiased bg-shark-50 text-shark-900 dark:bg-shark-950 dark:text-shark-100 transition-colors`}>
        <ThemeProvider>
          <ToastProvider>
            <PWARegister />
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
