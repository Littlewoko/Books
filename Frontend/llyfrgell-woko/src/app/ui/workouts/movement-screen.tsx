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

type Tab = "track" | "history" | "pbs" | "calc";

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

        const repsLabel = startRep === endRep ? `${startRep}` : `${startRep}–${endRep}`;
        collapsed.push({ reps: repsLabel, weight: currentWeight, weightUnit: pbs[i].weightUnit });
        i++;
    }
    return collapsed;
}

export default function MovementScreen({ date, exerciseId, initialData }: Props) {
    const [tab, setTab] = useState<Tab>("track");
    const [sets, setSets] = useState<ExerciseSet[]>(initialData.sets);
    const [history, setHistory] = useState<ExerciseHistory[]>([]);
    const [pbs, setPbs] = useState<PersonalBest[]>([]);
    const [loadedHistory, setLoadedHistory] = useState(false);
    const [historyLimit, setHistoryLimit] = useState(5);
    const [hasMoreHistory, setHasMoreHistory] = useState(false);
    const [loadedPbs, setLoadedPbs] = useState(false);

    const [newWeight, setNewWeight] = useState("");
    const [newReps, setNewReps] = useState("");
    const [newNotes, setNewNotes] = useState("");
    const [adding, setAdding] = useState(false);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editWeight, setEditWeight] = useState("");
    const [editReps, setEditReps] = useState("");
    const [editNotes, setEditNotes] = useState("");

    const [calcWeight, setCalcWeight] = useState("");
    const [calcReps, setCalcReps] = useState("");

    const refreshSets = useCallback(async () => {
        const data = await getMovementScreenData(date, exerciseId);
        if (data) setSets(data.sets);
    }, [date, exerciseId]);

    useEffect(() => {
        if (tab === "history" && !loadedHistory) {
            getExerciseHistory(exerciseId, historyLimit + 1).then(h => {
                setHasMoreHistory(h.length > historyLimit);
                setHistory(h.slice(0, historyLimit));
                setLoadedHistory(true);
            });
        }
        if ((tab === "pbs" || tab === "calc") && !loadedPbs) {
            getPersonalBests(exerciseId).then(p => { setPbs(p); setLoadedPbs(true); });
        }
    }, [tab, exerciseId, loadedHistory, loadedPbs, historyLimit]);

    const handleAddSet = async () => {
        if (!newWeight && !newReps) return;
        setAdding(true);
        await addSet(initialData.workoutExerciseId, newWeight ? parseFloat(newWeight) : null, "kgs", newReps ? parseInt(newReps) : null, newNotes || undefined);
        setNewWeight(""); setNewReps(""); setNewNotes("");
        await refreshSets(); setAdding(false); setLoadedHistory(false); setLoadedPbs(false); setHistoryLimit(5);
    };

    const startEdit = (s: ExerciseSet) => {
        setEditingId(s.id!);
        setEditWeight(s.weight != null ? String(s.weight) : "");
        setEditReps(s.reps != null ? String(s.reps) : "");
        setEditNotes(s.notes || "");
    };

    const handleSaveEdit = async () => {
        if (editingId == null) return;
        await updateSet(editingId, editWeight ? parseFloat(editWeight) : null, "kgs", editReps ? parseInt(editReps) : null, editNotes || undefined);
        setEditingId(null); await refreshSets(); setLoadedHistory(false); setLoadedPbs(false); setHistoryLimit(5);
    };

    const handleDeleteSet = async (setId: number) => {
        if (!confirm('Delete this set?')) return;
        await deleteSet(setId); await refreshSets(); setLoadedHistory(false); setLoadedPbs(false); setHistoryLimit(5);
    };

    const pbMap = new Map<string, boolean>();
    if (loadedPbs) { for (const pb of pbs) pbMap.set(`${pb.reps}-${pb.weight}`, true); }

    const calcTable = calcWeight && calcReps ? getRepMaxTable(parseFloat(calcWeight), parseInt(calcReps)) : [];
    const collapsedPbs = collapsePbs(pbs);

    const formatDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    };

    const tabClass = (t: Tab) =>
        `px-3 py-1.5 text-sm transition-colors ${tab === t ? 'text-amber-700 font-bold border-b-2 border-amber-600' : 'text-black hover:text-amber-700'}`;

    const inputClass = "w-full bg-transparent border-b-2 border-black/20 text-black text-sm py-1 focus:outline-none focus:border-amber-600";

    return (
        <div>
            <div className="flex items-baseline justify-between mb-1">
                <span className="text-black text-sm font-bold">{initialData.exerciseName}</span>
                <span className="text-amber-700 text-xs font-semibold">{initialData.muscleGroupName}</span>
            </div>

            <div className="flex gap-1 border-b-2 border-black/10 mb-2">
                <button type="button" onClick={() => setTab("track")} className={tabClass("track")}>Track</button>
                <button type="button" onClick={() => setTab("history")} className={tabClass("history")}>History</button>
                <button type="button" onClick={() => setTab("pbs")} className={tabClass("pbs")}>PBs</button>
                <button type="button" onClick={() => setTab("calc")} className={tabClass("calc")}>Calc</button>
            </div>

            {tab === "track" && (
                <div>
                    {sets.length > 0 && (
                        <table className="w-full text-sm mb-3">
                            <thead>
                                <tr className="text-left text-amber-700 text-xs font-bold">
                                    <th className="py-1 w-6">#</th>
                                    <th className="py-1">Weight</th>
                                    <th className="py-1">Reps</th>
                                    <th className="py-1">Notes</th>
                                    <th className="py-1 w-14"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {sets.map((s, i) => (
                                    editingId === s.id ? (
                                        <tr key={s.id} className="border-b border-black/5">
                                            <td className="py-1 text-black/50">{i + 1}</td>
                                            <td className="py-1 pr-1"><input type="number" value={editWeight} onChange={e => setEditWeight(e.target.value)} step="0.5" className={inputClass} /></td>
                                            <td className="py-1 pr-1"><input type="number" value={editReps} onChange={e => setEditReps(e.target.value)} className={inputClass} /></td>
                                            <td className="py-1 pr-1"><input type="text" value={editNotes} onChange={e => setEditNotes(e.target.value)} className={inputClass} /></td>
                                            <td className="py-1 flex gap-0.5">
                                                <button type="button" onClick={handleSaveEdit} className="text-green-600 p-0.5"><CheckIcon sx={{ fontSize: 16, color: 'inherit' }} /></button>
                                                <button type="button" onClick={() => setEditingId(null)} className="text-black/40 p-0.5"><CloseIcon sx={{ fontSize: 16, color: 'inherit' }} /></button>
                                            </td>
                                        </tr>
                                    ) : (
                                        <tr key={s.id} className="border-b border-black/5">
                                            <td className="py-1.5 text-black/50">{i + 1}</td>
                                            <td className="py-1.5 text-black font-semibold">{s.weight != null ? `${s.weight} ${s.weightUnit}` : '-'}</td>
                                            <td className="py-1.5 text-black font-semibold">{s.reps ?? '-'}</td>
                                            <td className="py-1.5 text-black/60 text-xs">{s.notes || ''}</td>
                                            <td className="py-1.5 flex gap-0.5">
                                                <button type="button" onClick={() => startEdit(s)} className="text-black/20 hover:text-amber-700 p-0.5"><EditIcon sx={{ fontSize: 16, color: 'inherit' }} /></button>
                                                <button type="button" onClick={() => s.id && handleDeleteSet(s.id)} className="text-black/20 hover:text-red-600 p-0.5"><DeleteOutlineIcon sx={{ fontSize: 16, color: 'inherit' }} /></button>
                                            </td>
                                        </tr>
                                    )
                                ))}
                            </tbody>
                        </table>
                    )}

                    <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                        <div>
                            <label className="text-amber-700 text-xs font-semibold">Kg</label>
                            <input type="number" value={newWeight} onChange={e => setNewWeight(e.target.value)} step="0.5" className={inputClass} />
                        </div>
                        <div>
                            <label className="text-amber-700 text-xs font-semibold">Reps</label>
                            <input type="number" value={newReps} onChange={e => setNewReps(e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <label className="text-amber-700 text-xs font-semibold">Notes</label>
                            <input type="text" value={newNotes} onChange={e => setNewNotes(e.target.value)} className={inputClass} />
                        </div>
                        <button type="button" onClick={handleAddSet} disabled={adding || (!newWeight && !newReps)}
                            className="text-amber-700 font-bold text-sm py-1 px-2 disabled:text-black/20 hover:text-amber-800">+ Add</button>
                    </div>
                </div>
            )}

            {tab === "history" && (
                <div>
                    {!loadedHistory ? (
                        <p className="text-black/50 text-sm">Loading...</p>
                    ) : history.length === 0 ? (
                        <p className="text-black/50 text-sm">No history.</p>
                    ) : (
                        <div>
                            {history.map((entry) => (
                                <div key={entry.date} className="mb-2">
                                    <div className="text-amber-700 text-xs font-bold mb-0.5">{formatDate(entry.date)}</div>
                                    {entry.sets.map((s, i) => {
                                        const isPb = s.weight != null && s.reps != null && pbMap.has(`${s.reps}-${s.weight}`);
                                        return (
                                            <div key={s.id || i} className="flex items-center gap-2 text-sm py-0.5">
                                                <span className="text-black/40 w-5 text-xs">{i + 1}.</span>
                                                <span className="text-black font-semibold">{s.weight != null ? `${s.weight}` : '-'}</span>
                                                <span className="text-black/40">×</span>
                                                <span className="text-black font-semibold">{s.reps ?? '-'}</span>
                                                {isPb && <EmojiEventsIcon sx={{ fontSize: 12, color: '#b45309' }} />}
                                                {s.notes && <span className="text-black/50 text-xs ml-auto">{s.notes}</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                            {hasMoreHistory && (
                                <button type="button" onClick={() => { setHistoryLimit(999); setLoadedHistory(false); }}
                                    className="text-amber-700 text-sm font-semibold mt-1 hover:text-amber-800">
                                    Load all history
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {tab === "pbs" && (
                <div>
                    {!loadedPbs ? (
                        <p className="text-black/50 text-sm">Loading...</p>
                    ) : collapsedPbs.length === 0 ? (
                        <p className="text-black/50 text-sm">No PBs yet.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-amber-700 text-xs font-bold">
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
                    )}
                </div>
            )}

            {tab === "calc" && (
                <div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                            <label className="text-amber-700 text-xs font-semibold">Weight</label>
                            <input type="number" value={calcWeight} onChange={e => setCalcWeight(e.target.value)} step="0.5" className={inputClass} />
                        </div>
                        <div>
                            <label className="text-amber-700 text-xs font-semibold">Reps</label>
                            <input type="number" value={calcReps} onChange={e => setCalcReps(e.target.value)} className={inputClass} />
                        </div>
                    </div>
                    {calcTable.length > 0 && (
                        <div>
                            <div className="text-black text-sm font-bold mb-1">
                                Est. 1RM: {Math.round(calculateOneRepMax(parseFloat(calcWeight), parseInt(calcReps)) * 10) / 10} kgs
                            </div>
                            <table className="w-full text-sm">
                                <tbody>
                                    {calcTable.map(row => (
                                        <tr key={row.reps} className="border-b border-black/5">
                                            <td className="py-0.5 text-black w-16">{row.reps} rep{row.reps !== 1 ? 's' : ''}</td>
                                            <td className="py-0.5 text-black font-semibold">{row.weight} kgs</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
