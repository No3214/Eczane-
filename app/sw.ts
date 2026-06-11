/// <reference lib="webworker" />
/// <reference lib="webworker.iterable" />
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkFirst, CacheFirst, StaleWhileRevalidate } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Cache names with versioning
const CACHE_VERSION = "v1.1.0";
const PAGES_CACHE = `nobetci-pages-${CACHE_VERSION}`;
const ASSETS_CACHE = `nobetci-assets-${CACHE_VERSION}`;
const API_CACHE = `nobetci-api-${CACHE_VERSION}`;
const IMAGES_CACHE = `nobetci-images-${CACHE_VERSION}`;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      // Pages caching with Offline Fallback
      matcher: ({ request }) => request.destination === "document",
      handler: new NetworkFirst({
        cacheName: PAGES_CACHE,
        plugins: [
          {
            handlerDidError: async () => {
              return (await caches.match("/offline.html")) || Response.error();
            },
          },
        ],
      }),
    },
    {
      // APIs caching - Network First (with 3s timeout) to ensure fresh data
      matcher: ({ url }) => url.pathname.startsWith("/api/"),
      handler: new NetworkFirst({
        cacheName: API_CACHE,
        networkTimeoutSeconds: 3,
      }),
    },
    {
      // Styles and scripts - Stale While Revalidate
      matcher: ({ request }) =>
        request.destination === "style" ||
        request.destination === "script" ||
        request.destination === "worker",
      handler: new StaleWhileRevalidate({
        cacheName: ASSETS_CACHE,
      }),
    },
    {
      // Images - Cache First
      matcher: ({ request }) => request.destination === "image",
      handler: new CacheFirst({
        cacheName: IMAGES_CACHE,
      }),
    },
  ],
});

serwist.addEventListeners();
