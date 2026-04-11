"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import TimerIcon from '@mui/icons-material/Timer';
import CloseIcon from '@mui/icons-material/Close';

export default function RestTimer() {
    const [duration, setDuration] = useState(90);
    const [remaining, setRemaining] = useState(0);
    const [running, setRunning] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [inputMinutes, setInputMinutes] = useState("1");
    const [inputSeconds, setInputSeconds] = useState("30");
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (running && remaining > 0) {
            intervalRef.current = setInterval(() => {
                setRemaining(prev => {
                    if (prev <= 1) {
                        setRunning(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [running, remaining]);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    const handleOpen = () => {
        if (!running && remaining === 0) {
            const m = Math.floor(duration / 60);
            const s = duration % 60;
            setInputMinutes(String(m));
            setInputSeconds(String(s));
        }
        setModalOpen(true);
    };

    const handleStart = () => {
        const totalSeconds = (parseInt(inputMinutes) || 0) * 60 + (parseInt(inputSeconds) || 0);
        if (totalSeconds <= 0) return;
        setDuration(totalSeconds);
        setRemaining(totalSeconds);
        setRunning(true);
        setModalOpen(false);
    };

    const handleStop = () => {
        setRunning(false);
        setRemaining(0);
        setModalOpen(false);
    };

    const isActive = running || remaining > 0;
    const timerColor = remaining <= 10 && remaining > 0 ? "text-red-400" : "text-amber-200/80";

    return (
        <>
            <button type="button" onClick={handleOpen} className="flex items-center gap-1">
                <TimerIcon sx={{ fontSize: 16, color: isActive ? undefined : 'inherit' }}
                    className={isActive ? timerColor : "text-amber-100/50 hover:text-amber-100"} />
                {isActive && (
                    <span className={`${timerColor} text-sm`} style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '14px' }}>
                        {formatTime(remaining)}
                    </span>
                )}
            </button>

            {modalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40" onClick={() => setModalOpen(false)}>
                    <div className="bg-stone-50 w-64 p-4 shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-black text-sm font-bold">Rest Timer</span>
                            <button type="button" onClick={() => setModalOpen(false)} className="text-black/40 hover:text-black">
                                <CloseIcon sx={{ fontSize: 18, color: 'inherit' }} />
                            </button>
                        </div>

                        {isActive ? (
                            <div className="text-center">
                                <div className={`text-3xl font-bold mb-3 ${remaining <= 10 && remaining > 0 ? 'text-red-600' : 'text-black'}`}
                                    style={{ fontFamily: 'var(--font-geist-mono)' }}>
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
                                    <input type="number" value={inputMinutes} onChange={e => setInputMinutes(e.target.value)}
                                        min="0" max="59"
                                        className="w-14 bg-transparent border-b-2 border-black/20 text-black text-center text-lg font-bold py-1 focus:outline-none focus:border-amber-600" />
                                    <span className="text-black font-bold text-lg">:</span>
                                    <input type="number" value={inputSeconds} onChange={e => setInputSeconds(e.target.value)}
                                        min="0" max="59"
                                        className="w-14 bg-transparent border-b-2 border-black/20 text-black text-center text-lg font-bold py-1 focus:outline-none focus:border-amber-600" />
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
