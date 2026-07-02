import type { NextConfig } from "next";
import "./env.ts";

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  reactCompiler: true,
};

export default nextConfig;
