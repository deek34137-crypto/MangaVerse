import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ["@auth/core"],
  webpack: (config, { isServer }) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      preact: path.resolve("./node_modules/preact"),
      "preact/jsx-runtime": path.resolve("./node_modules/preact/jsx-runtime"),
      "preact-render-to-string": path.resolve("./node_modules/preact-render-to-string"),
    };
    return config;
  },
};

export default nextConfig;