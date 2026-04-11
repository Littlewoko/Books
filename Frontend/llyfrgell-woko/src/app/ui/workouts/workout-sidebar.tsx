"use client";

import { useState } from "react";
import { WorkoutExercise } from "@/app/lib/workouts/types";
import { addExerciseToWorkout, removeExerciseFromWorkout } from "@/app/lib/workouts/actions";
import { getMuscleGroups, getExercisesByMuscleGroup, getRecentExercises } from "@/app/lib/workouts/sidebar-actions";
import { useRouter } from "next/navigation";
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import MenuIcon from '@mui/icons-material/Menu';

interface Props { date: string; workoutId: number; currentExerciseId: number; exercises: WorkoutExercise[]; }
type ModalStep = "closed" | "pick" | "exercise";

export default function WorkoutSidebar({ date, workoutId, currentExerciseId, exercises }: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [modalStep, setModalStep] = useState<ModalStep>("closed");
    const [muscleGroups, setMuscleGroups] = useState<{ id: number; name: string }[]>([]);
    const [selectedMgId, setSelectedMgId] = useState<number | null>(null);
    const [mgExercises, setMgExercises] = useState<{ id: number; name: string }[]>([]);
    const [recents, setRecents] = useState<{ id: number; name: string; muscleGroupName: string }[]>([]);
    const [loadingRecents, setLoadingRecents] = useState(false);

    const openAddModal = async () => {
        setModalStep("pick"); setLoadingRecents(true);
        const [mgs, recent] = await Promise.all([getMuscleGroups(), getRecentExercises()]);
        setMuscleGroups(mgs); setRecents(recent); setLoadingRecents(false);
    };

    const selectMuscleGroup = async (mgId: number) => {
        setSelectedMgId(mgId); setModalStep("exercise");
        setMgExercises(await getExercisesByMuscleGroup(mgId));
    };

    const addMovement = async (exerciseId: number) => {
        await addExerciseToWorkout(workoutId, exerciseId);
        setModalStep("closed"); router.push(`/workouts/${date}/${exerciseId}`); router.refresh();
    };

    const closeModal = () => { setModalStep("closed"); setSelectedMgId(null); setMgExercises([]); };

    return (
        <>
            <button type="button" onClick={() => setOpen(true)}
                className="fixed right-3 bottom-3 z-40 bg-amber-600 rounded-full p-2.5 text-white shadow-md hover:bg-amber-600">
                <MenuIcon sx={{ fontSize: 22, color: 'inherit' }} />
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setOpen(false)}>
                    <div className="w-64 h-full bg-stone-50 border-l-2 border-amber-600 shadow-lg overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-3 py-2 border-b border-black/10">
                            <span className="text-black text-xs font-bold">{exercises.length} exercise{exercises.length !== 1 ? 's' : ''}</span>
                            <button type="button" onClick={() => setOpen(false)} className="text-black/40 hover:text-black">
                                <CloseIcon sx={{ fontSize: 18, color: 'inherit' }} />
                            </button>
                        </div>

                        {exercises.map(ex => (
                            <div key={ex.id} className={`flex items-center border-b border-black/5 ${ex.exerciseId === currentExerciseId ? 'bg-amber-50 border-l-2 border-l-amber-600' : ''}`}>
                                <button type="button" onClick={() => { setOpen(false); router.push(`/workouts/${date}/${ex.exerciseId}`); }}
                                    className="flex-1 text-left px-3 py-2">
                                    <div className="text-black text-sm font-semibold">{ex.exerciseName}</div>
                                    <div className="text-black/50 text-xs">{ex.setCount} sets</div>
                                </button>
                                <button type="button" onClick={async () => {
                                    await removeExerciseFromWorkout(ex.id!);
                                    if (ex.exerciseId === currentExerciseId) router.push(`/workouts/${date}`);
                                    router.refresh();
                                }} className="text-black/20 hover:text-red-600 px-2">
                                    <CloseIcon sx={{ fontSize: 14, color: 'inherit' }} />
                                </button>
                            </div>
                        ))}

                        <button type="button" onClick={openAddModal}
                            className="w-full text-left px-3 py-2 text-amber-700 font-semibold text-sm hover:text-amber-800 transition-colors">
                            + Add movement
                        </button>
                    </div>
                </div>
            )}

            {modalStep !== "closed" && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40" onClick={closeModal}>
                    <div className="bg-stone-50 w-full sm:w-80 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-3 border-b border-black/10 sticky top-0 bg-stone-50">
                            <span className="text-black text-sm font-bold">
                                {modalStep === "pick" ? "Add Movement" : muscleGroups.find(m => m.id === selectedMgId)?.name}
                            </span>
                            <button type="button" onClick={closeModal} className="text-black/40 hover:text-black">
                                <CloseIcon sx={{ fontSize: 18, color: 'inherit' }} />
                            </button>
                        </div>
                        <div>
                            {modalStep === "pick" && (
                                <>
                                    {!loadingRecents && recents.length > 0 && (
                                        <div>
                                            <div className="text-amber-700 text-xs font-bold px-3 pt-2 pb-1">Recent</div>
                                            {recents.map(ex => (
                                                <button key={ex.id} type="button" onClick={() => addMovement(ex.id)}
                                                    className="w-full text-left px-3 py-2 hover:bg-amber-50 transition-colors border-b border-black/5">
                                                    <span className="text-black text-sm">{ex.name}</span>
                                                    <span className="text-amber-700 text-xs ml-2">{ex.muscleGroupName}</span>
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
                                    <button type="button" onClick={() => setModalStep("pick")} className="text-amber-700 text-xs font-semibold px-3 py-2 hover:text-amber-800">← Back</button>
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
