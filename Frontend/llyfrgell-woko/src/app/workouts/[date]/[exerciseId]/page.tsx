"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { localGetMovementScreenData } from "@/app/lib/workouts/local-data";
import { ExerciseSet, WorkoutExercise } from "@/app/lib/workouts/types";
import MovementScreen from "@/app/ui/workouts/movement-screen";
import Link from "next/link";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function MovementPage() {
    const params = useParams<{ date: string; exerciseId: string }>();
    const date = params.date;
    const exerciseId = parseInt(params.exerciseId);

    const [data, setData] = useState<{
        workoutExerciseId: number;
        exerciseName: string;
        muscleGroupName: string;
        sets: ExerciseSet[];
        allExercises: WorkoutExercise[];
    } | null>(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        localGetMovementScreenData(date, exerciseId).then(d => {
            if (d) {
                setData({
                    workoutExerciseId: d.workoutExerciseId,
                    exerciseName: d.exerciseName,
                    muscleGroupName: d.muscleGroupName,
                    sets: d.sets,
                    allExercises: d.allExercises,
                });
            }
            setLoaded(true);
        });
    }, [date, exerciseId]);

    if (!loaded) return null;

    if (!data) {
        return (
            <main className="p-4 max-w-2xl mx-auto">
                <Link href={`/workouts/${date}`} className="text-black/50 hover:text-black transition-colors">
                    <ArrowBackIcon sx={{ fontSize: 20, color: 'inherit' }} />
                </Link>
                <p className="text-black/50 text-sm mt-4">Exercise not found for this day.</p>
            </main>
        );
    }

    return (
        <main className="p-4 max-w-2xl mx-auto">
            <div className="mb-2">
                <Link href={`/workouts/${date}`} className="text-black/50 hover:text-black transition-colors">
                    <ArrowBackIcon sx={{ fontSize: 20, color: 'inherit' }} />
                </Link>
            </div>
            <MovementScreen
                date={date}
                exerciseId={exerciseId}
                initialData={data}
            />
        </main>
    );
}
