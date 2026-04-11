"use client";

import { useState } from "react";
import { WorkoutExercise } from "@/app/lib/workouts/types";
import { removeExerciseFromWorkout, addExerciseToWorkout, createWorkout } from "@/app/lib/workouts/actions";
import { getMuscleGroups, getExercisesByMuscleGroup, getRecentExercises } from "@/app/lib/workouts/sidebar-actions";
import { copyMovementsToToday } from "@/app/lib/workouts/calendar-actions";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';

type ModalStep = "closed" | "pick" | "exercise";

interface Props { date: string; workoutId: number | null; exercises: WorkoutExercise[]; }

export default function DayExerciseList({ date, workoutId, exercises: initialExercises }: Props) {
    const router = useRouter();
    const [exercises, setExercises] = useState(initialExercises);
    const [modalStep, setModalStep] = useState<ModalStep>("closed");
    const [muscleGroups, setMuscleGroups] = useState<{ id: number; name: string }[]>([]);
    const [mgExercises, setMgExercises] = useState<{ id: number; name: string }[]>([]);
    const [selectedMgId, setSelectedMgId] = useState<number | null>(null);
    const [recents, setRecents] = useState<{ id: number; name: string; muscleGroupName: string }[]>([]);
    const [loadingRecents, setLoadingRecents] = useState(false);
    const [copying, setCopying] = useState(false);
    const [copyResult, setCopyResult] = useState<string | null>(null);

    const today = new Date().toISOString().split('T')[0];
    const isToday = date === today;
    const canCopy = !isToday && exercises.length > 0;

    const handleCopyToToday = async () => {
        setCopying(true);
        const exerciseIds = exercises.map(e => e.exerciseId);
        const result = await copyMovementsToToday(exerciseIds);
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
        await removeExerciseFromWorkout(workoutExerciseId);
        setExercises(prev => prev.filter(e => e.id !== workoutExerciseId));
    };

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
        let wId = workoutId;
        if (!wId) { wId = await createWorkout(date); }
        await addExerciseToWorkout(wId, exerciseId);
        setModalStep("closed"); router.refresh();
    };

    const closeModal = () => { setModalStep("closed"); setSelectedMgId(null); setMgExercises([]); };

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
                                <CloseIcon sx={{ fontSize: 16, color: 'inherit' }} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-center gap-3">
                <button type="button" onClick={openAddModal}
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

            {modalStep !== "closed" && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40" onClick={closeModal}>
                    <div className="bg-stone-50 w-full sm:w-80 max-h-[80vh] overflow-y-auto sm:rounded-t-none" onClick={e => e.stopPropagation()}>
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
