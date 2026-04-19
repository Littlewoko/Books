"use client";

import {useCallback, useEffect, useState} from "react";
import TimerIcon from '@mui/icons-material/Timer';
import CloseIcon from '@mui/icons-material/Close';

const STORAGE_KEY = "rest-timer-end";
const DURATION_KEY = "rest-timer-duration";

function getEndTime(): number | null {
    const v = localStorage.getItem(STORAGE_KEY);
    return v ? parseInt(v) : null;
}

function getRemaining(): number {
    const end = getEndTime();
    if (!end) return 0;
    return Math.max(0, Math.ceil((end - Date.now()) / 1000));
}

export default function RestTimer() {
    const [remaining, setRemaining] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [inputTotal, setInputTotal] = useState("90");

    const refresh = useCallback(() => setRemaining(getRemaining()), []);

    // On mount, pick up any running timer
    useEffect(() => {
        refresh();
    }, [refresh]);

    // Tick every second while active, plus recalc on visibility change
    useEffect(() => {
        if (remaining <= 0) return;

        const tick = () => {
            const r = getRemaining();
            setRemaining(r);
            if (r <= 0) {
                localStorage.removeItem(STORAGE_KEY);
                try {
                    if (Notification.permission === "granted") {
                        new Notification("Rest over", {body: "Time to go again"});
                    }
                } catch {
                }
            }
        };

        const interval = setInterval(tick, 1000);
        const onVisible = () => {
            if (document.visibilityState === "visible") tick();
        };
        document.addEventListener("visibilitychange", onVisible);

        return () => {
            clearInterval(interval);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [remaining > 0]);

    const handleOpen = () => {
        if (remaining === 0) {
            setInputTotal(localStorage.getItem(DURATION_KEY) || "90");
        }
        setModalOpen(true);
    };

    const handleStart = () => {
        const totalSeconds = parseInt(inputTotal) || 0;
        if (totalSeconds <= 0) return;
        localStorage.setItem(DURATION_KEY, String(totalSeconds));
        localStorage.setItem(STORAGE_KEY, String(Date.now() + totalSeconds * 1000));
        setRemaining(totalSeconds);
        setModalOpen(false);
        if (Notification.permission === "default") Notification.requestPermission();
    };

    const handleStop = () => {
        localStorage.removeItem(STORAGE_KEY);
        setRemaining(0);
        setModalOpen(false);
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const isActive = remaining > 0;
    const timerColor = remaining <= 10 && remaining > 0 ? "text-red-400" : "text-amber-200/80";

    return (
        <>
            <button type="button" onClick={handleOpen} className="flex items-center gap-1">
                <TimerIcon sx={{fontSize: 16, color: isActive ? undefined : 'inherit'}}
                           className={isActive ? timerColor : "text-amber-100/50 hover:text-amber-100"}/>
                {isActive && (
                    <span className={`${timerColor} text-sm`}
                          style={{fontFamily: 'var(--font-geist-mono)', fontSize: '14px'}}>
                        {formatTime(remaining)}
                    </span>
                )}
            </button>

            {modalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40"
                     onClick={() => setModalOpen(false)}>
                    <div className="bg-stone-50 w-64 p-4 shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-black text-sm font-bold">Rest Timer</span>
                            <button type="button" onClick={() => setModalOpen(false)}
                                    className="text-black/40 hover:text-black">
                                <CloseIcon sx={{fontSize: 18, color: 'inherit'}}/>
                            </button>
                        </div>

                        {isActive ? (
                            <div className="text-center">
                                <div
                                    className={`text-3xl font-bold mb-3 ${remaining <= 10 ? 'text-red-600' : 'text-black'}`}
                                    style={{fontFamily: 'var(--font-geist-mono)'}}>
                                    {formatTime(remaining)}
                                </div>
                                <button type="button" onClick={handleStop}
                                        className="text-red-600 font-bold text-sm hover:text-red-700">
                                    Stop
                                </button>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center gap-1 mb-3 justify-center">
                                    <input type="number" value={inputTotal}
                                           onChange={e => setInputTotal(e.target.value)}
                                           min="1"
                                           className="w-20 bg-transparent border-b-2 border-black/20 text-black text-center text-lg font-bold py-1 focus:outline-none focus:border-amber-600"/>
                                    <span className="text-black/50 text-sm">sec</span>
                                </div>
                                <button type="button" onClick={handleStart}
                                        className="w-full text-amber-700 font-bold text-sm hover:text-amber-800 py-1">
                                    Start
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
