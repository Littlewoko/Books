'use server';

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import ProtectRoute from '@/app/utils/protectRoute';
import { getSessionUserId } from '@/app/utils/getSessionUser';

// -- Idempotency helper --

async function checkIdempotency(key: string | undefined): Promise<number | null> {
    if (!key) return null;
    const existing = await sql`SELECT entity_id FROM idempotency_log WHERE idempotency_key = ${key}`;
    return existing.rows[0]?.entity_id ?? null;
}

async function logIdempotency(key: string | undefined, table: string, entityId: number) {
    if (!key) return;
    await sql`INSERT INTO idempotency_log (idempotency_key, entity_table, entity_id) VALUES (${key}, ${table}, ${entityId}) ON CONFLICT (idempotency_key) DO NOTHING`;
}

// -- Muscle Groups --

export async function createMuscleGroup(name: string, idempotencyKey?: string) {
    await ProtectRoute();
    const userId = await getSessionUserId();

    const existingId = await checkIdempotency(idempotencyKey);
    if (existingId != null) return existingId;

    const result = await sql`
        INSERT INTO muscle_group (name, user_id) VALUES (${name}, ${userId})
        RETURNING id;
    `;
    const id = result.rows[0].id as number;
    await logIdempotency(idempotencyKey, 'muscle_group', id);
    revalidatePath('/workouts');
    return id;
}

export async function updateMuscleGroupColour(muscleGroupId: number, colour: string) {
    await ProtectRoute();
    const userId = await getSessionUserId();

    await sql`
        UPDATE muscle_group SET colour = ${colour}
        WHERE id = ${muscleGroupId} AND user_id = ${userId};
    `;
    revalidatePath('/workouts');
}

// -- Exercises --

export async function createExercise(name: string, muscleGroupId: number, idempotencyKey?: string) {
    await ProtectRoute();
    const userId = await getSessionUserId();

    const existingId = await checkIdempotency(idempotencyKey);
    if (existingId != null) return existingId;

    const result = await sql`
        INSERT INTO exercise (name, muscle_group_id, user_id) VALUES (${name}, ${muscleGroupId}, ${userId})
        RETURNING id;
    `;
    const id = result.rows[0].id as number;
    await logIdempotency(idempotencyKey, 'exercise', id);
    revalidatePath('/workouts');
    return id;
}

export async function updateExerciseMuscleGroup(exerciseId: number, muscleGroupId: number) {
    await ProtectRoute();
    const userId = await getSessionUserId();

    await sql`
        UPDATE exercise SET muscle_group_id = ${muscleGroupId}
        WHERE id = ${exerciseId} AND user_id = ${userId};
    `;
    revalidatePath('/workouts');
}

export async function renameExercise(exerciseId: number, name: string) {
    await ProtectRoute();
    const userId = await getSessionUserId();

    await sql`
        UPDATE exercise SET name = ${name}
        WHERE id = ${exerciseId} AND user_id = ${userId};
    `;
    revalidatePath('/workouts');
}

// -- Workouts --

export async function createWorkout(date: string, notes?: string, idempotencyKey?: string) {
    await ProtectRoute();
    const userId = await getSessionUserId();

    const existingId = await checkIdempotency(idempotencyKey);
    if (existingId != null) return existingId;

    const result = await sql`
        INSERT INTO workout (date, user_id, notes) VALUES (${date}, ${userId}, ${notes ?? null})
        ON CONFLICT (date, user_id) DO UPDATE SET notes = COALESCE(EXCLUDED.notes, workout.notes)
        RETURNING id;
    `;
    const id = result.rows[0].id as number;
    await logIdempotency(idempotencyKey, 'workout', id);
    revalidatePath('/workouts');
    return id;
}

// -- Workout Exercises --

