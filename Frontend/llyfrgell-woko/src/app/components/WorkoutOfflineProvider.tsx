"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { localIsHydrated, localGetSyncMeta, localSetSyncMeta } from "@/app/lib/workouts/local-data";
import { hydrateChunk, startAutoSync, stopAutoSync, getPendingSyncCount, flushSyncQueue } from "@/app/lib/workouts/sync";
import { getHydrationChunk } from "@/app/lib/workouts/hydrate-action";

import { invalidateColourCache } from "@/app/lib/workouts/muscle-group-colours";

const STALE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

interface OfflineContextType {
    isHydrated: boolean;
    isOnline: boolean;
    pendingSyncs: number;
    refreshLocal: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType>({
    isHydrated: false,
    isOnline: true,
    pendingSyncs: 0,
    refreshLocal: async () => {},
});

export function useOffline() {
    return useContext(OfflineContext);
}

export default function WorkoutOfflineProvider({ children }: { children: ReactNode }) {
    const { data: session } = useSession();
    const [isHydrated, setIsHydrated] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [pendingSyncs, setPendingSyncs] = useState(0);
    const hydrationRan = useRef(false);

    const hydrateAll = useCallback(async (clearFirst: boolean) => {
        if (!navigator.onLine) return;

        // If not clearing everything, flush pending syncs first so nothing is lost
        if (!clearFirst) {
            try { await flushSyncQueue(); } catch (e) { /* best effort */ }
        }

        let beforeDate: string | undefined = undefined;
        let isFirst = true;

        while (true) {
            try {
                const chunk = await getHydrationChunk(beforeDate);
                await hydrateChunk(chunk, isFirst, clearFirst);

                if (isFirst) {
                    setIsHydrated(true);
                    isFirst = false;
                }

                if (!chunk.hasMore) break;
                beforeDate = chunk.nextBeforeDate;
            } catch (e) {
                console.error('Hydration chunk failed:', e);
                break;
            }
        }

        // Store current user ID after successful hydration
        if (session?.user?.id) {
            await localSetSyncMeta('userId', session.user.id);
        }

        invalidateColourCache();


    }, [session?.user?.id]);

    useEffect(() => {
        setIsOnline(navigator.onLine);
        const onOnline = () => setIsOnline(true);
        const onOffline = () => setIsOnline(false);
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);
        return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
        };
    }, []);

    // Hydration logic
    useEffect(() => {
        if (!session?.user?.id || hydrationRan.current) return;
        hydrationRan.current = true;

        (async () => {
            const currentUserId = session.user.id;
            const storedUserId = await localGetSyncMeta('userId');
            const lastSyncStr = await localGetSyncMeta('lastSync');
            const hydrated = await localIsHydrated();

            if (!hydrated || storedUserId !== currentUserId) {
                // Check for unsynced data from a different user
                if (storedUserId && storedUserId !== currentUserId) {
                    const pending = await getPendingSyncCount();
                    if (pending > 0) {
                        // Try to flush before clearing — will fail if wrong user is authed
                        // but at least we tried. Log it.
                        console.warn(`Switching users with ${pending} unsynced items from previous user. Data may be lost.`);
                        if (navigator.onLine) {
                            try { await flushSyncQueue(); } catch (e) { /* expected to fail */ }
                        }
                    }
                }
                // Full clear + hydrate
                await hydrateAll(true);
                return;
            }

            // Same user, already hydrated
            setIsHydrated(true);

            if (!navigator.onLine) return;

            // Check if stale
            const lastSync = lastSyncStr ? new Date(lastSyncStr).getTime() : 0;
            const isStale = Date.now() - lastSync > STALE_THRESHOLD_MS;

            if (isStale) {
                // Background refresh — flushes pending syncs first, then hydrates without clearing sync data
                hydrateAll(false);
            } else {
                // Not stale, just flush pending syncs
                try { await flushSyncQueue(); } catch (e) { /* non-blocking */ }
            }
        })();
    }, [session?.user?.id, hydrateAll]);

    // Start auto-sync
    useEffect(() => {
        if (isHydrated) {
            startAutoSync();
            return () => stopAutoSync();
        }
    }, [isHydrated]);

    // Poll pending sync count
    useEffect(() => {
        if (!isHydrated) return;
        const interval = setInterval(async () => {
            setPendingSyncs(await getPendingSyncCount());
        }, 3000);
        return () => clearInterval(interval);
    }, [isHydrated]);

    return (
        <OfflineContext.Provider value={{ isHydrated, isOnline, pendingSyncs, refreshLocal: () => hydrateAll(false) }}>
            {children}
        </OfflineContext.Provider>
    );
}
