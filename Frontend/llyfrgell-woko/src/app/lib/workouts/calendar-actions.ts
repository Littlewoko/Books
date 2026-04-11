'use server';

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { fetchWorkoutDatesForMonth, fetchWorkoutByDate, fetchWorkoutExercises } from './data';
import { getSessionUserId } from '@/app/utils/getSessionUser';
import ProtectRoute from '@/app/utils/protectRoute';

export async function getWorkoutDatesForMonth(year: number, month: number) {
    await ProtectRoute();
    const userId = await getSessionUserId();
    return fetchWorkoutDatesForMonth(userId, year, month);
}

export async function getWorkoutForDate(date: string) {
    await ProtectRoute();
    const userId = await getSessionUserId();
    const workout = await fetchWorkoutByDate(userId, date);
    if (!workout) return null;
    const exercises = await fetchWorkoutExercises(workout.id!);
    return { workout, exercises };
}

export async function copyMovementsToToday(exerciseIds: number[]) {
    await ProtectRoute();
    const userId = await getSessionUserId();

    const today = new Date().toISOString().split('T')[0];

    const workoutResult = await sql`
        INSERT INTO workout (date, user_id)
        VALUES (${today}, ${userId})
        ON CONFLICT (date, user_id) DO UPDATE SET date = EXCLUDED.date
        RETURNING id;
    `;
    const workoutId = workoutResult.rows[0].id;

    const existing = await fetchWorkoutExercises(workoutId);
    const existingExerciseIds = new Set(existing.map(e => e.exerciseId));

    const maxOrderResult = await sql`
        SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order
        FROM workout_exercise WHERE workout_id = ${workoutId};
    `;
    let nextOrder = maxOrderResult.rows[0].next_order;

    let added = 0;
    for (const exerciseId of exerciseIds) {
        if (existingExerciseIds.has(exerciseId)) continue;
        await sql`
            INSERT INTO workout_exercise (workout_id, exercise_id, sort_order)
            VALUES (${workoutId}, ${exerciseId}, ${nextOrder});
        `;
        nextOrder++;
        added++;
    }

    revalidatePath('/workouts');
    return { added, today };
}