export async function addExerciseToWorkout(workoutId: number, exerciseId: number, sortOrder?: number, idempotencyKey?: string) {
    await ProtectRoute();
    const userId = await getSessionUserId();

    const existingId = await checkIdempotency(idempotencyKey);
    if (existingId != null) return existingId;

    // Verify workout belongs to user
    const workout = await sql`SELECT id FROM workout WHERE id = ${workoutId} AND user_id = ${userId};`;
    if (!workout.rows[0]) throw new Error('Unauthorized');

    // Use provided sortOrder or calculate next
    const order = sortOrder ?? (await sql`
        SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order
        FROM workout_exercise WHERE workout_id = ${workoutId};
    `).rows[0].next_order;

    const result = await sql`
        INSERT INTO workout_exercise (workout_id, exercise_id, sort_order)
        VALUES (${workoutId}, ${exerciseId}, ${order})
        RETURNING id;
    `;
    const id = result.rows[0].id as number;
    await logIdempotency(idempotencyKey, 'workout_exercise', id);
    revalidatePath('/workouts');
    return id;
}

export async function removeExerciseFromWorkout(workoutExerciseId: number) {
    await ProtectRoute();
    const userId = await getSessionUserId();

    await sql`
        DELETE FROM workout_exercise we
        USING workout w
        WHERE we.id = ${workoutExerciseId} AND we.workout_id = w.id AND w.user_id = ${userId};
    `;
    revalidatePath('/workouts');
}

export async function reorderWorkoutExercises(orderedIds: number[]) {
    await ProtectRoute();
    const userId = await getSessionUserId();

    for (let i = 0; i < orderedIds.length; i++) {
        await sql`
            UPDATE workout_exercise we
            SET sort_order = ${i}
            FROM workout w
            WHERE we.id = ${orderedIds[i]} AND we.workout_id = w.id AND w.user_id = ${userId};
        `;
    }
    revalidatePath('/workouts');
}

// -- Sets --

export async function addSet(
    workoutExerciseId: number,
    weight: number | null,
    weightUnit: string,
    reps: number | null,
    notes?: string,
    setType: string = 'working',
    sortOrder?: number,
    idempotencyKey?: string
) {
    await ProtectRoute();
    const userId = await getSessionUserId();

    const existingId = await checkIdempotency(idempotencyKey);
    if (existingId != null) return existingId;

    // Verify ownership through workout_exercise → workout → user
    const ownership = await sql`
        SELECT we.id FROM workout_exercise we
        JOIN workout w ON w.id = we.workout_id
        WHERE we.id = ${workoutExerciseId} AND w.user_id = ${userId};
    `;
    if (!ownership.rows[0]) throw new Error('Unauthorized');

    // Use provided sortOrder or calculate next
    const order = sortOrder ?? (await sql`
        SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order
        FROM exercise_set WHERE workout_exercise_id = ${workoutExerciseId};
    `).rows[0].next_order;

    const result = await sql`
        INSERT INTO exercise_set (workout_exercise_id, weight, weight_unit, reps, notes, sort_order, set_type)
        VALUES (${workoutExerciseId}, ${weight}, ${weightUnit}, ${reps}, ${notes ?? null}, ${order}, ${setType})
        RETURNING id;
    `;
    const id = result.rows[0].id as number;
    await logIdempotency(idempotencyKey, 'exercise_set', id);
    revalidatePath('/workouts');
    return id;
}

export async function updateSet(setId: number, weight: number | null, weightUnit: string, reps: number | null, notes?: string, setType: string = 'working') {
    await ProtectRoute();
    const userId = await getSessionUserId();

    await sql`
        UPDATE exercise_set es
        SET weight = ${weight}, weight_unit = ${weightUnit}, reps = ${reps}, notes = ${notes ?? null}, set_type = ${setType}
        FROM workout_exercise we, workout w
        WHERE es.id = ${setId} AND es.workout_exercise_id = we.id AND we.workout_id = w.id AND w.user_id = ${userId};
    `;
    revalidatePath('/workouts');
}

export async function deleteSet(setId: number) {
    await ProtectRoute();
    const userId = await getSessionUserId();

    await sql`
        DELETE FROM exercise_set es
        USING workout_exercise we, workout w
        WHERE es.id = ${setId} AND es.workout_exercise_id = we.id AND we.workout_id = w.id AND w.user_id = ${userId};
    `;
    revalidatePath('/workouts');
}
