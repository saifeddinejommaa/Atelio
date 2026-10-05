import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // core est livré en TypeScript : Next le compile avec l'application.
  transpilePackages: ["@atelio/core"],
};

export default nextConfig;
