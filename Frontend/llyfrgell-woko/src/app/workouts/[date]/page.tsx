"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { localGetWorkoutForDate } from "@/app/lib/workouts/local-data";
import { WorkoutExercise } from "@/app/lib/workouts/types";
import DayExerciseList from "@/app/ui/workouts/day-exercise-list";
import Link from "next/link";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function DayViewPage() {
    const params = useParams<{ date: string }>();
    const date = params.date;
    const [workoutId, setWorkoutId] = useState<number | null>(null);
    const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        localGetWorkoutForDate(date).then(data => {
            setWorkoutId(data?.workout.id ?? null);
            setExercises(data?.exercises ?? []);
            setLoaded(true);
        });
    }, [date]);

    const displayDate = new Date(date + 'T00:00:00').toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    if (!loaded) return null;

    return (
        <main className="p-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
                <Link href="/workouts" className="text-black hover:text-amber-700 transition-colors">
                    <ArrowBackIcon sx={{ fontSize: 20, color: 'inherit' }} />
                </Link>
                <h1
                    className="text-black text-xl sm:text-2xl font-bold"
                    style={{ fontFamily: 'var(--font-caveat)' }}
                >
                    {displayDate}
                </h1>
            </div>

            <DayExerciseList
                date={date}
                workoutId={workoutId}
                exercises={exercises}
            />
        </main>
    );
}
