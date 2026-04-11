"use client";

import { useState, useEffect } from "react";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Link from "next/link";
import { getWorkoutDatesForMonth } from "@/app/lib/workouts/calendar-actions";

const MUSCLE_GROUP_COLORS: Record<string, string> = {
    Chest: "#ef4444", Back: "#3b82f6", Shoulders: "#f59e0b",
    Quads: "#22c55e", Hamstrings: "#14b8a6", Glutes: "#ec4899",
    Legs: "#22c55e", Biceps: "#a855f7", Triceps: "#8b5cf6",
    Abs: "#06b6d4", Calves: "#84cc16", Cardio: "#f97316",
    "Rear Delts": "#fbbf24", "Side Delts": "#eab308", "Front Delts": "#f59e0b",
    "Lower Back": "#60a5fa", Adductors: "#2dd4bf", Traps: "#818cf8",
    Grip: "#78716c", Neck: "#a8a29e", Climb: "#fb923c",
    Physio: "#4ade80", "Shoulder Prehab": "#facc15", Hinge: "#4ade80",
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMuscleGroupColor(name: string): string {
    return MUSCLE_GROUP_COLORS[name] || "#737373";
}

interface WorkoutDay { date: string; muscleGroups: string[]; }

export default function WorkoutCalendar() {
    const [today] = useState(() => new Date());
    const [year, setYear] = useState(() => new Date().getFullYear());
    const [month, setMonth] = useState(() => new Date().getMonth() + 1);
    const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getWorkoutDatesForMonth(year, month)
            .then(setWorkoutDays)
            .finally(() => setLoading(false));
    }, [year, month]);

    const navigate = (newYear: number, newMonth: number) => { setYear(newYear); setMonth(newMonth); };
    const prevMonth = () => navigate(month === 1 ? year - 1 : year, month === 1 ? 12 : month - 1);
    const nextMonth = () => navigate(month === 12 ? year + 1 : year, month === 12 ? 1 : month + 1);
    const goToToday = () => navigate(today.getFullYear(), today.getMonth() + 1);

    const firstDay = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const startDow = (firstDay.getDay() + 6) % 7;

    const workoutMap = new Map<string, string[]>();
    for (const wd of workoutDays) workoutMap.set(wd.date, wd.muscleGroups);

    const cells: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const monthName = firstDay.toLocaleString("default", { month: "long" });
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;

    return (
        <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-3">
                <button type="button" onClick={prevMonth} className="p-2 text-black hover:text-amber-700 transition-colors">
                    <ChevronLeftIcon sx={{ fontSize: 28, color: 'inherit' }} />
                </button>
                <button type="button" onClick={goToToday}>
                    <span className="text-black text-xl sm:text-2xl font-bold">{monthName} {year}</span>
                </button>
                <button type="button" onClick={nextMonth} className="p-2 text-black hover:text-amber-700 transition-colors">
                    <ChevronRightIcon sx={{ fontSize: 28, color: 'inherit' }} />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
                {DAY_LABELS.map(d => (
                    <div key={d} className="text-center text-black text-xs font-bold py-1">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {cells.map((day, i) => {
                    if (day === null) return <div key={`empty-${i}`} className="aspect-square" />;

                    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const muscleGroups = workoutMap.get(dateStr);
                    const hasWorkout = !!muscleGroups;
                    const isToday = isCurrentMonth && day === today.getDate();

                    return (
                        <Link key={dateStr} href={`/workouts/${dateStr}`}
                            className={`aspect-square flex flex-col items-center justify-center gap-0.5 transition-colors ${
                                isToday
                                    ? 'bg-amber-600 text-white font-bold'
                                    : hasWorkout
                                        ? 'bg-amber-50 hover:bg-amber-100'
                                        : 'hover:bg-amber-50'
                            }`}
                        >
                            <span className={`text-sm ${
                                isToday ? 'text-white' : hasWorkout ? 'text-black font-semibold' : 'text-black/40'
                            }`}>{day}</span>
                            {muscleGroups && !isToday && (
                                <div className="flex gap-0.5 flex-wrap justify-center max-w-[80%]">
                                    {muscleGroups.slice(0, 4).map((mg, j) => (
                                        <div key={j} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getMuscleGroupColor(mg) }} title={mg} />
                                    ))}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </div>

            {!loading && workoutDays.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 justify-center">
                    {[...new Set(workoutDays.flatMap(d => d.muscleGroups))].sort().map(mg => (
                        <div key={mg} className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getMuscleGroupColor(mg) }} />
                            <span className="text-black text-xs">{mg}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
