"use client";

import {createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState} from "react";
import {useSession} from "next-auth/react";
import {localGetSyncMeta, localIsHydrated, localSetSyncMeta} from "@/app/lib/workouts/local-data";
import {flushSyncQueue, getPendingSyncCount, hydrateChunk} from "@/app/lib/workouts/sync";
import {getHydrationChunk} from "@/app/lib/workouts/hydrate-action";
import {invalidateColourCache} from "@/app/lib/workouts/muscle-group-colours";

interface OfflineContextType {
    isHydrated: boolean;
    isOnline: boolean;
    pendingSyncs: number;
    push: () => Promise<{ synced: number; failed: number }>;
    pull: () => Promise<void>;
    fullHydrate: () => Promise<void>;
    refreshPendingCount: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType>({
    isHydrated: false,
    isOnline: true,
    pendingSyncs: 0,
    push: async () => ({synced: 0, failed: 0}),
    pull: async () => {
    },
    fullHydrate: async () => {
    },
    refreshPendingCount: async () => {
    },
});

export function useOffline() {
    return useContext(OfflineContext);
}

export default function WorkoutOfflineProvider({children}: { children: ReactNode }) {
    const {data: session} = useSession();
    const [isHydrated, setIsHydrated] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [pendingSyncs, setPendingSyncs] = useState(0);
    const hydrationRan = useRef(false);

    // Full hydration — pulls all data in 90-day chunks. Used on first visit or user switch.
    const hydrateAll = useCallback(async () => {
        if (!navigator.onLine) return;

        let beforeDate: string | undefined = undefined;
        let isFirst = true;

        while (true) {
            try {
                const chunk = await getHydrationChunk(beforeDate);
                await hydrateChunk(chunk, isFirst, true);

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

    const push = useCallback(async (): Promise<{ synced: number; failed: number }> => {
        if (!navigator.onLine) return {synced: 0, failed: 0};

        const result = await flushSyncQueue();
        await refreshPendingCount();

        return result;
    }, [refreshPendingCount]);

    // Pull — fetches all server data in chunks, preserving local unsynced changes.
    const pull = useCallback(async () => {
        if (!navigator.onLine) return;

        let beforeDate: string | undefined = undefined;
        let isFirst = true;

        while (true) {
            try {
                const chunk = await getHydrationChunk(beforeDate);
                await hydrateChunk(chunk, isFirst, false);

                if (isFirst) {
                    setIsHydrated(true);
                    isFirst = false;
                }

                if (!chunk.hasMore) break;
                beforeDate = chunk.nextBeforeDate;
            } catch (e) {
                console.error('Pull chunk failed:', e);
                break;
            }
        }

        if (session?.user?.id) {
            await localSetSyncMeta('userId', session.user.id);
        }

        invalidateColourCache();
    }, [session?.user?.id]);

    const fullHydrate = useCallback(async () => {
        if (!navigator.onLine) return;
        await flushSyncQueue();
        await hydrateAll();
        await refreshPendingCount();
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
                await hydrateAll();
            } else {
                setIsHydrated(true);
            }

            await refreshPendingCount();
        })();
    }, [session?.user?.id, hydrateAll, refreshPendingCount]);

    return (
        <OfflineContext.Provider value={{isHydrated, isOnline, pendingSyncs, push, pull, fullHydrate, refreshPendingCount}}>
            {children}
        </OfflineContext.Provider>
    );
}
