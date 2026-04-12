"use client";

import {useEffect, useState} from "react";
import {WorkoutExercise} from "@/app/lib/workouts/types";
import {
    localAddExerciseToWorkout,
    localCreateWorkout,
    localRemoveExerciseFromWorkout
} from "@/app/lib/workouts/local-actions";
import {
    localGetExercisesByMuscleGroup,
    localGetMuscleGroups,
    localGetRecentExercises,
    localGetTodayWorkout
} from "@/app/lib/workouts/local-data";
import {useRouter} from "next/navigation";
import Link from "next/link";
import CloseIcon from '@mui/icons-material/Close';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';

type ModalStep = "closed" | "pick" | "exercise";

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

    const [modalStep, setModalStep] = useState<ModalStep>("closed");
    const [muscleGroups, setMuscleGroups] = useState<{ id: number; name: string }[]>([]);
    const [selectedMgId, setSelectedMgId] = useState<number | null>(null);
    const [mgExercises, setMgExercises] = useState<{ id: number; name: string }[]>([]);
    const [recents, setRecents] = useState<{ id: number; name: string; muscleGroupName: string }[]>([]);
    const [loadingRecents, setLoadingRecents] = useState(false);

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

    const openAddModal = async () => {
        setModalStep("pick");
        setLoadingRecents(true);
        const [mgs, recent] = await Promise.all([localGetMuscleGroups(), localGetRecentExercises()]);
        setMuscleGroups(mgs);
        setRecents(recent);
        setLoadingRecents(false);
    };

    const selectMuscleGroup = async (mgId: number) => {
        setSelectedMgId(mgId);
        setModalStep("exercise");
        setMgExercises(await localGetExercisesByMuscleGroup(mgId));
    };

    const addMovement = async (exerciseId: number) => {
        let wId = workoutId;
        if (!wId) {
            wId = await localCreateWorkout(today);
            setWorkoutId(wId);
        }
        await localAddExerciseToWorkout(wId, exerciseId);
        setModalStep("closed");
        await refresh();
        onClose();
        router.push(`/workouts/${today}/${exerciseId}`);
    };

    const closeModal = () => {
        setModalStep("closed");
        setSelectedMgId(null);
        setMgExercises([]);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
                <div className="w-72 h-full bg-stone-50 border-l-2 border-amber-600 shadow-lg overflow-y-auto"
                     onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-black/10">
                        <span className="text-black text-xs font-bold">Today</span>
                        <button type="button" onClick={onClose} className="text-black/40 hover:text-black">
                            <CloseIcon sx={{fontSize: 18, color: 'inherit'}}/>
                        </button>
                    </div>

                    {/* Today's exercises */}
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

                    {/* Add movement */}
                    <button type="button" onClick={openAddModal}
                            className="w-full text-left px-3 py-2 text-amber-700 font-semibold text-sm hover:text-amber-800 transition-colors">
                        + Add movement
                    </button>

                    {/* Go to today */}
                    <button type="button" onClick={() => {
                        onClose();
                        router.push(`/workouts/${today}`);
                    }}
                            className="w-full text-left px-3 py-2 text-black/50 text-sm hover:text-black transition-colors border-t border-black/5">
                        View full day →
                    </button>

                    {/* Nav back to library */}
                    <div className="mt-auto border-t border-black/10 px-3 py-2">
                        <Link href="/books" onClick={onClose}
                              className="flex items-center gap-1 text-black/40 hover:text-black text-sm transition-colors">
                            <LibraryBooksIcon sx={{fontSize: 16, color: 'inherit'}}/>
                            Library
                        </Link>
                    </div>
                </div>
            </div>

            {/* Add movement modal */}
            {modalStep !== "closed" && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40"
                     onClick={closeModal}>
                    <div className="bg-stone-50 w-full sm:w-80 max-h-[80vh] overflow-y-auto"
                         onClick={e => e.stopPropagation()}>
                        <div
                            className="flex items-center justify-between p-3 border-b border-black/10 sticky top-0 bg-stone-50">
                            <span className="text-black text-sm font-bold">
                                {modalStep === "pick" ? "Add Movement" : muscleGroups.find(m => m.id === selectedMgId)?.name}
                            </span>
                            <button type="button" onClick={closeModal} className="text-black/40 hover:text-black">
                                <CloseIcon sx={{fontSize: 18, color: 'inherit'}}/>
                            </button>
                        </div>
                        <div>
                            {modalStep === "pick" && (
                                <>
                                    {!loadingRecents && recents.length > 0 && (
                                        <div>
                                            <div className="text-amber-700 text-xs font-bold px-3 pt-2 pb-1">Recent
                                            </div>
                                            {recents.map(ex => (
                                                <button key={ex.id} type="button" onClick={() => addMovement(ex.id)}
                                                        className="w-full text-left px-3 py-2 hover:bg-amber-50 transition-colors border-b border-black/5">
                                                    <span className="text-black text-sm">{ex.name}</span>
                                                    <span
                                                        className="text-amber-700 text-xs ml-2">{ex.muscleGroupName}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <div className="text-amber-700 text-xs font-bold px-3 pt-2 pb-1">By Category</div>
                                    {muscleGroups.map(mg => (
                                        <button key={mg.id} type="button" onClick={() => selectMuscleGroup(mg.id)}
                                                className="w-full text-left px-3 py-2 hover:bg-amber-50 transition-colors text-black text-sm border-b border-black/5">{mg.name}</button>
                                    ))}
                                </>
                            )}
                            {modalStep === "exercise" && (
                                <>
                                    <button type="button" onClick={() => setModalStep("pick")}
                                            className="text-amber-700 text-xs font-semibold px-3 py-2 hover:text-amber-800">←
                                        Back
                                    </button>
                                    {mgExercises.map(ex => (
                                        <button key={ex.id} type="button" onClick={() => addMovement(ex.id)}
                                                className="w-full text-left px-3 py-2 hover:bg-amber-50 transition-colors text-black text-sm border-b border-black/5">{ex.name}</button>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
