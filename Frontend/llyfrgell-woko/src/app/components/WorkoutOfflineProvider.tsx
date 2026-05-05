"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { localIsHydrated, localGetSyncMeta, localSetSyncMeta } from "@/app/lib/workouts/local-data";
import { hydrateChunk, flushSyncQueue, getPendingSyncCount } from "@/app/lib/workouts/sync";
import { getHydrationChunk } from "@/app/lib/workouts/hydrate-action";
import { invalidateColourCache } from "@/app/lib/workouts/muscle-group-colours";

interface OfflineContextType {
    isHydrated: boolean;
    isOnline: boolean;
    pendingSyncs: number;
    sync: () => Promise<{ synced: number; failed: number }>;
    refreshPendingCount: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType>({
    isHydrated: false,
    isOnline: true,
    pendingSyncs: 0,
    sync: async () => ({ synced: 0, failed: 0 }),
    refreshPendingCount: async () => {},
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

        if (session?.user?.id) {
            await localSetSyncMeta('userId', session.user.id);
        }

        invalidateColourCache();
    }, [session?.user?.id]);

    const refreshPendingCount = useCallback(async () => {
        setPendingSyncs(await getPendingSyncCount());
    }, []);

    const sync = useCallback(async (): Promise<{ synced: number; failed: number }> => {
        if (!navigator.onLine) return { synced: 0, failed: 0 };

        // Push local changes to server
        const result = await flushSyncQueue();

        // Pull fresh server state (clear local since we just pushed everything)
        await hydrateAll(true);

        // Update pending count
        await refreshPendingCount();

        return result;
    }, [hydrateAll, refreshPendingCount]);

    // Track online status
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

    // Initial hydration on mount
    useEffect(() => {
        if (!session?.user?.id || hydrationRan.current) return;
        hydrationRan.current = true;

        (async () => {
            const currentUserId = session.user.id;
            const storedUserId = await localGetSyncMeta('userId');
            const hydrated = await localIsHydrated();

            if (!hydrated || storedUserId !== currentUserId) {
                // Different user or first time — full clear + hydrate
                await hydrateAll(true);
            } else {
                // Same user, already hydrated — just mark ready
                setIsHydrated(true);
            }

            await refreshPendingCount();
        })();
    }, [session?.user?.id, hydrateAll, refreshPendingCount]);

    return (
        <OfflineContext.Provider value={{ isHydrated, isOnline, pendingSyncs, sync, refreshPendingCount }}>
            {children}
        </OfflineContext.Provider>
    );
}
