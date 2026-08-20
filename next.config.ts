import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "mangahub-backend.deek34137.workers.dev" },
      { protocol: "https", hostname: "**.workers.dev" },
      { protocol: "https", hostname: "uploads.mangadex.org" },
      { protocol: "https", hostname: "s4.anilist.co" },
      { protocol: "https", hostname: "media.kitsu.app" },
      { protocol: "https", hostname: "media.kitsu.io" },
      { protocol: "https", hostname: "cdn.myanimelist.net" },
      { protocol: "https", hostname: "temp.compsci88.com" },
      { protocol: "https", hostname: "fmcdn.temp-data.link" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "**.googleapis.com" },
      { protocol: "https", hostname: "cdn.discordapp.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "http",  hostname: "localhost" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 768, 1024, 1280, 1536],
    imageSizes: [32, 64, 128, 256, 384],
    minimumCacheTTL: 86400,
    qualities: [60, 75, 80, 90],
    localPatterns: [
      {
        pathname: "/api/image",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons", "framer-motion"],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ["@auth/core"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com https://challenges.cloudflare.com https://*.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https: wss:; frame-src 'self' https:;",
          },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;