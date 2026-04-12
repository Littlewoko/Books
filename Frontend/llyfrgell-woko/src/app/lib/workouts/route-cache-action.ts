'use server';

import { sql } from '@vercel/postgres';
import { getSessionUserId } from '@/app/utils/getSessionUser';
import ProtectRoute from '@/app/utils/protectRoute';

export async function getRecentWorkoutRoutes() {
    await ProtectRoute();
    const userId = await getSessionUserId();

    const result = await sql`
        SELECT w.date::text AS date, ARRAY_AGG(DISTINCT we.exercise_id) AS exercise_ids
        FROM workout w
        JOIN workout_exercise we ON we.workout_id = w.id
        WHERE w.user_id = ${userId} AND w.date >= NOW() - INTERVAL '60 days'
        GROUP BY w.date
        ORDER BY w.date DESC;
    `;

    const routes: string[] = ['/workouts', '/workouts/exercises'];
    for (const row of result.rows) {
        routes.push(`/workouts/${row.date}`);
        for (const exerciseId of row.exercise_ids) {
            routes.push(`/workouts/${row.date}/${exerciseId}`);
        }
    }
    return routes;
}
