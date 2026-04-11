"use client";

import { useState, useEffect } from "react";
import { createExercise, createMuscleGroup } from "@/app/lib/workouts/actions";
import { getMuscleGroups, getExercisesByMuscleGroup } from "@/app/lib/workouts/sidebar-actions";

export default function ExerciseManager() {
    const [muscleGroups, setMuscleGroups] = useState<{ id: number; name: string }[]>([]);
    const [selectedMg, setSelectedMg] = useState<number | null>(null);
    const [exercises, setExercises] = useState<{ id: number; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMgName, setNewMgName] = useState("");
    const [newExName, setNewExName] = useState("");

    const loadMuscleGroups = async () => { setMuscleGroups(await getMuscleGroups()); setLoading(false); };
    const loadExercises = async (mgId: number) => { setExercises(await getExercisesByMuscleGroup(mgId)); };

    useEffect(() => { loadMuscleGroups(); }, []);
    useEffect(() => { if (selectedMg) loadExercises(selectedMg); else setExercises([]); }, [selectedMg]);

    const handleAddMuscleGroup = async () => {
        if (!newMgName.trim()) return;
        await createMuscleGroup(newMgName.trim()); setNewMgName(""); await loadMuscleGroups();
    };

    const handleAddExercise = async () => {
        if (!newExName.trim() || !selectedMg) return;
        await createExercise(newExName.trim(), selectedMg); setNewExName(""); await loadExercises(selectedMg);
    };

    const inputClass = "w-full bg-transparent border-b-2 border-black/20 text-black text-sm py-1 focus:outline-none focus:border-amber-600";

    return (
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="sm:w-1/3">
                <div className="text-amber-700 text-xs font-bold mb-1">Muscle Groups</div>
                {loading ? (
                    <p className="text-black/50 text-xs">Loading...</p>
                ) : (
                    muscleGroups.map(mg => (
                        <button key={mg.id} type="button" onClick={() => setSelectedMg(mg.id)}
                            className={`block w-full text-left text-sm py-1.5 px-1 border-b border-black/5 transition-colors ${
                                selectedMg === mg.id ? 'text-amber-700 font-bold bg-amber-50' : 'text-black hover:bg-amber-50'
                            }`}>{mg.name}</button>
                    ))
                )}
                <div className="mt-2 flex gap-1 items-end">
                    <input type="text" value={newMgName} onChange={e => setNewMgName(e.target.value)}
                        placeholder="New group" onKeyDown={e => e.key === 'Enter' && handleAddMuscleGroup()} className={inputClass} />
                    <button type="button" onClick={handleAddMuscleGroup} className="text-amber-700 hover:text-amber-800 text-xs font-bold py-1 px-1 flex-shrink-0">+ Add</button>
                </div>
            </div>

            <div className="sm:w-2/3">
                {selectedMg ? (
                    <>
                        <div className="text-amber-700 text-xs font-bold mb-1">
                            {muscleGroups.find(m => m.id === selectedMg)?.name}
                        </div>
                        {exercises.length === 0 ? (
                            <p className="text-black/50 text-xs">No exercises.</p>
                        ) : (
                            exercises.map(ex => (
                                <div key={ex.id} className="text-black text-sm py-1.5 border-b border-black/5">{ex.name}</div>
                            ))
                        )}
                        <div className="mt-2 flex gap-1 items-end">
                            <input type="text" value={newExName} onChange={e => setNewExName(e.target.value)}
                                placeholder="New exercise" onKeyDown={e => e.key === 'Enter' && handleAddExercise()} className={inputClass} />
                            <button type="button" onClick={handleAddExercise} className="text-amber-700 hover:text-amber-800 text-xs font-bold py-1 px-1 flex-shrink-0">+ Add</button>
                        </div>
                    </>
                ) : (
                    <p className="text-black/50 text-sm">Select a muscle group.</p>
                )}
            </div>
        </div>
    );
}
