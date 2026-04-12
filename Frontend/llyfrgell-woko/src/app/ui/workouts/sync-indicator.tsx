"use client";

import {useOffline} from "@/app/components/WorkoutOfflineProvider";

export default function SyncIndicator() {
    const {isOnline, pendingSyncs} = useOffline();

    if (isOnline && pendingSyncs === 0) return null;

    return (
        <div className="flex items-center gap-1 text-xs">
            {!isOnline && (
                <span className="text-red-400 font-semibold">offline</span>
            )}
            {pendingSyncs > 0 && (
                <span className="text-amber-300">{pendingSyncs}↑</span>
            )}
        </div>
    );
}
