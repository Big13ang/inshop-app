import type { NextConfig } from "next";
import os from "os";
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
  cacheComponents: true,
  reactCompiler: true,
  partialPrefetching: true,
  experimental: {
    useTypeScriptCli: true,
    turbopackRustReactCompiler: true,
  },
  allowedDevOrigins: getLocalIPs(),
  async redirects() {
    return [
      {
        source: '/',
        destination: '/app/profile',
        permanent: false,
      },
    ];
  },
  images: {
    qualities: [75, 100]
  }
};

export default nextConfig;
