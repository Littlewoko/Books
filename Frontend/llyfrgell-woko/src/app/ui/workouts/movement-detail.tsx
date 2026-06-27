"use client";

import {useEffect, useState} from "react";
import {localGetExerciseDetail, localGetMuscleGroups, localGetPersonalBests} from "@/app/lib/workouts/local-data";
import {renameExercise, updateExerciseMuscleGroup} from "@/app/lib/workouts/actions";
import {db} from "@/app/lib/workouts/local-db";
import type {PersonalBest} from "@/app/lib/workouts/types";
import Link from "next/link";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

interface Props {
    exerciseId: number;
}

function collapsePbs(pbs: PersonalBest[]): { reps: string; weight: number; weightUnit: string }[] {
    if (pbs.length === 0) return [];
    const collapsed: { reps: string; weight: number; weightUnit: string }[] = [];
    let i = 0;
    while (i < pbs.length) {
        const currentWeight = pbs[i].weight;
        const startRep = pbs[i].reps;
        let endRep = startRep;
        while (i + 1 < pbs.length && pbs[i + 1].weight === currentWeight) {
            i++;
            endRep = pbs[i].reps;
        }
        collapsed.push({
            reps: startRep === endRep ? `${startRep}` : `${startRep}–${endRep}`,
            weight: currentWeight,
            weightUnit: pbs[i].weightUnit
        });
        i++;
    }
    return collapsed;
}

