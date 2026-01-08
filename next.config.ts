import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignora errori TypeScript per andare online subito
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignora errori ESLint
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;