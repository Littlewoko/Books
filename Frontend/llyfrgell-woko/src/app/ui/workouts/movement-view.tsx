"use client";

import {useEffect, useState} from "react";
import {localGetMovementScreenData} from "@/app/lib/workouts/local-data";
import {ExerciseSet, WorkoutExercise} from "@/app/lib/workouts/types";
import MovementScreen from "@/app/ui/workouts/movement-screen";
import Link from "next/link";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {useRouter} from "next/navigation";

interface Props {
    date: string;
    exerciseId: number;
}

export default function MovementView({date, exerciseId}: Props) {
    const router = useRouter();
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
                    <ArrowBackIcon sx={{fontSize: 20, color: 'inherit'}}/>
                </Link>
                <p className="text-black/50 text-sm mt-4">Exercise not found for this day.</p>
            </main>
        );
    }

    const allExercises = data?.allExercises ?? [];
    const currentIdx = allExercises.findIndex(e => e.exerciseId === exerciseId);
    const prevExercise = currentIdx > 0 ? allExercises[currentIdx - 1] : null;
    const nextExercise = currentIdx >= 0 && currentIdx < allExercises.length - 1 ? allExercises[currentIdx + 1] : null;

    return (
        <main className="p-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
                <Link href={`/workouts/${date}`} className="text-black/50 hover:text-black transition-colors">
                    <ArrowBackIcon sx={{fontSize: 20, color: 'inherit'}}/>
                </Link>
                {prevExercise && (
                    <button type="button" onClick={() => router.push(`/workouts/${date}/${prevExercise.exerciseId}`)}
                            className="text-black/40 hover:text-black transition-colors">
                        <ChevronLeftIcon sx={{fontSize: 20, color: 'inherit'}}/>
                    </button>
                )}
                <span className="text-black/40 text-xs flex-1 text-center">
                    {currentIdx >= 0 ? `${currentIdx + 1} / ${allExercises.length}` : ''}
                </span>
                {nextExercise && (
                    <button type="button" onClick={() => router.push(`/workouts/${date}/${nextExercise.exerciseId}`)}
                            className="text-black/40 hover:text-black transition-colors">
                        <ChevronRightIcon sx={{fontSize: 20, color: 'inherit'}}/>
                    </button>
                )}
            </div>
            <MovementScreen date={date} exerciseId={exerciseId} initialData={data}/>
        </main>
    );
}
