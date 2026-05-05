"use client";

import {useCallback, useEffect, useState} from "react";
import {ExerciseHistory, ExerciseSet, PersonalBest, SetType, WorkoutExercise} from "@/app/lib/workouts/types";
import {localAddSet, localDeleteSet, localReorderSets, localUpdateSet} from "@/app/lib/workouts/local-actions";
import {
    localGetExerciseHistory,
    localGetMovementScreenData,
    localGetPbSetIds,
    localGetPersonalBests
} from "@/app/lib/workouts/local-data";
import {calculateOneRepMax, getRepMaxTable} from "@/app/lib/workouts/calculator";
import {useOffline} from "@/app/components/WorkoutOfflineProvider";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {arrayMove, SortableContext, useSortable, verticalListSortingStrategy,} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";

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
        collapsed.push({reps: repsLabel, weight: currentWeight, weightUnit: pbs[i].weightUnit});
        i++;
    }
    return collapsed;
}

function SortableSetRow({s, index, isDragging, isPb, setTypeBg, setTypeDisplay, startEdit, handleDeleteSet}: {
    s: ExerciseSet; index: number; isDragging: boolean; isPb: boolean;
    setTypeBg: (t?: SetType | string) => string; setTypeDisplay: (t?: SetType | string) => string;
    startEdit: (s: ExerciseSet) => void; handleDeleteSet: (id: number) => void;
}) {
    const {attributes, listeners, setNodeRef, transform, transition} = useSortable({id: s.id!});

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style}
             className={`flex items-center gap-1 border-b border-black/5 py-1 text-sm ${isPb ? 'bg-amber-300/20' : setTypeBg(s.setType)}`}>
            <button type="button" {...attributes} {...listeners}
                    className="text-black/20 hover:text-black/40 cursor-grab active:cursor-grabbing touch-none flex-shrink-0">
                <DragIndicatorIcon sx={{fontSize: 14, color: 'inherit'}}/>
            </button>
            <span className="text-black/50 w-4 text-xs">{index + 1}</span>
            <span
                className="text-black font-semibold w-16">{s.weight != null ? `${s.weight} ${s.weightUnit}` : '-'}</span>
            <span className="text-black font-semibold w-8">{s.reps ?? '-'}</span>
            <span className="text-black/60 text-xs flex-1 flex items-center gap-1">
                {setTypeDisplay(s.setType)}
                {isPb && <EmojiEventsIcon sx={{fontSize: 12, color: '#b45309'}}/>}
            </span>
            <span className="text-black/60 text-xs truncate max-w-16">{s.notes || ''}</span>
            <button type="button" onClick={() => startEdit(s)}
                    className="text-black/20 hover:text-amber-700 p-0.5"><EditIcon
                sx={{fontSize: 14, color: 'inherit'}}/></button>
            <button type="button" onClick={() => s.id && handleDeleteSet(s.id)}
                    className="text-black/20 hover:text-red-600 p-0.5"><DeleteOutlineIcon
                sx={{fontSize: 14, color: 'inherit'}}/></button>
        </div>
    );
}

