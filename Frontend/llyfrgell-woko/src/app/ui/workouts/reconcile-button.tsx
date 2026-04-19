"use client";

import { useState } from "react";
import { db } from "@/app/lib/workouts/local-db";
import { forcePushDay } from "@/app/lib/workouts/force-push-action";

export default function ReconcileButton() {
    const [running, setRunning] = useState(false);
    const [progress, setProgress] = useState<string | null>(null);
    const [result, setResult] = useState<string | null>(null);

    const handleForcePush = async () => {
        setRunning(true);
        setResult(null);
        setProgress(null);
        try {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 14);
            const cutoffStr = cutoff.toISOString().split("T")[0];

            const workouts = await db.workouts.where("date").aboveOrEqual(cutoffStr).toArray();
            workouts.sort((a, b) => a.date.localeCompare(b.date));

            if (workouts.length === 0) {
                setResult("No workouts in the last 14 days.");
                setRunning(false);
                return;
            }

            let totalExercises = 0;
            let totalSets = 0;

            for (let i = 0; i < workouts.length; i++) {
                const w = workouts[i];
                setProgress(`Pushing ${w.date} (${i + 1}/${workouts.length})`);

                const wes = await db.workoutExercises.where("workoutId").equals(w.id).sortBy("sortOrder");
                const exercises = [];

                for (const we of wes) {
                    const sets = await db.exerciseSets.where("workoutExerciseId").equals(we.id).sortBy("sortOrder");
                    exercises.push({
                        exerciseName: we.exerciseName,
                        muscleGroupName: we.muscleGroupName,
                        sortOrder: we.sortOrder,
                        sets: sets.map(s => ({
                            weight: s.weight,
                            weightUnit: s.weightUnit,
                            reps: s.reps,
                            notes: s.notes,
                            sortOrder: s.sortOrder,
                            setType: s.setType,
                        })),
                    });
                }

                const res = await forcePushDay({ date: w.date, exercises });
                totalExercises += res.exercisesPushed;
                totalSets += res.setsPushed;
            }

            setResult(`Done — ${workouts.length} days, ${totalExercises} exercises, ${totalSets} sets pushed.`);
        } catch (e) {
            setResult(`Error: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            setRunning(false);
            setProgress(null);
        }
    };

    return (
        <div className="flex flex-col gap-1">
            <button type="button" onClick={handleForcePush} disabled={running}
                    className="text-amber-700 hover:text-amber-800 text-sm font-semibold py-1 transition-colours disabled:text-black/20">
                {running ? "Pushing..." : "Force push last 14 days → server"}
            </button>
            {progress && <span className="text-black/50 text-xs">{progress}</span>}
            {result && <span className="text-black/40 text-xs">{result}</span>}
        </div>
    );
}
