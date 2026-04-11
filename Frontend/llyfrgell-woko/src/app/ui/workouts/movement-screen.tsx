"use client";

import { useState, useEffect, useCallback } from "react";
import { ExerciseSet, ExerciseHistory, PersonalBest, WorkoutExercise } from "@/app/lib/workouts/types";
import { addSet, updateSet, deleteSet } from "@/app/lib/workouts/actions";
import { getExerciseHistory, getPersonalBests, getMovementScreenData } from "@/app/lib/workouts/movement-actions";
import { getRepMaxTable, calculateOneRepMax } from "@/app/lib/workouts/calculator";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

type Tab = "track" | "history" | "pbs";

interface Props {
    date: string;
    exerciseId: number;
    initialData: {
        workoutExerciseId: number;
        exerciseName: string;
        muscleGroupName: string;
        sets: ExerciseSet[];
        allExercises: WorkoutExercise[];
    };
}

export default function MovementScreen({ date, exerciseId, initialData }: Props) {
    const [tab, setTab] = useState<Tab>("track");
    const [sets, setSets] = useState<ExerciseSet[]>(initialData.sets);
    const [history, setHistory] = useState<ExerciseHistory[]>([]);
    const [pbs, setPbs] = useState<PersonalBest[]>([]);
    const [loadedHistory, setLoadedHistory] = useState(false);
    const [loadedPbs, setLoadedPbs] = useState(false);

    // New set form
    const [newWeight, setNewWeight] = useState("");
    const [newReps, setNewReps] = useState("");
    const [newNotes, setNewNotes] = useState("");
    const [adding, setAdding] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editWeight, setEditWeight] = useState("");
    const [editReps, setEditReps] = useState("");
    const [editNotes, setEditNotes] = useState("");

    // Calculator
    const [calcWeight, setCalcWeight] = useState("");
    const [calcReps, setCalcReps] = useState("");

    const refreshSets = useCallback(async () => {
        const data = await getMovementScreenData(date, exerciseId);
        if (data) setSets(data.sets);
    }, [date, exerciseId]);

    useEffect(() => {
        if (tab === "history" && !loadedHistory) {
            getExerciseHistory(exerciseId).then(h => {
                setHistory(h);
                setLoadedHistory(true);
            });
        }
        if ((tab === "pbs") && !loadedPbs) {
            getPersonalBests(exerciseId).then(p => {
                setPbs(p);
                setLoadedPbs(true);
            });
        }
    }, [tab, exerciseId, loadedHistory, loadedPbs]);

    const handleAddSet = async () => {
        if (!newWeight && !newReps) return;
        setAdding(true);
        await addSet(
            initialData.workoutExerciseId,
            newWeight ? parseFloat(newWeight) : null,
            "kgs",
            newReps ? parseInt(newReps) : null,
            newNotes || undefined
        );
        setNewWeight("");
        setNewReps("");
        setNewNotes("");
        await refreshSets();
        setAdding(false);
        setLoadedHistory(false);
        setLoadedPbs(false);
    };

    const startEdit = (s: ExerciseSet) => {
        setEditingId(s.id!);
        setEditWeight(s.weight != null ? String(s.weight) : "");
        setEditReps(s.reps != null ? String(s.reps) : "");
        setEditNotes(s.notes || "");
    };

    const cancelEdit = () => setEditingId(null);

    const handleSaveEdit = async () => {
        if (editingId == null) return;
        await updateSet(
            editingId,
            editWeight ? parseFloat(editWeight) : null,
            "kgs",
            editReps ? parseInt(editReps) : null,
            editNotes || undefined
        );
        setEditingId(null);
        await refreshSets();
        setLoadedHistory(false);
        setLoadedPbs(false);
    };

    const handleDeleteSet = async (setId: number) => {
        await deleteSet(setId);
        await refreshSets();
        setLoadedHistory(false);
        setLoadedPbs(false);
    };

    const pbMap = new Map<string, boolean>();
    if (loadedPbs) {
        for (const pb of pbs) {
            pbMap.set(`${pb.reps}-${pb.weight}`, true);
        }
    }

    const calcTable = calcWeight && calcReps
        ? getRepMaxTable(parseFloat(calcWeight), parseInt(calcReps))
        : [];

    const formatDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
            day: "numeric", month: "short", year: "numeric",
        });
    };

    const formatDateShort = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
            day: "numeric", month: "short", year: "2-digit",
        });
    };

    const tabClass = (t: Tab) =>
        `px-4 py-2 text-sm transition-colors ${tab === t
            ? 'text-black border-b-2 border-amber-600'
            : 'text-stone-500 hover:text-stone-300'}`;

    return (
        <div>
            {/* Header */}
            <div className="mb-4">
                <h2 className="text-black text-lg" style={{ fontFamily: 'var(--font-caveat)', fontSize: '24px' }}>
                    {initialData.exerciseName}
                </h2>
                <span className="text-stone-500 text-xs">{initialData.muscleGroupName}</span>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-stone-700/40 mb-4">
                <button type="button" onClick={() => setTab("track")} className={tabClass("track")}>Track</button>
                <button type="button" onClick={() => setTab("history")} className={tabClass("history")}>History</button>
                <button type="button" onClick={() => setTab("pbs")} className={tabClass("pbs")}>PBs & Calculator</button>
            </div>

            {/* Track Tab */}
            {tab === "track" && (
                <div>
                    {sets.length > 0 && (
                        <div className="mb-4">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-stone-500 border-b border-stone-700/40">
                                        <th className="py-1 w-8">#</th>
                                        <th className="py-1">Weight</th>
                                        <th className="py-1">Reps</th>
                                        <th className="py-1">Notes</th>
                                        <th className="py-1 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sets.map((s, i) => (
                                        editingId === s.id ? (
                                            <tr key={s.id} className="border-b border-stone-800/40">
                                                <td className="py-2 text-stone-500">{i + 1}</td>
                                                <td className="py-2">
                                                    <input type="number" value={editWeight} onChange={e => setEditWeight(e.target.value)} step="0.5"
                                                        className="w-full bg-transparent border-b border-amber-700 text-black text-sm p-0.5 focus:outline-none" />
                                                </td>
                                                <td className="py-2">
                                                    <input type="number" value={editReps} onChange={e => setEditReps(e.target.value)}
                                                        className="w-full bg-transparent border-b border-amber-700 text-black text-sm p-0.5 focus:outline-none" />
                                                </td>
                                                <td className="py-2">
                                                    <input type="text" value={editNotes} onChange={e => setEditNotes(e.target.value)}
                                                        className="w-full bg-transparent border-b border-amber-700 text-stone-600 text-xs p-0.5 focus:outline-none" />
                                                </td>
                                                <td className="py-2 flex gap-1">
                                                    <button type="button" onClick={handleSaveEdit} className="text-green-500 hover:text-green-400">
                                                        <CheckIcon sx={{ fontSize: 16, color: 'inherit' }} />
                                                    </button>
                                                    <button type="button" onClick={cancelEdit} className="text-stone-500 hover:text-stone-300">
                                                        <CloseIcon sx={{ fontSize: 16, color: 'inherit' }} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ) : (
                                            <tr key={s.id} className="border-b border-stone-800/40">
                                                <td className="py-2 text-stone-500">{i + 1}</td>
                                                <td className="py-2 text-black">
                                                    {s.weight != null ? `${s.weight} ${s.weightUnit}` : '-'}
                                                </td>
                                                <td className="py-2 text-black">{s.reps ?? '-'}</td>
                                                <td className="py-2 text-stone-500 text-xs">{s.notes || ''}</td>
                                                <td className="py-2 flex gap-1">
                                                    <button type="button" onClick={() => startEdit(s)} className="text-stone-600 hover:text-amber-500 transition-colors">
                                                        <EditIcon sx={{ fontSize: 16, color: 'inherit' }} />
                                                    </button>
                                                    <button type="button" onClick={() => s.id && handleDeleteSet(s.id)} className="text-stone-600 hover:text-red-400 transition-colors">
                                                        <DeleteOutlineIcon sx={{ fontSize: 16, color: 'inherit' }} />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Add set form */}
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <label className="text-stone-500 text-xs">Weight (kgs)</label>
                            <input type="number" value={newWeight} onChange={e => setNewWeight(e.target.value)} step="0.5"
                                className="w-full bg-transparent border-b border-stone-600 text-black text-sm p-1 focus:outline-none focus:border-amber-700" />
                        </div>
                        <div className="flex-1">
                            <label className="text-stone-500 text-xs">Reps</label>
                            <input type="number" value={newReps} onChange={e => setNewReps(e.target.value)}
                                className="w-full bg-transparent border-b border-stone-600 text-black text-sm p-1 focus:outline-none focus:border-amber-700" />
                        </div>
                        <div className="flex-1">
                            <label className="text-stone-500 text-xs">Notes</label>
                            <input type="text" value={newNotes} onChange={e => setNewNotes(e.target.value)}
                                className="w-full bg-transparent border-b border-stone-600 text-stone-600 text-sm p-1 focus:outline-none focus:border-amber-700" />
                        </div>
                        <button type="button" onClick={handleAddSet} disabled={adding || (!newWeight && !newReps)}
                            className="text-black hover:text-amber-800 disabled:text-stone-400 transition-colors text-sm px-3 py-1 border border-stone-600 rounded hover:border-amber-700 disabled:border-stone-700">
                            + Add
                        </button>
                    </div>
                </div>
            )}

            {/* History Tab */}
            {tab === "history" && (
                <div>
                    {!loadedHistory ? (
                        <p className="text-stone-500 text-sm">Loading...</p>
                    ) : history.length === 0 ? (
                        <p className="text-stone-500 text-sm">No history for this exercise.</p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {history.map((entry) => (
                                <div key={entry.date} className="border-b border-stone-800/40 pb-2">
                                    <div className="text-stone-500 text-xs mb-1">{formatDate(entry.date)}</div>
                                    {entry.sets.map((s, i) => {
                                        const isPb = s.weight != null && s.reps != null && pbMap.has(`${s.reps}-${s.weight}`);
                                        return (
                                            <div key={s.id || i} className="flex items-center gap-2 text-sm py-0.5">
                                                <span className="text-stone-500 w-6">{i + 1}.</span>
                                                <span className="text-black">
                                                    {s.weight != null ? `${s.weight} ${s.weightUnit}` : '-'}
                                                </span>
                                                <span className="text-stone-500">×</span>
                                                <span className="text-black">{s.reps ?? '-'}</span>
                                                {isPb && <EmojiEventsIcon sx={{ fontSize: 14, color: '#fbbf24' }} />}
                                                {s.notes && <span className="text-stone-500 text-xs ml-2">{s.notes}</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* PBs & Calculator Tab */}
            {tab === "pbs" && (
                <div>
                    <div className="mb-6">
                        <h3 className="text-stone-500 text-sm mb-2">Personal Bests</h3>
                        {!loadedPbs ? (
                            <p className="text-stone-500 text-sm">Loading...</p>
                        ) : pbs.length === 0 ? (
                            <p className="text-stone-500 text-sm">No PBs recorded yet.</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-stone-500 border-b border-stone-700/40">
                                        <th className="py-1">Reps</th>
                                        <th className="py-1">Best Weight</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pbs.map(pb => (
                                        <tr key={pb.reps} className="border-b border-stone-800/40">
                                            <td className="py-1 text-stone-500">{pb.reps}</td>
                                            <td className="py-1 text-black">{pb.weight} {pb.weightUnit}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div>
                        <h3 className="text-stone-500 text-sm mb-2">1RM Calculator</h3>
                        <div className="flex gap-2 mb-3">
                            <div className="flex-1">
                                <label className="text-stone-500 text-xs">Weight</label>
                                <input type="number" value={calcWeight} onChange={e => setCalcWeight(e.target.value)} step="0.5"
                                    className="w-full bg-transparent border-b border-stone-600 text-black text-sm p-1 focus:outline-none focus:border-amber-700" />
                            </div>
                            <div className="flex-1">
                                <label className="text-stone-500 text-xs">Reps</label>
                                <input type="number" value={calcReps} onChange={e => setCalcReps(e.target.value)}
                                    className="w-full bg-transparent border-b border-stone-600 text-black text-sm p-1 focus:outline-none focus:border-amber-700" />
                            </div>
                        </div>
                        {calcTable.length > 0 && (
                            <div>
                                <div className="text-black text-sm mb-2">
                                    Estimated 1RM: {Math.round(calculateOneRepMax(parseFloat(calcWeight), parseInt(calcReps)) * 10) / 10} kgs
                                </div>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-stone-500 border-b border-stone-700/40">
                                            <th className="py-1">Reps</th>
                                            <th className="py-1">Estimated Weight</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {calcTable.map(row => (
                                            <tr key={row.reps} className="border-b border-stone-800/40">
                                                <td className="py-1 text-stone-500">{row.reps}</td>
                                                <td className="py-1 text-black">{row.weight} kgs</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
