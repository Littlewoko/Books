"use client";

import {useState} from "react";
import {WorkoutExercise} from "@/app/lib/workouts/types";
import {
    localAddExerciseToWorkout,
    localCopyMovementsToToday,
    localCreateWorkout,
    localRemoveExerciseFromWorkout
} from "@/app/lib/workouts/local-actions";
import {useRouter} from "next/navigation";
import Link from "next/link";
import CloseIcon from '@mui/icons-material/Close';
import AddMovementModal from "./add-movement-modal";

interface Props {
    date: string;
    workoutId: number | null;
    exercises: WorkoutExercise[];
}

export default function DayExerciseList({date, workoutId, exercises: initialExercises}: Props) {
    const router = useRouter();
    const [exercises, setExercises] = useState(initialExercises);
    const [showAddModal, setShowAddModal] = useState(false);
    const [copying, setCopying] = useState(false);
    const [copyResult, setCopyResult] = useState<string | null>(null);

    const today = new Date().toISOString().split('T')[0];
    const isToday = date === today;
    const canCopy = !isToday && exercises.length > 0;

    const handleCopyToToday = async () => {
        setCopying(true);
        const exerciseIds = exercises.map(e => e.exerciseId);
        const result = await localCopyMovementsToToday(exerciseIds);
        setCopying(false);
        if (result.added > 0) {
            setCopyResult(`${result.added} movement${result.added !== 1 ? 's' : ''} copied`);
        } else {
            setCopyResult('All movements already exist today');
        }
        router.push(`/workouts/${result.today}`);
    };

    const handleRemove = async (workoutExerciseId: number, name: string) => {
        if (!confirm(`Remove ${name} from this day?`)) return;
        await localRemoveExerciseFromWorkout(workoutExerciseId);
        setExercises(prev => prev.filter(e => e.id !== workoutExerciseId));
    };

    const addMovement = async (exerciseId: number) => {
        let wId = workoutId;
        if (!wId) {
            wId = await localCreateWorkout(date);
        }
        await localAddExerciseToWorkout(wId, exerciseId);
        setShowAddModal(false);
        router.refresh();
    };

    return (
        <>
            {exercises.length === 0 ? (
                <p className="text-black/50 text-sm mb-2">No exercises logged.</p>
            ) : (
                <div className="mb-2">
                    {exercises.map((ex) => (
                        <div key={ex.id} className="flex items-center border-b border-black/5 py-2">
                            <Link href={`/workouts/${date}/${ex.exerciseId}`} className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between">
                                    <span className="text-black text-sm font-semibold">{ex.exerciseName}</span>
                                    <span className="text-black/40 text-xs flex-shrink-0">{ex.setCount} sets</span>
                                </div>
                                <div className="text-amber-700 text-xs font-semibold">{ex.muscleGroupName}</div>
                            </Link>
                            <button type="button" onClick={() => ex.id && handleRemove(ex.id, ex.exerciseName || '')}
                                    className="text-black/20 hover:text-red-600 transition-colors p-1 ml-1 flex-shrink-0">
                                <CloseIcon sx={{fontSize: 16, color: 'inherit'}}/>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-center gap-3">
                <button type="button" onClick={() => setShowAddModal(true)}
                        className="text-amber-700 hover:text-amber-800 text-sm font-semibold py-1 transition-colors">
                    + Add movement
                </button>
                {canCopy && (
                    <button type="button" onClick={handleCopyToToday} disabled={copying}
                            className="text-black/50 hover:text-black text-sm font-semibold py-1 transition-colors disabled:text-black/20">
                        {copying ? 'Copying...' : 'Copy to today'}
                    </button>
                )}
                {copyResult && (
                    <span className="text-amber-700 text-xs font-semibold">{copyResult}</span>
                )}
            </div>

            {showAddModal && (
                <AddMovementModal
                    onSelect={addMovement}
                    onClose={() => setShowAddModal(false)}
                />
            )}
        </>
    );
}
