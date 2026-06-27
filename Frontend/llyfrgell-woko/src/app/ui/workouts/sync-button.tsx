"use client";

import { useState } from "react";
import { useOffline } from "@/app/components/WorkoutOfflineProvider";

export default function SyncButton() {
    const { push, pendingSyncs, isOnline } = useOffline();
    const [pushing, setPushing] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handlePush = async () => {
        setPushing(true);
        setResult(null);
        try {
            const { synced, failed } = await push();
            if (failed > 0) {
                setResult(`⚠ ${synced} pushed, ${failed} failed — retry?`);
            } else if (synced > 0) {
                setResult(`✓ Pushed ${synced} change${synced !== 1 ? 's' : ''}`);
            } else {
                setResult('✓ Up to date');
            }
        } catch (e) {
            setResult(`Error: ${e instanceof Error ? e.message : 'Push failed'}`);
        } finally {
            setPushing(false);
        }
    };

    const label = pushing
        ? 'Pushing...'
        : pendingSyncs > 0
            ? `Push (${pendingSyncs} pending)`
            : 'Push';

    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={handlePush}
                disabled={pushing || !isOnline}
                className="text-amber-700 hover:text-amber-800 text-sm font-semibold py-1 transition-colors disabled:text-black/20"
            >
                {label}
            </button>
            {!isOnline && <span className="text-red-400 text-xs">offline</span>}
            {result && <span className="text-black/40 text-xs">{result}</span>}
        </div>
    );
}
