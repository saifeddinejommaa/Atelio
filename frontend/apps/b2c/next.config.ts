import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  // Monorepo : la racine est frontend/, pour embarquer @atelio/core.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: ["@atelio/core"],
};

export default nextConfig;
