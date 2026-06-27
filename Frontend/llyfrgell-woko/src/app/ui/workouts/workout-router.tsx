"use client";

import {usePathname} from "next/navigation";
import {useEffect, useState} from "react";
import WorkoutCalendar from "./workout-calendar";
import DayView from "./day-view";
import MovementView from "./movement-view";
import ExerciseManagerView from "./exercise-manager";
import MovementDetail from "./movement-detail";

export default function WorkoutRouter() {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Before mount, render nothing to avoid hydration mismatch
    // when service worker serves /workouts shell for a different route
    if (!mounted) return null;

    // /workouts/movements/[exerciseId]
    const movementDetailMatch = pathname.match(/^\/workouts\/movements\/(-?\d+)$/);
    if (movementDetailMatch) {
        return <MovementDetail key={movementDetailMatch[1]} exerciseId={parseInt(movementDetailMatch[1])}/>;
    }

    // /workouts/movements or /workouts/exercises (support both)
    if (pathname === "/workouts/movements" || pathname === "/workouts/exercises") {
        return (
            <main className="p-4 max-w-2xl mx-auto">
                <h1 className="text-black text-xl sm:text-2xl mb-4 font-bold"
                    style={{fontFamily: 'var(--font-caveat)'}}>
                    Movements
                </h1>
                <ExerciseManagerView/>
            </main>
        );
    }

    // /workouts/[date]/[exerciseId]
    const movementMatch = pathname.match(/^\/workouts\/(\d{4}-\d{2}-\d{2})\/(-?\d+)$/);
    if (movementMatch) {
        return <MovementView key={`${movementMatch[1]}-${movementMatch[2]}`} date={movementMatch[1]}
                             exerciseId={parseInt(movementMatch[2])}/>;
    }

    // /workouts/[date]
    const dayMatch = pathname.match(/^\/workouts\/(\d{4}-\d{2}-\d{2})$/);
    if (dayMatch) {
        return <DayView key={dayMatch[1]} date={dayMatch[1]}/>;
    }

    // /workouts (calendar)
    return (
        <main className="p-4">
            <WorkoutCalendar/>
        </main>
    );
}
