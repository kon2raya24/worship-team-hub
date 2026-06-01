import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://worship-team-hub.vercel.app";
const SITE_DESCRIPTION =
  "Chord charts, setlists, schedule, and devotions for the worship team — offline-ready and on every device.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Worship Hub",
    template: "%s · Worship Hub",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Worship Hub",
  keywords: [
    "worship team",
    "chord charts",
    "setlists",
    "worship schedule",
    "song library",
    "church worship",
    "devotions",
  ],
  authors: [{ name: "Worship Hub" }],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Worship Hub",
    statusBarStyle: "black-translucent",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "Worship Hub",
    title: "Worship Hub",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "Worship Hub",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Worship Hub",
    description: SITE_DESCRIPTION,
    images: ["/icons/icon-512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#070a17" },
  ],
  width: "device-width",
  initialScale: 1,
  // Allow pinch-zoom (accessibility) but keep it conservative so accidental
  // multi-touch during auto-scroll on a chord chart doesn't zoom 5×.
  maximumScale: 2,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          {children}
          <PwaRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
