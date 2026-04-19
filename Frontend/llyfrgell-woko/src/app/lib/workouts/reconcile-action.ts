'use server';

import { sql } from '@vercel/postgres';
import ProtectRoute from '@/app/utils/protectRoute';
import { getSessionUserId } from '@/app/utils/getSessionUser';

interface ReconcileChunk {
    workouts: { localId: number; date: string; notes?: string | null }[];
    workoutExercises: { localId: number; localWorkoutId: number; exerciseId: number; sortOrder: number }[];
    exerciseSets: {
        localId: number;
        localWorkoutExerciseId: number;
        weight: number | null;
        weightUnit: string;
        reps: number | null;
        notes: string | null;
        sortOrder: number;
        setType: string;
    }[];
}

export async function reconcileChunk(chunk: ReconcileChunk): Promise<{
    workoutsCreated: number;
    exercisesLinked: number;
    setsCreated: number;
    workoutIdMap: Record<number, number>;
    weIdMap: Record<number, number>;
    setIdMap: Record<number, number>;
}> {
    await ProtectRoute();
    const userId = await getSessionUserId();

    let workoutsCreated = 0;
    let exercisesLinked = 0;
    let setsCreated = 0;

    const workoutIdMap: Record<number, number> = {};
    const weIdMap: Record<number, number> = {};
    const setIdMap: Record<number, number> = {};

    for (const w of chunk.workouts) {
        const result = await sql`
            INSERT INTO workout (date, user_id, notes)
            VALUES (${w.date}, ${userId}, ${w.notes ?? null})
            ON CONFLICT (date, user_id) DO UPDATE SET notes = COALESCE(EXCLUDED.notes, workout.notes)
            RETURNING id;
        `;
        workoutIdMap[w.localId] = result.rows[0].id;
        workoutsCreated++;
    }

    for (const we of chunk.workoutExercises) {
        const serverWorkoutId = workoutIdMap[we.localWorkoutId];
        if (!serverWorkoutId) continue;

        const exCheck = await sql`SELECT id FROM exercise WHERE id = ${we.exerciseId} AND user_id = ${userId};`;
        if (!exCheck.rows[0]) continue;

        const existing = await sql`
            SELECT id FROM workout_exercise
            WHERE workout_id = ${serverWorkoutId} AND exercise_id = ${we.exerciseId};
        `;

        if (existing.rows[0]) {
            weIdMap[we.localId] = existing.rows[0].id;
        } else {
            const result = await sql`
                INSERT INTO workout_exercise (workout_id, exercise_id, sort_order)
                VALUES (${serverWorkoutId}, ${we.exerciseId}, ${we.sortOrder})
                RETURNING id;
            `;
            weIdMap[we.localId] = result.rows[0].id;
            exercisesLinked++;
        }
    }

    for (const s of chunk.exerciseSets) {
        const serverWeId = weIdMap[s.localWorkoutExerciseId];
        if (!serverWeId) continue;

        const existing = await sql`
            SELECT id FROM exercise_set
            WHERE workout_exercise_id = ${serverWeId}
              AND sort_order = ${s.sortOrder}
              AND COALESCE(weight, -1) = COALESCE(${s.weight}::numeric, -1)
              AND COALESCE(reps, -1) = COALESCE(${s.reps}::int, -1);
        `;

        if (existing.rows[0]) {
            setIdMap[s.localId] = existing.rows[0].id;
        } else {
            const result = await sql`
                INSERT INTO exercise_set (workout_exercise_id, weight, weight_unit, reps, notes, sort_order, set_type)
                VALUES (${serverWeId}, ${s.weight}, ${s.weightUnit}, ${s.reps}, ${s.notes}, ${s.sortOrder}, ${s.setType || 'working'})
                RETURNING id;
            `;
            setIdMap[s.localId] = result.rows[0].id;
            setsCreated++;
        }
    }

    return { workoutsCreated, exercisesLinked, setsCreated, workoutIdMap, weIdMap, setIdMap };
}
