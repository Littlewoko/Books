'use server';

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import ProtectRoute from '@/app/utils/protectRoute';
import { getSessionUserId } from '@/app/utils/getSessionUser';

// -- Muscle Groups --

export async function createMuscleGroup(name: string) {
    await ProtectRoute();
    const userId = await getSessionUserId();

    const result = await sql`
        INSERT INTO muscle_group (name, user_id) VALUES (${name}, ${userId})
        RETURNING id;
    `;
    revalidatePath('/workouts');
    return result.rows[0].id as number;
}

// -- Exercises --

export async function createExercise(name: string, muscleGroupId: number) {
    await ProtectRoute();
    const userId = await getSessionUserId();

    const result = await sql`
        INSERT INTO exercise (name, muscle_group_id, user_id) VALUES (${name}, ${muscleGroupId}, ${userId})
        RETURNING id;
    `;
    revalidatePath('/workouts');
    return result.rows[0].id as number;
}

// -- Workouts --

export async function createWorkout(date: string, notes?: string) {
    await ProtectRoute();
    const userId = await getSessionUserId();

    const result = await sql`
        INSERT INTO workout (date, user_id, notes) VALUES (${date}, ${userId}, ${notes ?? null})
        ON CONFLICT (date, user_id) DO UPDATE SET notes = COALESCE(EXCLUDED.notes, workout.notes)
        RETURNING id;
    `;
    revalidatePath('/workouts');
    return result.rows[0].id as number;
}

// -- Workout Exercises --

export async function addExerciseToWorkout(workoutId: number, exerciseId: number) {
    await ProtectRoute();

    const maxOrder = await sql`
        SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order
        FROM workout_exercise WHERE workout_id = ${workoutId};
    `;

    const result = await sql`
        INSERT INTO workout_exercise (workout_id, exercise_id, sort_order)
        VALUES (${workoutId}, ${exerciseId}, ${maxOrder.rows[0].next_order})
        RETURNING id;
    `;
    revalidatePath('/workouts');
    return result.rows[0].id as number;
}

export async function removeExerciseFromWorkout(workoutExerciseId: number) {
    await ProtectRoute();

    await sql`DELETE FROM workout_exercise WHERE id = ${workoutExerciseId};`;
    revalidatePath('/workouts');
}

export async function reorderWorkoutExercises(orderedIds: number[]) {
    await ProtectRoute();

    for (let i = 0; i < orderedIds.length; i++) {
        await sql`UPDATE workout_exercise SET sort_order = ${i} WHERE id = ${orderedIds[i]};`;
    }
    revalidatePath('/workouts');
}

// -- Sets --

export async function addSet(workoutExerciseId: number, weight: number | null, weightUnit: string, reps: number | null, notes?: string) {
    await ProtectRoute();

    const maxOrder = await sql`
        SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order
        FROM exercise_set WHERE workout_exercise_id = ${workoutExerciseId};
    `;

    const result = await sql`
        INSERT INTO exercise_set (workout_exercise_id, weight, weight_unit, reps, notes, sort_order)
        VALUES (${workoutExerciseId}, ${weight}, ${weightUnit}, ${reps}, ${notes ?? null}, ${maxOrder.rows[0].next_order})
        RETURNING id;
    `;
    revalidatePath('/workouts');
    return result.rows[0].id as number;
}

export async function updateSet(setId: number, weight: number | null, weightUnit: string, reps: number | null, notes?: string) {
    await ProtectRoute();

    await sql`
        UPDATE exercise_set
        SET weight = ${weight}, weight_unit = ${weightUnit}, reps = ${reps}, notes = ${notes ?? null}
        WHERE id = ${setId};
    `;
    revalidatePath('/workouts');
}

export async function deleteSet(setId: number) {
    await ProtectRoute();

    await sql`DELETE FROM exercise_set WHERE id = ${setId};`;
    revalidatePath('/workouts');
}
