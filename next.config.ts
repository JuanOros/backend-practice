import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 'standalone' mode traces and bundles only the files needed to run the app.
  // This makes Docker images significantly smaller (no full node_modules/).
  // Required for the Dockerfile to work correctly.
  output: 'standalone',
};

export default nextConfig;
