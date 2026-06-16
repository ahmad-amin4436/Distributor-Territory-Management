import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export only on Netlify; local next build and next dev both need
  // route handlers to work (the dev proxy at /api/proxy/[...path]).
  // Netlify injects NETLIFY=true automatically in its build environment.
  ...(process.env.NETLIFY ? { output: "export" } : {}),
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
