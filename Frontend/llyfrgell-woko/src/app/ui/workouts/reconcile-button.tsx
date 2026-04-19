"use client";

import { useState } from "react";
import { db } from "@/app/lib/workouts/local-db";
import { reconcileLocalData } from "@/app/lib/workouts/reconcile-action";

export default function ReconcileButton() {
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleReconcile = async () => {
        setRunning(true);
        setResult(null);
        try {
            const [workouts, workoutExercises, exerciseSets] = await Promise.all([
                db.workouts.toArray(),
                db.workoutExercises.toArray(),
                db.exerciseSets.toArray(),
            ]);

            // Only send records with positive IDs for exercises (they must already exist on server)
            // Workouts can have any ID — the server will upsert by date
            const res = await reconcileLocalData({
                workouts: workouts.map(w => ({ id: w.id, date: w.date, notes: w.notes })),
                workoutExercises: workoutExercises
                    .filter(we => we.exerciseId > 0)
                    .map(we => ({ id: we.id, workoutId: we.workoutId, exerciseId: we.exerciseId, sortOrder: we.sortOrder })),
                exerciseSets: exerciseSets.map(s => ({
                    id: s.id,
                    workoutExerciseId: s.workoutExerciseId,
                    weight: s.weight,
                    weightUnit: s.weightUnit,
                    reps: s.reps,
                    notes: s.notes,
                    sortOrder: s.sortOrder,
                    setType: s.setType,
                })),
            });

            setResult(`Done — ${res.workoutsCreated} workouts, ${res.exercisesLinked} exercises, ${res.setsCreated} sets pushed to server.`);
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
