"use client";

import {useState} from "react";
import {localGetExercisesByMuscleGroup, localGetMuscleGroups, localGetRecentExercises} from "@/app/lib/workouts/local-data";
import CloseIcon from '@mui/icons-material/Close';

type ModalStep = "pick" | "exercise";

interface Props {
    onSelect: (exerciseId: number) => void;
    onClose: () => void;
}

export default function AddMovementModal({onSelect, onClose}: Props) {
    const [step, setStep] = useState<ModalStep>("pick");
    const [muscleGroups, setMuscleGroups] = useState<{ id: number; name: string }[]>([]);
    const [selectedMgId, setSelectedMgId] = useState<number | null>(null);
    const [mgExercises, setMgExercises] = useState<{ id: number; name: string }[]>([]);
    const [recents, setRecents] = useState<{ id: number; name: string; muscleGroupName: string }[]>([]);
    const [loaded, setLoaded] = useState(false);

    // Load data on first render
    if (!loaded) {
        setLoaded(true);
        Promise.all([localGetMuscleGroups(), localGetRecentExercises()]).then(([mgs, recent]) => {
            setMuscleGroups(mgs);
            setRecents(recent);
        });
    }

    const selectMuscleGroup = async (mgId: number) => {
        setSelectedMgId(mgId);
        setStep("exercise");
        setMgExercises(await localGetExercisesByMuscleGroup(mgId));
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40"
             onClick={onClose}>
            <div className="bg-stone-50 w-full sm:w-80 max-h-[80vh] overflow-y-auto"
                 onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-3 border-b border-black/10 sticky top-0 bg-stone-50">
                    <span className="text-black text-sm font-bold">
                        {step === "pick" ? "Add Movement" : muscleGroups.find(m => m.id === selectedMgId)?.name}
                    </span>
                    <button type="button" onClick={onClose} className="text-black/40 hover:text-black">
                        <CloseIcon sx={{fontSize: 18, color: 'inherit'}}/>
                    </button>
                </div>
                <div>
                    {step === "pick" && (
                        <>
                            {recents.length > 0 && (
                                <div>
                                    <div className="text-amber-700 text-xs font-bold px-3 pt-2 pb-1">Recent</div>
                                    {recents.map(ex => (
                                        <button key={ex.id} type="button" onClick={() => onSelect(ex.id)}
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
                                        className="w-full text-left px-3 py-2 hover:bg-amber-50 transition-colors text-black text-sm border-b border-black/5">
                                    {mg.name}
                                </button>
                            ))}
                        </>
                    )}
                    {step === "exercise" && (
                        <>
                            <button type="button" onClick={() => setStep("pick")}
                                    className="text-amber-700 text-xs font-semibold px-3 py-2 hover:text-amber-800">←
                                Back
                            </button>
                            {mgExercises.map(ex => (
                                <button key={ex.id} type="button" onClick={() => onSelect(ex.id)}
                                        className="w-full text-left px-3 py-2 hover:bg-amber-50 transition-colors text-black text-sm border-b border-black/5">
                                    {ex.name}
                                </button>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
