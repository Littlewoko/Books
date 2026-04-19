'use server';

import { sql } from '@vercel/postgres';
import ProtectRoute from '@/app/utils/protectRoute';
import { getSessionUserId } from '@/app/utils/getSessionUser';

interface LocalWorkoutDump {
    workouts: { id: number; date: string; notes?: string | null }[];
    workoutExercises: { id: number; workoutId: number; exerciseId: number; sortOrder: number }[];
    exerciseSets: {
        id: number;
        workoutExerciseId: number;
        weight: number | null;
        weightUnit: string;
        reps: number | null;
        notes: string | null;
        sortOrder: number;
        setType: string;
    }[];
}

export async function reconcileLocalData(dump: LocalWorkoutDump): Promise<{
    workoutsCreated: number;
    exercisesLinked: number;
    setsCreated: number;
}> {
    await ProtectRoute();
    const userId = await getSessionUserId();

    let workoutsCreated = 0;
    let exercisesLinked = 0;
    let setsCreated = 0;

    // Build a map of local workout ID → server workout ID
    const workoutIdMap = new Map<number, number>();

    for (const w of dump.workouts) {
        const result = await sql`
            INSERT INTO workout (date, user_id, notes)
            VALUES (${w.date}, ${userId}, ${w.notes ?? null})
            ON CONFLICT (date, user_id) DO UPDATE SET notes = COALESCE(EXCLUDED.notes, workout.notes)
            RETURNING id;
        `;
        workoutIdMap.set(w.id, result.rows[0].id);
        // Count as created only if it was actually new (check via xmax)
        const check = await sql`
            SELECT COUNT(*)::int AS set_count FROM workout_exercise WHERE workout_id = ${result.rows[0].id};
        `;
        if (check.rows[0].set_count === 0 && dump.workoutExercises.some(we => we.workoutId === w.id)) {
            workoutsCreated++;
        }
    }

    // Build a map of local workout_exercise ID → server workout_exercise ID
    const weIdMap = new Map<number, number>();

    for (const we of dump.workoutExercises) {
        const serverWorkoutId = workoutIdMap.get(we.workoutId);
        if (!serverWorkoutId) continue;

        // Verify the exercise exists and belongs to this user
        const exCheck = await sql`SELECT id FROM exercise WHERE id = ${we.exerciseId} AND user_id = ${userId};`;
        if (!exCheck.rows[0]) continue;

        // Check if this workout_exercise already exists (same workout + exercise)
        const existing = await sql`
            SELECT id FROM workout_exercise
            WHERE workout_id = ${serverWorkoutId} AND exercise_id = ${we.exerciseId};
        `;

        let serverWeId: number;
        if (existing.rows[0]) {
            serverWeId = existing.rows[0].id;
        } else {
            const result = await sql`
                INSERT INTO workout_exercise (workout_id, exercise_id, sort_order)
                VALUES (${serverWorkoutId}, ${we.exerciseId}, ${we.sortOrder})
                RETURNING id;
            `;
            serverWeId = result.rows[0].id;
            exercisesLinked++;
        }
        weIdMap.set(we.id, serverWeId);
    }

    // Insert missing sets
    for (const s of dump.exerciseSets) {
        const serverWeId = weIdMap.get(s.workoutExerciseId);
        if (!serverWeId) continue;

        // Check if a set with matching weight/reps/sortOrder already exists to avoid duplicates
        const existing = await sql`
            SELECT id FROM exercise_set
            WHERE workout_exercise_id = ${serverWeId}
              AND sort_order = ${s.sortOrder}
              AND COALESCE(weight, -1) = COALESCE(${s.weight}::numeric, -1)
              AND COALESCE(reps, -1) = COALESCE(${s.reps}::int, -1);
        `;

        if (!existing.rows[0]) {
            await sql`
                INSERT INTO exercise_set (workout_exercise_id, weight, weight_unit, reps, notes, sort_order, set_type)
                VALUES (${serverWeId}, ${s.weight}, ${s.weightUnit}, ${s.reps}, ${s.notes}, ${s.sortOrder}, ${s.setType || 'working'});
            `;
            setsCreated++;
        }
    }

    return { workoutsCreated, exercisesLinked, setsCreated };
}
