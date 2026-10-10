"use client";

import {createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState} from "react";
import {useSession} from "next-auth/react";
import {localGetSyncMeta, localIsHydrated, localSetSyncMeta} from "@/app/lib/workouts/local-data";
import {flushSyncQueue, getPendingSyncCount, hydrateChunk, hydrateReferenceData} from "@/app/lib/workouts/sync";
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
    const [hydratedUserId, setHydratedUserId] = useState<string | null>(null);
    const [isOnline, setIsOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);
    const [pendingSyncs, setPendingSyncs] = useState(0);
    const [hydrationFailure, setHydrationFailure] = useState<{ userId: string; message: string } | null>(null);
    const hydrationRunId = useRef(0);
    const userId = session?.user?.id ?? null;
    const isHydrated = !!userId && hydratedUserId === userId;
    const hydrationError = hydrationFailure?.userId === userId ? hydrationFailure.message : null;

    // Full hydration — pulls all data in 90-day chunks. Used on first visit or user switch.
    const hydrateAll = useCallback(async (runId: number) => {
        if (!navigator.onLine || !userId) return;

        let beforeDate: string | undefined = undefined;
        let isFirst = true;

        while (true) {
            if (runId !== hydrationRunId.current) return;

            let chunk;
            try {
                chunk = await getHydrationChunk(beforeDate);
            } catch (e) {
                console.error('Hydration chunk failed:', e);
                if (runId === hydrationRunId.current) {
                    setHydrationFailure({
                        userId,
                        message: 'Could not load workout data. Check your connection and try again.',
                    });
                }
                break;
            }

            if (runId !== hydrationRunId.current) return;
            await hydrateChunk(chunk, isFirst, true);

            if (isFirst) {
                await localSetSyncMeta('userId', userId);
                await localSetSyncMeta('catalogVersion', '2');
                setHydratedUserId(userId);
                setHydrationFailure(null);
                isFirst = false;
            }

            if (!chunk.hasMore) break;
            beforeDate = chunk.nextBeforeDate;
        }

        invalidateColourCache();
    }, [userId]);

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
        if (!navigator.onLine || !userId) return;
        const runId = ++hydrationRunId.current;

        let beforeDate: string | undefined = undefined;
        let isFirst = true;

        while (true) {
            if (runId !== hydrationRunId.current) return;

            try {
                const chunk = await getHydrationChunk(beforeDate);
                if (runId !== hydrationRunId.current) return;
                await hydrateChunk(chunk, isFirst, false);

                if (isFirst) {
                    await localSetSyncMeta('userId', userId);
                    await localSetSyncMeta('catalogVersion', '2');
                    setHydratedUserId(userId);
                    setHydrationFailure(null);
                    isFirst = false;
                }

                if (!chunk.hasMore) break;
                beforeDate = chunk.nextBeforeDate;
            } catch (e) {
                console.error('Pull chunk failed:', e);
                break;
            }
        }

        invalidateColourCache();
    }, [userId]);

    const fullHydrate = useCallback(async () => {
        if (!navigator.onLine || !userId) return;
        await flushSyncQueue();
        const runId = ++hydrationRunId.current;
        await hydrateAll(runId);
        await refreshPendingCount();
    }, [hydrateAll, refreshPendingCount, userId]);

    // Track online status
    useEffect(() => {
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
        const currentUserId = userId;
        const runId = ++hydrationRunId.current;

        if (!currentUserId) {
            return;
        }

        (async () => {
            const storedUserId = await localGetSyncMeta('userId');
            const hydrated = await localIsHydrated();
            if (runId !== hydrationRunId.current) return;

            if (hydrated && storedUserId === currentUserId) {
                const catalogVersion = await localGetSyncMeta('catalogVersion');
                if (catalogVersion !== '2' && navigator.onLine) {
                    try {
                        const referenceData = await getHydrationChunk();
                        if (runId !== hydrationRunId.current) return;
                        await hydrateReferenceData(referenceData);
                        invalidateColourCache();
                    } catch (error) {
                        console.error('Workout catalogue refresh failed:', error);
                        setHydrationFailure({
                            userId: currentUserId,
                            message: 'Could not refresh the movement catalogue.',
                        });
                    }
                }
                if (runId !== hydrationRunId.current) return;
                setHydratedUserId(currentUserId);
            } else if (navigator.onLine) {
                await hydrateAll(runId);
            } else {
                setHydrationFailure({
                    userId: currentUserId,
                    message: 'Workout data is not available offline on this device yet.',
                });
            }

            await refreshPendingCount();
        })();
        return () => {
            if (hydrationRunId.current === runId) hydrationRunId.current++;
        };
    }, [userId, hydrateAll, refreshPendingCount]);

    return (
        <OfflineContext.Provider value={{isHydrated, isOnline, pendingSyncs, push, pull, fullHydrate, refreshPendingCount}}>
            {isHydrated ? children : (
                <div role="status" className="mx-auto max-w-lg p-6 text-center text-black/60">
                    {hydrationError || 'Loading workout data...'}
                </div>
            )}
        </OfflineContext.Provider>
    );
}