function SortableSets({
                          sets,
                          editingId,
                          editWeight,
                          editReps,
                          editNotes,
                          editSetType,
                          setEditWeight,
                          setEditReps,
                          setEditNotes,
                          setEditSetType,
                          handleSaveEdit,
                          setEditingId,
                          startEdit,
                          handleDeleteSet,
                          isPbSet,
                          setTypeBg,
                          setTypeDisplay,
                          inputClass,
                          onReorder
                      }: {
    sets: ExerciseSet[];
    editingId: number | null;
    editWeight: string;
    editReps: string;
    editNotes: string;
    editSetType: SetType;
    setEditWeight: (v: string) => void;
    setEditReps: (v: string) => void;
    setEditNotes: (v: string) => void;
    setEditSetType: (v: SetType) => void;
    handleSaveEdit: () => void;
    setEditingId: (v: number | null) => void;
    startEdit: (s: ExerciseSet) => void;
    handleDeleteSet: (id: number) => void;
    isPbSet: (s: ExerciseSet) => boolean;
    setTypeBg: (t?: SetType | string) => string;
    setTypeDisplay: (t?: SetType | string) => string;
    inputClass: string;
    onReorder: (reordered: ExerciseSet[]) => void;
}) {
    const sensors = useSensors(
        useSensor(PointerSensor, {activationConstraint: {delay: 200, tolerance: 5}}),
        useSensor(TouchSensor, {activationConstraint: {delay: 200, tolerance: 5}}),
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const {active, over} = event;
        if (!over || active.id === over.id) return;
        const oldIndex = sets.findIndex(s => s.id === active.id);
        const newIndex = sets.findIndex(s => s.id === over.id);
        onReorder(arrayMove(sets, oldIndex, newIndex));
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sets.map(s => s.id!)} strategy={verticalListSortingStrategy}>
                <div className="mb-3">
                    <div className="flex items-center gap-1 text-left text-amber-700 text-xs font-bold py-1">
                        <span className="w-5"></span>
                        <span className="w-4">#</span>
                        <span className="w-16">Weight</span>
                        <span className="w-8">Reps</span>
                        <span className="flex-1">Type</span>
                        <span className="max-w-16">Notes</span>
                        <span className="w-12"></span>
                    </div>
                    {sets.map((s, i) => (
                        editingId === s.id ? (
                            <div key={s.id} className="flex items-center gap-1 border-b border-black/5 py-1">
                                <span className="w-5"></span>
                                <span className="text-black/50 w-4 text-xs">{i + 1}</span>
                                <input type="number" value={editWeight} onChange={e => setEditWeight(e.target.value)}
                                       step="0.5" className={`${inputClass} w-16`}/>
                                <input type="number" value={editReps} onChange={e => setEditReps(e.target.value)}
                                       className={`${inputClass} w-8`}/>
                                <select value={editSetType} onChange={e => setEditSetType(e.target.value as SetType)}
                                        className="bg-transparent text-black text-xs py-0.5 focus:outline-none flex-1">
                                    <option value="working">Working</option>
                                    <option value="warmup">Warmup</option>
                                    <option value="amrap">AMRAP</option>
                                </select>
                                <input type="text" value={editNotes} onChange={e => setEditNotes(e.target.value)}
                                       className={`${inputClass} max-w-16`}/>
                                <button type="button" onClick={handleSaveEdit} className="text-green-600 p-0.5">
                                    <CheckIcon sx={{fontSize: 14, color: 'inherit'}}/></button>
                                <button type="button" onClick={() => setEditingId(null)}
                                        className="text-black/40 p-0.5">
                                    <CloseIcon sx={{fontSize: 14, color: 'inherit'}}/></button>
                            </div>
                        ) : (
                            <SortableSetRow key={s.id} s={s} index={i} isDragging={false}
                                            isPb={isPbSet(s)} setTypeBg={setTypeBg} setTypeDisplay={setTypeDisplay}
                                            startEdit={startEdit} handleDeleteSet={handleDeleteSet}/>
                        )
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}

export default function MovementScreen({date, exerciseId, initialData}: Props) {
    const {refreshPendingCount} = useOffline();
    const [tab, setTab] = useState<Tab>("track");
    const [sets, setSets] = useState<ExerciseSet[]>(initialData.sets);
    const [history, setHistory] = useState<ExerciseHistory[]>([]);
    const [pbs, setPbs] = useState<PersonalBest[]>([]);
    const [loadedHistory, setLoadedHistory] = useState(false);
    const [historyLimit, setHistoryLimit] = useState(5);
    const [hasMoreHistory, setHasMoreHistory] = useState(false);
    const [loadedPbs, setLoadedPbs] = useState(false);
    const [pbSetIds, setPbSetIds] = useState<Set<number>>(new Set());

    const [newWeight, setNewWeight] = useState("");
    const [newReps, setNewReps] = useState("");
    const [newNotes, setNewNotes] = useState("");
    const [newSetType, setNewSetType] = useState<SetType>("working");
    const [adding, setAdding] = useState(false);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editWeight, setEditWeight] = useState("");
    const [editReps, setEditReps] = useState("");
    const [editNotes, setEditNotes] = useState("");
    const [editSetType, setEditSetType] = useState<SetType>("working");

    const [calcWeight, setCalcWeight] = useState("");
    const [calcReps, setCalcReps] = useState("");
    const [historyCalcSet, setHistoryCalcSet] = useState<{ weight: number; reps: number } | null>(null);

    const refreshSets = useCallback(async () => {
        const data = await localGetMovementScreenData(date, exerciseId);
        if (data) setSets(data.sets);
    }, [date, exerciseId]);

    useEffect(() => {
        if (tab === "history" && !loadedHistory) {
            localGetExerciseHistory(exerciseId, historyLimit + 1).then(h => {
                setHasMoreHistory(h.length > historyLimit);
                setHistory(h.slice(0, historyLimit));
                setLoadedHistory(true);
            });
        }
    }, [tab, exerciseId, loadedHistory, historyLimit]);

    useEffect(() => {
        if (!loadedPbs) {
            Promise.all([localGetPersonalBests(exerciseId), localGetPbSetIds(exerciseId)]).then(([p, ids]) => {
                setPbs(p);
                setPbSetIds(ids);
                setLoadedPbs(true);
            });
        }
    }, [exerciseId, loadedPbs]);

    const handleAddSet = async () => {
        if (!newWeight && !newReps) return;
        setAdding(true);
        await localAddSet(initialData.workoutExerciseId, newWeight ? parseFloat(newWeight) : null, "kgs", newReps ? parseInt(newReps) : null, newNotes || undefined, newSetType);
        setNewWeight("");
        setNewReps("");
        setNewNotes("");
        await refreshSets();
        await refreshPendingCount();
        setAdding(false);
        setLoadedHistory(false);
        setLoadedPbs(false);
        setHistoryLimit(5);
    };

    const startEdit = (s: ExerciseSet) => {
        setEditingId(s.id!);
        setEditWeight(s.weight != null ? String(s.weight) : "");
        setEditReps(s.reps != null ? String(s.reps) : "");
        setEditNotes(s.notes || "");
        setEditSetType((s.setType || 'working') as SetType);
    };

    const handleSaveEdit = async () => {
        if (editingId == null) return;
        await localUpdateSet(editingId, editWeight ? parseFloat(editWeight) : null, "kgs", editReps ? parseInt(editReps) : null, editNotes || undefined, editSetType);
        setEditingId(null);
        await refreshSets();
        await refreshPendingCount();
        setLoadedHistory(false);
        setLoadedPbs(false);
        setHistoryLimit(5);
    };

    const handleDeleteSet = async (setId: number) => {
        if (!confirm('Delete this set?')) return;
        await localDeleteSet(setId);
        await refreshSets();
        await refreshPendingCount();
        setLoadedHistory(false);
        setLoadedPbs(false);
        setHistoryLimit(5);
    };

    const handleReorderSets = async (reordered: ExerciseSet[]) => {
        setSets(reordered);
        await localReorderSets(reordered.map(s => s.id!));
        await refreshPendingCount();
    };

    const pbMap = new Map<string, boolean>();
    if (loadedPbs) {
        for (const pb of pbs) pbMap.set(`${pb.reps}-${pb.weight}`, true);
    }

    const isPbSet = (s: ExerciseSet) => s.id != null && pbSetIds.has(s.id);

    const calcTable = calcWeight && calcReps ? getRepMaxTable(parseFloat(calcWeight), parseInt(calcReps)) : [];
    const collapsedPbs = collapsePbs(pbs);

    const formatDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString("en-GB", {day: "numeric", month: "short", year: "numeric"});
    };

    const setTypeDisplay = (t?: SetType | string) => {
        if (t === 'warmup') return 'Warmup';
        if (t === 'amrap') return 'AMRAP';
        return 'Working set';
    };

    const setTypeBg = (t?: SetType | string) => {
        if (t === 'warmup') return '';
        if (t === 'amrap') return 'bg-red-500/10';
        return 'bg-blue-500/10';
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
                        <SortableSets
                            sets={sets}
                            editingId={editingId}
                            editWeight={editWeight}
                            editReps={editReps}
                            editNotes={editNotes}
                            editSetType={editSetType}
                            setEditWeight={setEditWeight}
                            setEditReps={setEditReps}
                            setEditNotes={setEditNotes}
                            setEditSetType={setEditSetType}
                            handleSaveEdit={handleSaveEdit}
                            setEditingId={setEditingId}
                            startEdit={startEdit}
                            handleDeleteSet={handleDeleteSet}
                            isPbSet={isPbSet}
                            setTypeBg={setTypeBg}
                            setTypeDisplay={setTypeDisplay}
                            inputClass={inputClass}
                            onReorder={handleReorderSets}
                        />
                    )}

                    <div className="grid grid-cols-[1fr_1fr_1fr_auto_auto] gap-2 items-end">
                        <div>
                            <label className="text-amber-700 text-xs font-semibold">Kg</label>
                            <input type="number" value={newWeight} onChange={e => setNewWeight(e.target.value)}
                                   step="0.5" className={inputClass}/>
                        </div>
                        <div>
                            <label className="text-amber-700 text-xs font-semibold">Reps</label>
                            <input type="number" value={newReps} onChange={e => setNewReps(e.target.value)}
                                   className={inputClass}/>
                        </div>
                        <div>
                            <label className="text-amber-700 text-xs font-semibold">Notes</label>
                            <input type="text" value={newNotes} onChange={e => setNewNotes(e.target.value)}
                                   className={inputClass}/>
                        </div>
                        <div>
                            <label className="text-amber-700 text-xs font-semibold">Type</label>
                            <select value={newSetType} onChange={e => setNewSetType(e.target.value as SetType)}
                                    className="w-full bg-transparent border-b-2 border-black/20 text-black text-sm py-1 focus:outline-none focus:border-amber-600">
                                <option value="working">Working set</option>
                                <option value="warmup">Warmup</option>
                                <option value="amrap">AMRAP</option>
                            </select>
                        </div>
                        <button type="button" onClick={handleAddSet} disabled={adding || (!newWeight && !newReps)}
                                className="text-amber-700 font-bold text-sm py-1 px-2 disabled:text-black/20 hover:text-amber-800">+
                            Add
                        </button>
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
                                    <div
                                        className="text-amber-700 text-xs font-bold mb-0.5">{formatDate(entry.date)}</div>
                                    {entry.sets.map((s, i) => {
                                        const isPb = isPbSet(s);
                                        return (
                                            <div key={s.id || i}
                                                 onClick={() => s.weight != null && s.reps != null && s.reps > 0 ? setHistoryCalcSet({
                                                     weight: s.weight,
                                                     reps: s.reps
                                                 }) : undefined}
                                                 className={`flex items-center gap-2 text-sm py-0.5 px-1 rounded ${isPb ? 'bg-amber-300/20' : setTypeBg(s.setType)} ${s.weight != null && s.reps != null ? 'cursor-pointer hover:bg-black/5' : ''}`}>
                                                <span className="text-black/40 w-5 text-xs">{i + 1}.</span>
                                                <span
                                                    className="text-black font-semibold w-10">{s.weight != null ? `${s.weight}` : '-'}</span>
                                                <span className="text-black/40">×</span>
                                                <span className="text-black font-semibold w-6">{s.reps ?? '-'}</span>
                                                <span
                                                    className="text-black/40 text-xs w-20">{setTypeDisplay(s.setType)}</span>
                                                {isPb && <EmojiEventsIcon sx={{fontSize: 12, color: '#b45309'}}/>}
                                                {s.notes &&
                                                    <span className="text-black/50 text-xs ml-auto">{s.notes}</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                            {hasMoreHistory && (
                                <button type="button" onClick={() => {
                                    setHistoryLimit(999);
                                    setLoadedHistory(false);
                                }}
                                        className="text-amber-700 text-sm font-semibold mt-1 hover:text-amber-800">
                                    Load all history
                                </button>
                            )}
                        </div>
                    )}

                    {historyCalcSet && (() => {
                        const table = getRepMaxTable(historyCalcSet.weight, historyCalcSet.reps);
                        const orm = calculateOneRepMax(historyCalcSet.weight, historyCalcSet.reps);
                        return (
                            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40"
                                 onClick={() => setHistoryCalcSet(null)}>
                                <div className="bg-stone-50 w-72 p-4 shadow-xl" onClick={e => e.stopPropagation()}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span
                                            className="text-black text-sm font-bold">{historyCalcSet.weight} × {historyCalcSet.reps}</span>
                                        <button type="button" onClick={() => setHistoryCalcSet(null)}
                                                className="text-black/40 hover:text-black">
                                            <CloseIcon sx={{fontSize: 18, color: 'inherit'}}/>
                                        </button>
                                    </div>
                                    <div className="text-black text-sm font-bold mb-1">
                                        Est. 1RM: {Math.round(orm * 10) / 10} kgs
                                    </div>
                                    <table className="w-full text-sm">
                                        <tbody>
                                        {table.map(row => (
                                            <tr key={row.reps} className="border-b border-black/5">
                                                <td className="py-0.5 text-black w-16">{row.reps} rep{row.reps !== 1 ? 's' : ''}</td>
                                                <td className="py-0.5 text-black font-semibold">{row.weight} kgs</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })()}
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
                            <input type="number" value={calcWeight} onChange={e => setCalcWeight(e.target.value)}
                                   step="0.5" className={inputClass}/>
                        </div>
                        <div>
                            <label className="text-amber-700 text-xs font-semibold">Reps</label>
                            <input type="number" value={calcReps} onChange={e => setCalcReps(e.target.value)}
                                   className={inputClass}/>
                        </div>
                    </div>
                    {calcTable.length > 0 && (
                        <div>
                            <div className="text-black text-sm font-bold mb-1">
                                Est.
                                1RM: {Math.round(calculateOneRepMax(parseFloat(calcWeight), parseInt(calcReps)) * 10) / 10} kgs
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
