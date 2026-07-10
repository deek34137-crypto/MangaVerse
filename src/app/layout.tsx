import { Inter, Cal_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const calSans = Cal_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: {
    default: "MangaHub - Premium Manga Reading Platform",
    template: "%s | MangaHub",
  },
  description: "Read manga online with a premium, cinematic experience. Advanced search, immersive reader, library management, and personalized recommendations.",
  keywords: ["manga", "manhwa", "manhua", "read manga", "manga reader", "anime", "webtoon"],
  authors: [{ name: "MangaHub" }],
  creator: "MangaHub",
  publisher: "MangaHub",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mangahub.io",
    title: "MangaHub - Premium Manga Reading Platform",
    description: "Read manga online with a premium, cinematic experience.",
    siteName: "MangaHub",
  },
  twitter: {
    card: "summary_large_image",
    title: "MangaHub - Premium Manga Reading Platform",
    description: "Read manga online with a premium, cinematic experience.",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${inter.variable} ${calSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}