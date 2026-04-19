"use client";

import { useState } from "react";
import { db } from "@/app/lib/workouts/local-db";
import { reconcileChunk } from "@/app/lib/workouts/reconcile-action";

export default function ReconcileButton() {
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleReconcile = async () => {
        setRunning(true);
        setResult(null);
        try {
            // Only grab workouts with negative IDs (never synced)
            const unsyncedWorkouts = await db.workouts.where("id").below(0).toArray();

            if (unsyncedWorkouts.length === 0) {
                // Also check for workout_exercises with negative IDs whose parent workout has a positive ID
                const unsyncedWes = await db.workoutExercises.where("id").below(0).toArray();
                if (unsyncedWes.length === 0) {
                    setResult("Nothing to reconcile — no unsynced local data.");
                    setRunning(false);
                    return;
                }
            }

            const allWes = await db.workoutExercises.toArray();
            const allSets = await db.exerciseSets.toArray();

            let totalWorkouts = 0;
            let totalExercises = 0;
            let totalSets = 0;

            // Process one workout at a time to stay under body limit
            for (const w of unsyncedWorkouts) {
                const wes = allWes
                    .filter(we => we.workoutId === w.id && we.exerciseId > 0)
                    .map(we => ({ localId: we.id, localWorkoutId: w.id, exerciseId: we.exerciseId, sortOrder: we.sortOrder }));

                const weIds = new Set(allWes.filter(we => we.workoutId === w.id).map(we => we.id));
                const sets = allSets
                    .filter(s => weIds.has(s.workoutExerciseId))
                    .map(s => ({
                        localId: s.id,
                        localWorkoutExerciseId: s.workoutExerciseId,
                        weight: s.weight,
                        weightUnit: s.weightUnit,
                        reps: s.reps,
                        notes: s.notes,
                        sortOrder: s.sortOrder,
                        setType: s.setType,
                    }));

                const res = await reconcileChunk({
                    workouts: [{ localId: w.id, date: w.date, notes: w.notes }],
                    workoutExercises: wes,
                    exerciseSets: sets,
                });

                // Remap local negative IDs → server IDs in IndexedDB
                const serverWorkoutId = res.workoutIdMap[w.id];
                if (serverWorkoutId) {
                    await db.workouts.delete(w.id);
                    await db.workouts.put({ ...w, id: serverWorkoutId });

                    // Update workout_exercises: remap their IDs and workoutId foreign key
                    for (const we of wes) {
                        const serverWeId = res.weIdMap[we.localId];
                        if (!serverWeId) continue;

                        const localWe = await db.workoutExercises.get(we.localId);
                        if (localWe) {
                            await db.workoutExercises.delete(we.localId);
                            await db.workoutExercises.put({ ...localWe, id: serverWeId, workoutId: serverWorkoutId });
                        }

                        // Update exercise_sets: remap their own IDs and workoutExerciseId foreign key
                        const localSets = await db.exerciseSets.where('workoutExerciseId').equals(we.localId).toArray();
                        for (const s of localSets) {
                            const serverSetId = res.setIdMap[s.id];
                            if (serverSetId) {
                                await db.exerciseSets.delete(s.id);
                                await db.exerciseSets.put({ ...s, id: serverSetId, workoutExerciseId: serverWeId });
                            } else {
                                await db.exerciseSets.update(s.id, { workoutExerciseId: serverWeId });
                            }
                        }
                    }
                }

                totalWorkouts += res.workoutsCreated;
                totalExercises += res.exercisesLinked;
                totalSets += res.setsCreated;
            }

            setResult(`Done — ${totalWorkouts} workouts, ${totalExercises} exercises, ${totalSets} sets pushed.`);
        } catch (e) {
            setResult(`Error: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="flex flex-col gap-1">
            <button type="button" onClick={handleReconcile} disabled={running}
                    className="text-amber-700 hover:text-amber-800 text-sm font-semibold py-1 transition-colours disabled:text-black/20">
                {running ? "Reconciling..." : "Push local → server"}
            </button>
            {result && <span className="text-black/40 text-xs">{result}</span>}
        </div>
    );
}
