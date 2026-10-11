/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist, StaleWhileRevalidate } from "serwist";

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
async function clearLegacyApiResponses(): Promise<void> {
  const cacheNames = await caches.keys();
  const oldDataCaches = cacheNames.filter((name) =>
    ["apis", "cross-origin", "others"].includes(name),
  );

  await Promise.all(
    oldDataCaches.map(async (name) => {
      const cache = await caches.open(name);
      const requests = await cache.keys();
      const staleDataRequests = requests.filter((request) => {
        const url = new URL(request.url);
        return (
          apiHostnames.has(url.hostname) ||
          (url.origin === self.location.origin && (url.pathname === "/api" || url.pathname.startsWith("/api/")))
        );
      });

      await Promise.all(staleDataRequests.map((request) => cache.delete(request)));
    }),
  );
}

self.addEventListener("activate", (event) => {
  event.waitUntil(clearLegacyApiResponses());
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
      handler: new StaleWhileRevalidate({
        cacheName: "app-pages",
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
