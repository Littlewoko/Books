"use client";

import {useEffect, useState} from "react";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {localGetWeeklyVolume} from "@/app/lib/workouts/local-data";
import {getMuscleGroupColour} from "@/app/lib/workouts/muscle-group-colours";

function getMonday(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    date.setDate(date.getDate() + diff);
    return date;
}

function formatDate(d: Date): string {
    return d.toISOString().split('T')[0];
}

function formatShort(d: Date): string {
    return d.toLocaleDateString("en-GB", {day: "numeric", month: "short"});
}

export default function WeeklyVolume() {
    const [monday, setMonday] = useState(() => getMonday(new Date()));
    const [data, setData] = useState<{ muscleGroup: string; sets: number }[]>([]);
    const [loading, setLoading] = useState(true);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    useEffect(() => {
        setLoading(true);
        localGetWeeklyVolume(formatDate(monday), formatDate(sunday))
            .then(setData)
            .finally(() => setLoading(false));
    }, [monday.toISOString()]);

    const prevWeek = () => setMonday(prev => {
        const d = new Date(prev);
        d.setDate(d.getDate() - 7);
        return d;
    });
    const nextWeek = () => setMonday(prev => {
        const d = new Date(prev);
        d.setDate(d.getDate() + 7);
        return d;
    });
    const goToThisWeek = () => setMonday(getMonday(new Date()));

    const maxSets = data.length > 0 ? Math.max(...data.map(d => d.sets)) : 0;
    const totalSets = data.reduce((sum, d) => sum + d.sets, 0);

    const isCurrentWeek = formatDate(monday) === formatDate(getMonday(new Date()));

    return (
        <div className="mt-5 border-t border-black/10 pt-3">
            <div className="flex items-center justify-between mb-2">
                <button type="button" onClick={prevWeek}
                        className="p-1 text-black hover:text-amber-700 transition-colors">
                    <ChevronLeftIcon sx={{fontSize: 20, color: 'inherit'}}/>
                </button>
                <button type="button" onClick={goToThisWeek} className="text-center">
                    <span className="text-black text-sm font-bold">
                        {formatShort(monday)} – {formatShort(sunday)}
                    </span>
                    {totalSets > 0 && (
                        <span className="text-black/40 text-xs ml-2">{totalSets} sets</span>
                    )}
                </button>
                <button type="button" onClick={nextWeek}
                        className={`p-1 transition-colors ${isCurrentWeek ? 'text-black/20' : 'text-black hover:text-amber-700'}`}
                        disabled={isCurrentWeek}>
                    <ChevronRightIcon sx={{fontSize: 20, color: 'inherit'}}/>
                </button>
            </div>

            {loading ? null : data.length === 0 ? (
                <p className="text-black/30 text-xs text-center">No sets this week</p>
            ) : (
                <div className="flex flex-col gap-1.5">
                    {data.map(({muscleGroup, sets}) => (
                        <div key={muscleGroup} className="flex items-center gap-2">
                            <span className="text-black text-xs w-20 text-right truncate flex-shrink-0">{muscleGroup}</span>
                            <div className="flex-1 h-4 bg-black/5 relative">
                                <div
                                    className="h-full transition-all duration-300"
                                    style={{
                                        width: `${(sets / maxSets) * 100}%`,
                                        backgroundColor: getMuscleGroupColour(muscleGroup),
                                        opacity: 0.7,
                                    }}
                                />
                            </div>
                            <span className="text-black text-xs w-6 font-semibold flex-shrink-0">{sets}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
