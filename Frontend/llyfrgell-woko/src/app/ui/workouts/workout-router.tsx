"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import WorkoutCalendar from "./workout-calendar";
import DayView from "./day-view";
import MovementView from "./movement-view";
import ExerciseManagerView from "./exercise-manager";

export default function WorkoutRouter() {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    // Before mount, render nothing to avoid hydration mismatch
    // when service worker serves /workouts shell for a different route
    if (!mounted) return null;

    // /workouts/exercises
    if (pathname === "/workouts/exercises") {
        return (
            <main className="p-4 max-w-2xl mx-auto">
                <h1 className="text-black text-xl sm:text-2xl mb-4 font-bold" style={{ fontFamily: 'var(--font-caveat)' }}>
                    Exercises
                </h1>
                <ExerciseManagerView />
            </main>
        );
    }

    // /workouts/[date]/[exerciseId]
    const movementMatch = pathname.match(/^\/workouts\/(\d{4}-\d{2}-\d{2})\/(\d+)$/);
    if (movementMatch) {
        return <MovementView date={movementMatch[1]} exerciseId={parseInt(movementMatch[2])} />;
    }

    // /workouts/[date]
    const dayMatch = pathname.match(/^\/workouts\/(\d{4}-\d{2}-\d{2})$/);
    if (dayMatch) {
        return <DayView date={dayMatch[1]} />;
    }

    // /workouts (calendar)
    return (
        <main className="p-4">
            <WorkoutCalendar />
        </main>
    );
}
