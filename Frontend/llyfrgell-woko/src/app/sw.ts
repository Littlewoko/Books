import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkFirst } from "serwist";

declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const pageHandler = new NetworkFirst({
    cacheName: "pages",
    networkTimeoutSeconds: 3,
});

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: [
        {
            matcher: ({ request, url }) => request.mode === "navigate" && url.pathname.startsWith("/workouts"),
            handler: {
                handle: async (params) => {
                    try {
                        // Try network first for the exact URL
                        const response = await pageHandler.handle(params);
                        return response;
                    } catch (e) {
                        // Offline: try exact URL from cache
                        const exactMatch = await caches.match(params.request);
                        if (exactMatch) return exactMatch;

                        // Fall back to any cached /workouts page as the shell
                        // The client-side router will read the actual URL from the browser
                        // and render the correct page from IndexedDB
                        const cache = await caches.open("pages");
                        const keys = await cache.keys();
                        for (const key of keys) {
                            if (new URL(key.url).pathname.startsWith("/workouts")) {
                                const fallback = await cache.match(key);
                                if (fallback) return fallback;
                            }
                        }
                        throw e;
                    }
                },
            },
        },
        {
            matcher: ({ request }) => request.mode === "navigate",
            handler: pageHandler,
        },
        ...defaultCache,
    ],
});

serwist.addEventListeners();

// Pre-cache workout routes on install
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open("pages").then((cache) =>
            cache.addAll([
                "/workouts",
                "/workouts/exercises",
            ])
        )
    );
});
