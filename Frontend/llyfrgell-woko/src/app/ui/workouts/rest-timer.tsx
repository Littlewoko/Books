"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import TimerIcon from '@mui/icons-material/Timer';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

const PRESETS = [60, 90, 120, 180];

export default function RestTimer() {
    const [seconds, setSeconds] = useState(90);
    const [remaining, setRemaining] = useState(0);
    const [running, setRunning] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const pickerRef = useRef<HTMLDivElement>(null);

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
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [running, remaining]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setShowPicker(false);
            }
        };
        if (showPicker) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showPicker]);

    const start = useCallback(() => {
        setRemaining(seconds);
        setRunning(true);
    }, [seconds]);

    const toggle = useCallback(() => {
        if (remaining === 0) {
            start();
        } else {
            setRunning(prev => !prev);
        }
    }, [remaining, start]);

    const reset = useCallback(() => {
        setRunning(false);
        setRemaining(0);
    }, []);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    const isFinished = !running && remaining === 0;
    const timerColor = remaining <= 10 && remaining > 0 ? "text-red-400" : "text-amber-200/80";

    return (
        <div className="relative flex items-center gap-1" ref={pickerRef}>
            <button
                onClick={() => setShowPicker(prev => !prev)}
                className="text-amber-100/50 hover:text-amber-100 transition-colors"
                title="Set timer duration"
            >
                <TimerIcon sx={{ fontSize: 16 }} />
            </button>

            <button
                onClick={toggle}
                className={`${timerColor} hover:text-amber-100 transition-colors text-sm min-w-[40px] text-center`}
                style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '14px' }}
            >
                {remaining > 0 ? formatTime(remaining) : formatTime(seconds)}
            </button>

            {remaining > 0 ? (
                <div className="flex items-center gap-0.5">
                    <button onClick={toggle} className="text-amber-100/50 hover:text-amber-100 transition-colors">
                        {running ? <PauseIcon sx={{ fontSize: 14 }} /> : <PlayArrowIcon sx={{ fontSize: 14 }} />}
                    </button>
                    <button onClick={reset} className="text-amber-100/50 hover:text-amber-100 transition-colors">
                        <RestartAltIcon sx={{ fontSize: 14 }} />
                    </button>
                </div>
            ) : (
                <button onClick={start} className="text-amber-100/50 hover:text-amber-100 transition-colors">
                    <PlayArrowIcon sx={{ fontSize: 14 }} />
                </button>
            )}

            {showPicker && (
                <div className="absolute top-full right-0 mt-1 bg-stone-800 border border-stone-600 rounded p-2 flex gap-1 z-50">
                    {PRESETS.map(p => (
                        <button
                            key={p}
                            onClick={() => { setSeconds(p); setRemaining(0); setRunning(false); setShowPicker(false); }}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                                seconds === p ? 'bg-amber-700 text-white' : 'text-stone-300 hover:bg-stone-700'
                            }`}
                        >
                            {formatTime(p)}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
