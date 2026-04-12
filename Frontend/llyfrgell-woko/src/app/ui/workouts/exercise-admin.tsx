"use client";

import {useState} from "react";
import {updateExerciseMuscleGroup, renameExercise, createMuscleGroup, updateMuscleGroupColour} from "@/app/lib/workouts/actions";
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

interface ExerciseRow {
    id: number;
    name: string;
    muscleGroupId: number;
    muscleGroupName: string;
    totalSets: number;
}

interface MuscleGroup {
    id: number;
    name: string;
    colour: string;
}

interface Props {
    exercises: ExerciseRow[];
    muscleGroups: MuscleGroup[];
}

export default function ExerciseAdmin({exercises: initial, muscleGroups: initialMgs}: Props) {
    const [exercises, setExercises] = useState(initial);
    const [mgs, setMgs] = useState(initialMgs);
    const [filter, setFilter] = useState("");
    const [mgFilter, setMgFilter] = useState<number | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [saving, setSaving] = useState<number | null>(null);
    const [newMgName, setNewMgName] = useState("");
    const [addingMg, setAddingMg] = useState(false);
    const [showMgEditor, setShowMgEditor] = useState(false);

    const handleAddMuscleGroup = async () => {
        const name = newMgName.trim();
        if (!name || mgs.some(m => m.name.toLowerCase() === name.toLowerCase())) return;
        setAddingMg(true);
        const id = await createMuscleGroup(name);
        setMgs(prev => [...prev, {id, name, colour: '#737373'}].sort((a, b) => a.name.localeCompare(b.name)));
        setNewMgName("");
        setAddingMg(false);
    };

    const handleColourChange = async (mgId: number, colour: string) => {
        setMgs(prev => prev.map(m => m.id === mgId ? {...m, colour} : m));
        await updateMuscleGroupColour(mgId, colour);
    };

    const filtered = exercises.filter(ex => {
        if (mgFilter && ex.muscleGroupId !== mgFilter) return false;
        if (filter && !ex.name.toLowerCase().includes(filter.toLowerCase())) return false;
        return true;
    });

    const handleMuscleGroupChange = async (exerciseId: number, newMgId: number) => {
        setSaving(exerciseId);
        await updateExerciseMuscleGroup(exerciseId, newMgId);
        const mg = mgs.find(m => m.id === newMgId);
        setExercises(prev => prev.map(ex =>
            ex.id === exerciseId ? {...ex, muscleGroupId: newMgId, muscleGroupName: mg?.name || ''} : ex
        ));
        setSaving(null);
    };

    const startRename = (ex: ExerciseRow) => {
        setEditingId(ex.id);
        setEditName(ex.name);
    };

    const handleRename = async () => {
        if (!editingId || !editName.trim()) return;
        setSaving(editingId);
        await renameExercise(editingId, editName.trim());
        setExercises(prev => prev.map(ex =>
            ex.id === editingId ? {...ex, name: editName.trim()} : ex
        ));
        setEditingId(null);
        setSaving(null);
    };

    const inputClass = "w-full bg-transparent border-b-2 border-black/20 text-black text-sm py-1 focus:outline-none focus:border-amber-600";

    return (
        <div>
            {/* Muscle group colours */}
            <div className="mb-4">
                <button type="button" onClick={() => setShowMgEditor(!showMgEditor)}
                        className="text-amber-700 text-xs font-bold hover:text-amber-800 transition-colours">
                    {showMgEditor ? '▾ Muscle Group Colours' : '▸ Muscle Group Colours'}
                </button>
                {showMgEditor && (
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
                        {mgs.map(mg => (
                            <div key={mg.id} className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={mg.colour}
                                    onChange={e => handleColourChange(mg.id, e.target.value)}
                                    className="w-6 h-6 border-0 bg-transparent cursor-pointer p-0"
                                />
                                <span className="text-black text-xs">{mg.name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <input
                    type="text"
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    placeholder="Search exercises..."
                    className={`${inputClass} sm:w-64`}
                />
                <select
                    value={mgFilter || ""}
                    onChange={e => setMgFilter(e.target.value ? parseInt(e.target.value) : null)}
                    className="bg-transparent border-b-2 border-black/20 text-black text-sm py-1 focus:outline-none focus:border-amber-600"
                >
                    <option value="">All muscle groups</option>
                    {mgs.map(mg => (
                        <option key={mg.id} value={mg.id}>{mg.name}</option>
                    ))}
                </select>
                <span className="text-black/40 text-xs self-end">{filtered.length} exercises</span>
            </div>

            {/* Add muscle group */}
            <div className="flex gap-1 items-end mb-3">
                <input
                    type="text"
                    value={newMgName}
                    onChange={e => setNewMgName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddMuscleGroup()}
                    placeholder="New muscle group..."
                    className={`${inputClass} sm:w-52`}
                />
                <button type="button" onClick={handleAddMuscleGroup} disabled={addingMg || !newMgName.trim()}
                        className="text-amber-700 hover:text-amber-800 text-xs font-bold py-1 px-1 flex-shrink-0 disabled:text-black/20">
                    + Add
                </button>
            </div>

            {/* Exercise table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                    <tr className="text-left text-amber-700 text-xs font-bold border-b border-black/10">
                        <th className="py-2 pr-2">Exercise</th>
                        <th className="py-2 pr-2">Muscle Group</th>
                        <th className="py-2 text-right w-16">Sets</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filtered.map(ex => (
                        <tr key={ex.id} className={`border-b border-black/5 ${saving === ex.id ? 'opacity-50' : ''}`}>
                            <td className="py-2 pr-2">
                                {editingId === ex.id ? (
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleRename()}
                                            className={inputClass}
                                            autoFocus
                                        />
                                        <button type="button" onClick={handleRename}
                                                className="text-green-600 p-0.5">
                                            <CheckIcon sx={{fontSize: 16, color: 'inherit'}}/>
                                        </button>
                                        <button type="button" onClick={() => setEditingId(null)}
                                                className="text-black/40 p-0.5">
                                            <CloseIcon sx={{fontSize: 16, color: 'inherit'}}/>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        <span className="text-black">{ex.name}</span>
                                        <button type="button" onClick={() => startRename(ex)}
                                                className="text-black/20 hover:text-amber-700 p-0.5">
                                            <EditIcon sx={{fontSize: 14, color: 'inherit'}}/>
                                        </button>
                                    </div>
                                )}
                            </td>
                            <td className="py-2 pr-2">
                                <select
                                    value={ex.muscleGroupId}
                                    onChange={e => handleMuscleGroupChange(ex.id, parseInt(e.target.value))}
                                    disabled={saving === ex.id}
                                    className="bg-transparent text-black text-sm py-0.5 focus:outline-none cursor-pointer hover:text-amber-700"
                                >
                                    {mgs.map(mg => (
                                        <option key={mg.id} value={mg.id}>{mg.name}</option>
                                    ))}
                                </select>
                            </td>
                            <td className="py-2 text-right text-black/40">{ex.totalSets}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
