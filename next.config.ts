import type { NextConfig } from "next";
import os from "os";
import { withSentryConfig } from "@sentry/nextjs";
import "./env";

const getLocalIPs = () => {
  const interfaces = os.networkInterfaces();
  const ips: string[] = ['localhost', '127.0.0.1', os.hostname(), `${os.hostname()}.local`];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4') {
        ips.push(net.address);
        ips.push(`${net.address}:4000`);
      }
    }
  }
  return Array.from(new Set(ips));
};

const nextConfig: NextConfig = {
  output: "standalone",
  productionBrowserSourceMaps: true,
  cacheComponents: true,
  reactCompiler: true,
  partialPrefetching: true,
  experimental: {
    useTypeScriptCli: true,
    turbopackRustReactCompiler: true,
  },
  allowedDevOrigins: getLocalIPs(),
  images: {
    qualities: [75, 100]
  }
};

export default withSentryConfig(nextConfig, {
  silent: true,
});

