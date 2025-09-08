import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["@radix-ui/react-select"],
  eslint: {
    // ビルド時にESLintエラーを無視
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ビルド時にTypeScriptエラーを無視
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
