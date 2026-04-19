'use server';

import { sql } from '@vercel/postgres';
import ProtectRoute from '@/app/utils/protectRoute';
import { getSessionUserId } from '@/app/utils/getSessionUser';

interface ForcePushDay {
    date: string;
    exercises: {
        exerciseName: string;
        muscleGroupName: string;
        sortOrder: number;
        sets: {
            weight: number | null;
            weightUnit: string;
            reps: number | null;
            notes: string | null;
            sortOrder: number;
            setType: string;
        }[];
    }[];
}

export async function forcePushDay(day: ForcePushDay): Promise<{ exercisesPushed: number; setsPushed: number }> {
    await ProtectRoute();
    const userId = await getSessionUserId();

    let exercisesPushed = 0;
    let setsPushed = 0;

    // Delete existing workout for this date (cascades via foreign keys or manual cleanup)
    const existing = await sql`SELECT id FROM workout WHERE date = ${day.date} AND user_id = ${userId};`;
    if (existing.rows[0]) {
        const workoutId = existing.rows[0].id;
        // Delete sets → workout_exercises → workout
        await sql`
            DELETE FROM exercise_set WHERE workout_exercise_id IN (
                SELECT id FROM workout_exercise WHERE workout_id = ${workoutId}
            );
        `;
        await sql`DELETE FROM workout_exercise WHERE workout_id = ${workoutId};`;
        await sql`DELETE FROM workout WHERE id = ${workoutId};`;
    }

    if (day.exercises.length === 0) return { exercisesPushed: 0, setsPushed: 0 };

    // Create workout
    const wResult = await sql`
        INSERT INTO workout (date, user_id) VALUES (${day.date}, ${userId}) RETURNING id;
    `;
    const workoutId = wResult.rows[0].id;

    for (const ex of day.exercises) {
        // Resolve exercise by name + muscle group name (create if missing)
        let mgResult = await sql`
            SELECT id FROM muscle_group WHERE name = ${ex.muscleGroupName} AND user_id = ${userId};
        `;
        if (!mgResult.rows[0]) {
            mgResult = await sql`
                INSERT INTO muscle_group (name, user_id) VALUES (${ex.muscleGroupName}, ${userId}) RETURNING id;
            `;
        }
        const mgId = mgResult.rows[0].id;

        let exResult = await sql`
            SELECT id FROM exercise WHERE name = ${ex.exerciseName} AND muscle_group_id = ${mgId} AND user_id = ${userId};
        `;
        if (!exResult.rows[0]) {
            exResult = await sql`
                INSERT INTO exercise (name, muscle_group_id, user_id) VALUES (${ex.exerciseName}, ${mgId}, ${userId}) RETURNING id;
            `;
        }
        const exerciseId = exResult.rows[0].id;

        const weResult = await sql`
            INSERT INTO workout_exercise (workout_id, exercise_id, sort_order)
            VALUES (${workoutId}, ${exerciseId}, ${ex.sortOrder}) RETURNING id;
        `;
        const weId = weResult.rows[0].id;
        exercisesPushed++;

        for (const s of ex.sets) {
            await sql`
                INSERT INTO exercise_set (workout_exercise_id, weight, weight_unit, reps, notes, sort_order, set_type)
                VALUES (${weId}, ${s.weight}, ${s.weightUnit}, ${s.reps}, ${s.notes}, ${s.sortOrder}, ${s.setType || 'working'});
            `;
            setsPushed++;
        }
    }

    return { exercisesPushed, setsPushed };
}
