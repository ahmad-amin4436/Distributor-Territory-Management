import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export only during production build; dev server needs route handlers for local API proxy
  ...(process.env.NODE_ENV === "production" ? { output: "export" } : {}),
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
