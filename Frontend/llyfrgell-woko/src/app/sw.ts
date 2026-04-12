import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkFirst } from "serwist";

declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const WORKOUT_SHELL_CACHE = "workout-shell";
const WORKOUT_SHELL_URL = "/workouts";

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
                        return await pageHandler.handle(params);
                    } catch (e) {
                        // Offline: serve the workout shell for ANY /workouts/* route
                        // WorkoutRouter reads usePathname() from the real browser URL
                        // and renders the correct view from IndexedDB
                        const shell = await caches.match(WORKOUT_SHELL_URL);
                        if (shell) return shell;
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

// Cache the workout shell on install AND activate (handles SW updates)
async function cacheWorkoutShell() {
    const cache = await caches.open(WORKOUT_SHELL_CACHE);
    try {
        await cache.add(WORKOUT_SHELL_URL);
        // Also copy to the pages cache so the fallback matcher finds it
        const response = await cache.match(WORKOUT_SHELL_URL);
        if (response) {
            const pagesCache = await caches.open("pages");
            await pagesCache.put(WORKOUT_SHELL_URL, response);
        }
    } catch (e) {
        // May fail if offline during install — that's ok, will retry on activate
    }
}

self.addEventListener("install", (event) => {
    event.waitUntil(cacheWorkoutShell());
});

self.addEventListener("activate", (event) => {
    event.waitUntil(cacheWorkoutShell());
});
