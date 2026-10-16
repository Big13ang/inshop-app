import type { NextConfig } from "next";
import os from "node:os";
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
  // Tags assets with ?dpl=<id> and forces a full reload when a client from an older
  // deploy navigates to a newer server. Unset locally, where it is a no-op.
  deploymentId: process.env.NEXT_DEPLOYMENT_ID || undefined,
  productionBrowserSourceMaps: true,
  cacheComponents: true,
  reactCompiler: true,
  partialPrefetching: true,
  experimental: {
    useTypeScriptCli: true,
    turbopackRustReactCompiler: true,
    // Required because app/(main) and app/(campaign) are separate root layouts.
    globalNotFound: true,
  },
  allowedDevOrigins: getLocalIPs(),
  images: {
    qualities: [75, 100]
  },
  async headers() {
    return [
      {
        source: '/favicon/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate, max-age=0' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      {
        source: '/manifest.webmanifest',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
        ],
      },
      {
        // Page HTML names this build's hashed /_next/static chunks, which the next deploy
        // removes. Keep browsers revalidating and the CDN to a short window so a cached
        // page never outlives its assets and renders unstyled.
        source: '/:page(about|contact|terms|privacy|offline)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, s-maxage=60, must-revalidate' },
        ],
      },
      {
        source: '/app/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-cache, no-store, must-revalidate, max-age=0' },
        ],
      },
      {
        source: '/auth/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-cache, no-store, must-revalidate, max-age=0' },
        ],
      },
      {
        source: '/api/auth/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-cache, no-store, must-revalidate, max-age=0' },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  release: {
    name: process.env.SENTRY_RELEASE || process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  },
});

