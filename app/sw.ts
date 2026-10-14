/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkFirst, NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const apiHostnames = new Set([
  "api.inshop.social",
  "api.dev.inshop.social",
  "dev-api.inshop.social",
]);

// Wipes every runtime cache (pages, RSC payloads, images, fonts, API leftovers)
// left behind by previous service worker versions. Only Serwist's precache is
// kept, because the installing worker has just populated it with the current
// build's assets.
async function clearAllRuntimeCaches(): Promise<void> {
  const cacheNames = await caches.keys();
  const staleCaches = cacheNames.filter((name) => !name.includes("precache"));
  await Promise.all(staleCaches.map((name) => caches.delete(name)));
}

self.addEventListener("activate", (event) => {
  event.waitUntil(clearAllRuntimeCaches());
});

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ request, url: { hostname, pathname }, sameOrigin }) =>
        apiHostnames.has(hostname) ||
        (sameOrigin && (pathname === "/api" || pathname.startsWith("/api/"))),
      handler: new NetworkOnly({ fetchOptions: { cache: "no-store" } }),
    },
    {
      matcher: ({ request, url: { pathname }, sameOrigin }) =>
        sameOrigin &&
        !pathname.startsWith("/api/") &&
        (request.destination === "document" || request.headers.get("RSC") === "1"),
      // Network first: a stale cached page would reference _next/static chunks
      // that no longer exist after a deploy and break the app. The cache is
      // only a fallback when the network is slow or offline.
      handler: new NetworkFirst({
        cacheName: "app-pages",
        networkTimeoutSeconds: 3,
        plugins: [
          {
            // Respect private/no-store responses so authenticated page data
            // remains network-only while public pages can load from cache.
            cacheWillUpdate: async ({ response }) => {
              const cacheControl = response.headers.get("Cache-Control") ?? "";
              return /\b(?:private|no-store)\b/i.test(cacheControl) ? null : response;
            },
          },
        ],
      }),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