export default function MovementDetail({exerciseId}: Props) {
    const [exercise, setExercise] = useState<{
        id: number;
        name: string;
        muscleGroupId: number;
        muscleGroupName: string
    } | null>(null);
    const [sessions, setSessions] = useState<{
        date: string;
        setCount: number;
        topSet: { weight: number; reps: number } | null
    }[]>([]);
    const [pbs, setPbs] = useState<PersonalBest[]>([]);
    const [muscleGroups, setMuscleGroups] = useState<{ id: number; name: string }[]>([]);
    const [loaded, setLoaded] = useState(false);

    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editMgId, setEditMgId] = useState<number>(0);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        Promise.all([
            localGetExerciseDetail(exerciseId),
            localGetPersonalBests(exerciseId),
            localGetMuscleGroups(),
        ]).then(([detail, pbData, mgs]) => {
            if (detail) {
                setExercise(detail.exercise);
                setSessions(detail.sessions);
            }
            setPbs(pbData);
            setMuscleGroups(mgs);
            setLoaded(true);
        });
    }, [exerciseId]);

    const startEdit = () => {
        if (!exercise) return;
        setEditName(exercise.name);
        setEditMgId(exercise.muscleGroupId);
        setEditing(true);
    };

    const handleSave = async () => {
        if (!exercise || !editName.trim()) return;
        setSaving(true);
        const nameChanged = editName.trim() !== exercise.name;
        const mgChanged = editMgId !== exercise.muscleGroupId;

        if (nameChanged) await renameExercise(exercise.id, editName.trim());
        if (mgChanged) await updateExerciseMuscleGroup(exercise.id, editMgId);

        // Update local DB
        const newMg = muscleGroups.find(m => m.id === editMgId);
        await db.exercises.update(exercise.id, {
            name: editName.trim(),
            muscleGroupId: editMgId,
            muscleGroupName: newMg?.name || exercise.muscleGroupName,
        });

        setExercise({
            ...exercise,
            name: editName.trim(),
            muscleGroupId: editMgId,
            muscleGroupName: newMg?.name || exercise.muscleGroupName
        });
        setEditing(false);
        setSaving(false);
    };

    const formatDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString("en-GB", {day: "numeric", month: "short", year: "numeric"});
    };

    if (!loaded) return null;
    if (!exercise) return <p className="text-black text-sm p-4">Exercise not found.</p>;

    const collapsedPbs = collapsePbs(pbs);

    return (
        <main className="p-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
                <Link href="/workouts/movements" className="text-black hover:text-amber-700 transition-colors">
                    <ArrowBackIcon sx={{fontSize: 20, color: 'inherit'}}/>
                </Link>
                {editing ? (
                    <div className="flex items-center gap-2 flex-1">
                        <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                               className="bg-transparent border-b-2 border-amber-600 text-black text-xl font-bold py-0.5 focus:outline-none flex-1"
                               style={{fontFamily: 'var(--font-caveat)'}} autoFocus/>
                        <button type="button" onClick={handleSave} disabled={saving} className="text-green-600 p-0.5">
                            <CheckIcon sx={{fontSize: 20, color: 'inherit'}}/>
                        </button>
                        <button type="button" onClick={() => setEditing(false)} className="text-black/40 p-0.5">
                            <CloseIcon sx={{fontSize: 20, color: 'inherit'}}/>
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 flex-1">
                        <h1 className="text-black text-xl sm:text-2xl font-bold"
                            style={{fontFamily: 'var(--font-caveat)'}}>
                            {exercise.name}
                        </h1>
                        <button type="button" onClick={startEdit} className="text-black/20 hover:text-amber-700">
                            <EditIcon sx={{fontSize: 16, color: 'inherit'}}/>
                        </button>
                    </div>
                )}
            </div>

            {editing && (
                <div className="mb-4">
                    <label className="text-amber-700 text-xs font-semibold">Muscle Group</label>
                    <select value={editMgId} onChange={e => setEditMgId(Number(e.target.value))}
                            className="block bg-transparent border-b-2 border-black/20 text-black text-sm py-1 focus:outline-none focus:border-amber-600 w-full sm:w-64">
                        {muscleGroups.map(mg => <option key={mg.id} value={mg.id}>{mg.name}</option>)}
                    </select>
                </div>
            )}

            {!editing && (
                <span className="text-amber-700 text-xs font-semibold">{exercise.muscleGroupName}</span>
            )}

            {/* PBs */}
            {collapsedPbs.length > 0 && (
                <section className="mt-4">
                    <h2 className="text-amber-700 text-xs font-bold mb-1">Personal Bests</h2>
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="text-left text-black text-xs">
                            <th className="py-1">Reps</th>
                            <th className="py-1">Best</th>
                        </tr>
                        </thead>
                        <tbody>
                        {collapsedPbs.map(pb => (
                            <tr key={pb.reps} className="border-b border-black/5">
                                <td className="py-1 text-black">{pb.reps}</td>
                                <td className="py-1 text-black font-semibold">{pb.weight} {pb.weightUnit}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </section>
            )}

            {/* History dates */}
            <section className="mt-4">
                <h2 className="text-amber-700 text-xs font-bold mb-1">History
                    ({sessions.length} sessions, {sessions.reduce((sum, s) => sum + s.setCount, 0)} sets)</h2>
                {sessions.length === 0 ? (
                    <p className="text-black text-sm">No sessions recorded.</p>
                ) : (
                    <div>
                        <div className="grid grid-cols-[1fr_auto_auto] gap-4 py-1 border-b border-black/10">
                            <span className="text-amber-700 text-xs font-bold">Date</span>
                            <span className="text-amber-700 text-xs font-bold text-right w-8">Sets</span>
                            <span className="text-amber-700 text-xs font-bold text-right w-16">Top</span>
                        </div>
                        {sessions.map(s => (
                            <Link key={s.date} href={`/workouts/${s.date}/${exerciseId}`}
                                  className="grid grid-cols-[1fr_auto_auto] gap-4 items-center py-1.5 border-b border-black/5 text-black hover:text-amber-700 transition-colors">
                                <span className="text-sm">{formatDate(s.date)}</span>
                                <span className="text-xs text-right w-8">{s.setCount}</span>
                                <span
                                    className="text-xs text-right w-16">{s.topSet ? `${s.topSet.weight}×${s.topSet.reps}` : '–'}</span>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
