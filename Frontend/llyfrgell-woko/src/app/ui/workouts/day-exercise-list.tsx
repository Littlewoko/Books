"use client";

import {useState} from "react";
import {WorkoutExercise} from "@/app/lib/workouts/types";
import {
    localAddExerciseToWorkout,
    localCopyMovementsToToday,
    localCreateWorkout,
    localRemoveExerciseFromWorkout,
    localReorderExercises
} from "@/app/lib/workouts/local-actions";
import {useOffline} from "@/app/components/WorkoutOfflineProvider";
import {useRouter} from "next/navigation";
import Link from "next/link";
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import AddMovementModal from "./add-movement-modal";
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

interface Props {
    date: string;
    workoutId: number | null;
    exercises: WorkoutExercise[];
}

function SortableExercise({ex, date, onRemove}: {
    ex: WorkoutExercise;
    date: string;
    onRemove: (id: number, name: string) => void
}) {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({id: ex.id!});

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center border-b border-black/5 py-2">
            <button type="button" {...attributes} {...listeners}
                    className="text-black/20 hover:text-black/40 p-1 cursor-grab active:cursor-grabbing touch-none flex-shrink-0">
                <DragIndicatorIcon sx={{fontSize: 16, color: 'inherit'}}/>
            </button>
            <Link href={`/workouts/${date}/${ex.exerciseId}`} className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between">
                    <span className="text-black text-sm font-semibold">{ex.exerciseName}</span>
                    <span className="text-black/40 text-xs flex-shrink-0">{ex.setCount} sets</span>
                </div>
                <div className="text-amber-700 text-xs font-semibold">{ex.muscleGroupName}</div>
            </Link>
            <button type="button" onClick={() => ex.id && onRemove(ex.id, ex.exerciseName || '')}
                    className="text-black/20 hover:text-red-600 transition-colors p-1 ml-1 flex-shrink-0">
                <CloseIcon sx={{fontSize: 16, color: 'inherit'}}/>
            </button>
        </div>
    );
}

export default function DayExerciseList({date, workoutId, exercises: initialExercises}: Props) {
    const router = useRouter();
    const {refreshPendingCount} = useOffline();
    const [exercises, setExercises] = useState(initialExercises);
    const [showAddModal, setShowAddModal] = useState(false);
    const [copying, setCopying] = useState(false);
    const [copyResult, setCopyResult] = useState<string | null>(null);

    const today = new Date().toISOString().split('T')[0];
    const isToday = date === today;
    const canCopy = !isToday && exercises.length > 0;

    const sensors = useSensors(
        useSensor(PointerSensor, {activationConstraint: {delay: 200, tolerance: 5}}),
        useSensor(TouchSensor, {activationConstraint: {delay: 200, tolerance: 5}}),
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const {active, over} = event;
        if (!over || active.id === over.id) return;

        const oldIndex = exercises.findIndex(e => e.id === active.id);
        const newIndex = exercises.findIndex(e => e.id === over.id);
        const reordered = arrayMove(exercises, oldIndex, newIndex);
        setExercises(reordered);

        await localReorderExercises(reordered.map(e => e.id!));
        await refreshPendingCount();
    };

    const handleCopyToToday = async () => {
        setCopying(true);
        const exerciseIds = exercises.map(e => e.exerciseId);
        const result = await localCopyMovementsToToday(exerciseIds);
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
        await localRemoveExerciseFromWorkout(workoutExerciseId);
        setExercises(prev => prev.filter(e => e.id !== workoutExerciseId));
        await refreshPendingCount();
    };

    const addMovement = async (exerciseId: number) => {
        let wId = workoutId;
        if (!wId) {
            wId = await localCreateWorkout(date);
        }
        await localAddExerciseToWorkout(wId, exerciseId);
        await refreshPendingCount();
        setShowAddModal(false);
        router.push(`/workouts/${date}/${exerciseId}`);
    };

    return (
        <>
            {exercises.length === 0 ? (
                <p className="text-black/50 text-sm mb-2">No exercises logged.</p>
            ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={exercises.map(e => e.id!)} strategy={verticalListSortingStrategy}>
                        <div className="mb-2">
                            {exercises.map((ex) => (
                                <SortableExercise key={ex.id} ex={ex} date={date} onRemove={handleRemove}/>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            <div className="flex items-center gap-3">
                <button type="button" onClick={() => setShowAddModal(true)}
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

            {showAddModal && (
                <AddMovementModal
                    onSelect={addMovement}
                    onClose={() => setShowAddModal(false)}
                />
            )}
        </>
    );
}
