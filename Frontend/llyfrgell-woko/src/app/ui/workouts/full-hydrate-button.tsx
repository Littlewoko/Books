"use client";

import { useState } from "react";
import { useOffline } from "@/app/components/WorkoutOfflineProvider";

export default function FullHydrateButton() {
    const { fullHydrate, isOnline } = useOffline();
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleFullHydrate = async () => {
        setRunning(true);
        setResult(null);
        try {
            await fullHydrate();
            setResult("✓ Full refresh complete");
        } catch (e) {
            setResult(`Error: ${e instanceof Error ? e.message : "Failed"}`);
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={handleFullHydrate}
                disabled={running || !isOnline}
                className="text-black/50 hover:text-black text-sm font-semibold py-1 transition-colors disabled:text-black/20"
            >
                {running ? "Refreshing..." : "Full refresh (all history)"}
            </button>
            {result && <span className="text-black/40 text-xs">{result}</span>}
        </div>
    );
}
