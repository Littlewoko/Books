'use server';

import { sql } from '@vercel/postgres';
import { getSessionUserId } from '@/app/utils/getSessionUser';
import ProtectRoute from '@/app/utils/protectRoute';

export async function getExercisesByMuscleGroup(muscleGroupId: number) {
    await ProtectRoute();
    const userId = await getSessionUserId();

    const result = await sql`
        SELECT id, name FROM exercise
        WHERE user_id = ${userId} AND muscle_group_id = ${muscleGroupId}
        ORDER BY name ASC;
    `;
    return result.rows.map(row => ({ id: row.id as number, name: row.name as string }));
}

export async function getMuscleGroups() {
    await ProtectRoute();
    const userId = await getSessionUserId();

    const result = await sql`
        SELECT id, name FROM muscle_group
        WHERE user_id = ${userId}
        ORDER BY name ASC;
    `;
    return result.rows.map(row => ({ id: row.id as number, name: row.name as string }));
}

export async function getRecentExercises() {
    await ProtectRoute();
    const userId = await getSessionUserId();

    const result = await sql`
        SELECT DISTINCT ON (e.id) e.id, e.name, mg.name AS muscle_group_name, w.date
        FROM exercise e
        JOIN workout_exercise we ON we.exercise_id = e.id
        JOIN workout w ON w.id = we.workout_id
        JOIN muscle_group mg ON mg.id = e.muscle_group_id
        WHERE w.user_id = ${userId}
        ORDER BY e.id, w.date DESC;
    `;

    // Sort by most recent date, take top 10
    const sorted = result.rows
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

    return sorted.map(row => ({
        id: row.id as number,
        name: row.name as string,
        muscleGroupName: row.muscle_group_name as string,
    }));
}
