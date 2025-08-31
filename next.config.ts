import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["gomanga-api.vercel.app"],
    unoptimized: true,
  },
};

export default nextConfig;
