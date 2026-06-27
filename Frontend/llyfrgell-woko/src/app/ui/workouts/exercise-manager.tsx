"use client";

import {useEffect, useState} from "react";
import {localCreateExercise, localCreateMuscleGroup} from "@/app/lib/workouts/local-actions";
import {localGetExercisesByMuscleGroup, localGetMuscleGroups} from "@/app/lib/workouts/local-data";
import Link from "next/link";

interface MuscleGroupWithExercises {
    id: number;
    name: string;
    exercises: { id: number; name: string }[];
}

export default function ExerciseManager() {
    const [groups, setGroups] = useState<MuscleGroupWithExercises[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");
    const [expanded, setExpanded] = useState<Set<number>>(new Set());
    const [newMgName, setNewMgName] = useState("");
    const [newExName, setNewExName] = useState("");
    const [newExMgId, setNewExMgId] = useState<number | "">("");

    const load = async () => {
        const mgs = await localGetMuscleGroups();
        const all = await Promise.all(mgs.map(async mg => ({
            id: mg.id,
            name: mg.name,
            exercises: await localGetExercisesByMuscleGroup(mg.id),
        })));
        setGroups(all);
        setLoading(false);
    };

    useEffect(() => {
        load();
    }, []);

    const toggleGroup = (id: number) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleAddMuscleGroup = async () => {
        if (!newMgName.trim()) return;
        await localCreateMuscleGroup(newMgName.trim());
        setNewMgName("");
        await load();
    };

    const handleAddExercise = async () => {
        if (!newExName.trim() || !newExMgId) return;
        await localCreateExercise(newExName.trim(), newExMgId as number);
        setNewExName("");
        await load();
    };

    const isFiltering = filter.length > 0;
    const filtered = isFiltering
        ? groups.map(g => ({
            ...g,
            exercises: g.exercises.filter(ex => ex.name.toLowerCase().includes(filter.toLowerCase())),
        })).filter(g => g.exercises.length > 0)
        : groups;

    const inputClass = "w-full bg-transparent border-b-2 border-black/20 text-black text-sm py-1 focus:outline-none focus:border-amber-600";

    if (loading) return null;

    return (
        <div>
            <input
                type="text"
                value={filter}
                onChange={e => setFilter(e.target.value)}
                placeholder="Search movements..."
                className={`${inputClass} mb-4`}
            />

            {filtered.map(g => {
                const isOpen = isFiltering || expanded.has(g.id);
                return (
                    <div key={g.id} className="mb-1">
                        <button type="button" onClick={() => toggleGroup(g.id)}
                                className="w-full flex items-center justify-between py-2 px-1 border-b border-black/10">
                            <span className="text-amber-700 text-sm font-bold">{g.name}</span>
                            <span className="text-black text-xs">
                                {isOpen ? '▾' : '▸'} {g.exercises.length}
                            </span>
                        </button>
                        {isOpen && g.exercises.map(ex => (
                            <Link key={ex.id} href={`/workouts/movements/${ex.id}`}
                                  className="block text-black text-sm py-1.5 px-3 border-b border-black/5 hover:text-amber-700 transition-colors">
                                {ex.name}
                            </Link>
                        ))}
                    </div>
                );
            })}

            {/* Add exercise */}
            <div className="mt-4 border-t border-black/10 pt-3">
                <div className="text-amber-700 text-xs font-bold mb-1">Add Movement</div>
                <div className="flex gap-2 items-end flex-wrap">
                    <input type="text" value={newExName} onChange={e => setNewExName(e.target.value)}
                           placeholder="Name" onKeyDown={e => e.key === 'Enter' && handleAddExercise()}
                           className={`${inputClass} flex-1 min-w-[120px]`}/>
                    <select value={newExMgId} onChange={e => setNewExMgId(e.target.value ? Number(e.target.value) : "")}
                            className="bg-transparent border-b-2 border-black/20 text-black text-sm py-1 focus:outline-none focus:border-amber-600">
                        <option value="">Group</option>
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <button type="button" onClick={handleAddExercise} disabled={!newExName.trim() || !newExMgId}
                            className="text-amber-700 hover:text-amber-800 text-xs font-bold py-1 px-1 disabled:text-black/40">+
                        Add
                    </button>
                </div>
            </div>

            {/* Add muscle group */}
            <div className="mt-3">
                <div className="flex gap-1 items-end">
                    <input type="text" value={newMgName} onChange={e => setNewMgName(e.target.value)}
                           placeholder="New muscle group" onKeyDown={e => e.key === 'Enter' && handleAddMuscleGroup()}
                           className={`${inputClass} max-w-[200px]`}/>
                    <button type="button" onClick={handleAddMuscleGroup} disabled={!newMgName.trim()}
                            className="text-amber-700 hover:text-amber-800 text-xs font-bold py-1 px-1 disabled:text-black/40">+
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
}
