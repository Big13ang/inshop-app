import type { NextConfig } from "next";
import "./env.ts";

const nextConfig: NextConfig = {
  cacheComponents: true,
  reactCompiler: true,
};

export default nextConfig;
