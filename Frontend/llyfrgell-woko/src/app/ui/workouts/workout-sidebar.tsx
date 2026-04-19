"use client";

import {useEffect, useState} from "react";
import {WorkoutExercise} from "@/app/lib/workouts/types";
import {
    localAddExerciseToWorkout,
    localCreateWorkout,
    localRemoveExerciseFromWorkout
} from "@/app/lib/workouts/local-actions";
import {localGetTodayWorkout} from "@/app/lib/workouts/local-data";
import {useRouter} from "next/navigation";
import Link from "next/link";
import CloseIcon from '@mui/icons-material/Close';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import SettingsIcon from '@mui/icons-material/Settings';
import AddMovementModal from "./add-movement-modal";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function WorkoutSidebar({isOpen, onClose}: Props) {
    const router = useRouter();
    const [today, setToday] = useState("");
    const [workoutId, setWorkoutId] = useState<number | null>(null);
    const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            localGetTodayWorkout().then(data => {
                setToday(data.today);
                setWorkoutId(data.workoutId);
                setExercises(data.exercises);
                setLoading(false);
            });
        }
    }, [isOpen]);

    const refresh = async () => {
        const data = await localGetTodayWorkout();
        setToday(data.today);
        setWorkoutId(data.workoutId);
        setExercises(data.exercises);
    };

    const addMovement = async (exerciseId: number) => {
        let wId = workoutId;
        if (!wId) {
            wId = await localCreateWorkout(today);
            setWorkoutId(wId);
        }
        await localAddExerciseToWorkout(wId, exerciseId);
        setShowAddModal(false);
        await refresh();
        onClose();
        router.push(`/workouts/${today}/${exerciseId}`);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
                <div className="w-72 h-full bg-stone-50 border-l-2 border-amber-600 shadow-lg overflow-y-auto"
                     onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between px-3 py-2 border-b border-black/10">
                        <span className="text-black text-xs font-bold">Today</span>
                        <button type="button" onClick={onClose} className="text-black/40 hover:text-black">
                            <CloseIcon sx={{fontSize: 18, color: 'inherit'}}/>
                        </button>
                    </div>

                    {loading ? (
                        <div className="px-3 py-2 text-black/50 text-xs">Loading...</div>
                    ) : exercises.length === 0 ? (
                        <div className="px-3 py-2 text-black/50 text-xs">No exercises today.</div>
                    ) : (
                        exercises.map(ex => (
                            <div key={ex.id} className="flex items-center border-b border-black/5">
                                <button type="button" onClick={() => {
                                    onClose();
                                    router.push(`/workouts/${today}/${ex.exerciseId}`);
                                }}
                                        className="flex-1 text-left px-3 py-2">
                                    <div className="text-black text-sm font-semibold">{ex.exerciseName}</div>
                                    <div className="text-black/50 text-xs">{ex.setCount} sets</div>
                                </button>
                                <button type="button" onClick={async () => {
                                    if (!confirm(`Remove ${ex.exerciseName} from today?`)) return;
                                    await localRemoveExerciseFromWorkout(ex.id!);
                                    await refresh();
                                }} className="text-black/20 hover:text-red-600 px-2">
                                    <CloseIcon sx={{fontSize: 14, color: 'inherit'}}/>
                                </button>
                            </div>
                        ))
                    )}

                    <button type="button" onClick={() => setShowAddModal(true)}
                            className="w-full text-left px-3 py-2 text-amber-700 font-semibold text-sm hover:text-amber-800 transition-colors">
                        + Add movement
                    </button>

                    <button type="button" onClick={() => {
                        onClose();
                        router.push(`/workouts/${today}`);
                    }}
                            className="w-full text-left px-3 py-2 text-black/50 text-sm hover:text-black transition-colors border-t border-black/5">
                        View full day →
                    </button>

                    <div className="mt-auto border-t border-black/10 px-3 py-2 flex items-center justify-between">
                        <Link href="/books" onClick={onClose}
                              className="flex items-center gap-1 text-black/40 hover:text-black text-sm transition-colors">
                            <LibraryBooksIcon sx={{fontSize: 16, color: 'inherit'}}/>
                            Library
                        </Link>
                        <Link href="/workouts/admin" onClick={onClose}
                              className="text-black/40 hover:text-black transition-colors">
                            <SettingsIcon sx={{fontSize: 18, color: 'inherit'}}/>
                        </Link>
                    </div>
                </div>
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
