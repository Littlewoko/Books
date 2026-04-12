"use client";

import {useState} from "react";
import {useOffline} from "@/app/components/WorkoutOfflineProvider";

export default function SyncButton() {
    const {refreshLocal} = useOffline();
    const [syncing, setSyncing] = useState(false);
    const [done, setDone] = useState(false);

    const handleSync = async () => {
        setSyncing(true);
        setDone(false);
        await refreshLocal();
        setSyncing(false);
        setDone(true);
    };

    return (
        <div className="flex items-center gap-2">
            <button type="button" onClick={handleSync} disabled={syncing}
                    className="text-amber-700 hover:text-amber-800 text-sm font-semibold py-1 transition-colours disabled:text-black/20">
                {syncing ? 'Syncing...' : 'Sync to local'}
            </button>
            {done && <span className="text-black/40 text-xs">Done — colours will update on next page load</span>}
        </div>
    );
}
