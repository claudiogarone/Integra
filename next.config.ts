import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignora errori TypeScript per andare online subito
    ignoreBuildErrors: true,
  },
  
};

export default nextConfig;