import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkFirst, StaleWhileRevalidate } from "serwist";

declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

// Serve any /workouts/* navigation from a single cached shell.
// WorkoutRouter handles client-side routing via usePathname().
const workoutShellHandler = new NetworkFirst({
    cacheName: "workout-shell",
    networkTimeoutSeconds: 3,
});

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: false,
    runtimeCaching: [
        {
            // All /workouts/* navigations share one cached shell
            matcher: ({ request, url }) =>
                request.mode === "navigate" && url.pathname.startsWith("/workouts"),
            handler: {
                handle: async (options) => {
                    // Rewrite the request to /workouts so all routes cache/serve from one entry
                    const shellUrl = new URL("/workouts", options.url?.origin || location.origin);
                    const shellRequest = new Request(shellUrl.href, { headers: options.request.headers });
                    return workoutShellHandler.handle({ ...options, request: shellRequest });
                },
            },
        },
        {
            matcher: ({ request }) => request.mode === "navigate",
            handler: new NetworkFirst({
                cacheName: "pages",
                networkTimeoutSeconds: 3,
            }),
        },
        ...defaultCache,
    ],
});

serwist.addEventListeners();
