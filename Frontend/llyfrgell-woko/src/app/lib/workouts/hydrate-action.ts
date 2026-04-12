'use server';

import { sql } from '@vercel/postgres';
import { getSessionUserId } from '@/app/utils/getSessionUser';
import ProtectRoute from '@/app/utils/protectRoute';

// First call: reference data (muscle groups, exercises) + most recent 90 days of workouts
// Subsequent calls: older 90-day chunks
export async function getHydrationChunk(beforeDate?: string) {
    await ProtectRoute();
    const userId = await getSessionUserId();

    const endDate = beforeDate || new Date(Date.now() + 86400000).toISOString().split('T')[0]; // tomorrow
    const startDateObj = new Date(endDate);
    startDateObj.setDate(startDateObj.getDate() - 90);
    const startDate = startDateObj.toISOString().split('T')[0];

    // Reference data only on first chunk
    let muscleGroups: { id: number; name: string }[] = [];
    let exercises: { id: number; name: string; muscleGroupId: number; muscleGroupName: string }[] = [];

    if (!beforeDate) {
        const [mgResult, exResult] = await Promise.all([
            sql`SELECT id, name FROM muscle_group WHERE user_id = ${userId} ORDER BY name`,
            sql`SELECT e.id, e.name, e.muscle_group_id, mg.name AS muscle_group_name
                FROM exercise e JOIN muscle_group mg ON mg.id = e.muscle_group_id
                WHERE e.user_id = ${userId} ORDER BY e.name`,
        ]);
        muscleGroups = mgResult.rows.map(r => ({ id: r.id, name: r.name }));
        exercises = exResult.rows.map(r => ({
            id: r.id, name: r.name, muscleGroupId: r.muscle_group_id, muscleGroupName: r.muscle_group_name,
        }));
    }

    const wResult = await sql`
        SELECT id, date::text AS date, notes FROM workout
        WHERE user_id = ${userId} AND date >= ${startDate}::date AND date < ${endDate}::date
        ORDER BY date DESC;
    `;

    const workoutIds = wResult.rows.map(w => w.id);

    let weRows: any[] = [];
    let setRows: any[] = [];

    if (workoutIds.length > 0) {
        const weResult = await sql.query(
            `SELECT we.id, we.workout_id, we.exercise_id, we.sort_order,
                    e.name AS exercise_name, mg.name AS muscle_group_name,
                    COUNT(es.id)::int AS set_count
             FROM workout_exercise we
             JOIN exercise e ON e.id = we.exercise_id
             JOIN muscle_group mg ON mg.id = e.muscle_group_id
             LEFT JOIN exercise_set es ON es.workout_exercise_id = we.id
             WHERE we.workout_id = ANY($1)
             GROUP BY we.id, we.workout_id, we.exercise_id, we.sort_order, e.name, mg.name
             ORDER BY we.sort_order`,
            [workoutIds]
        );
        weRows = weResult.rows;

        const weIds = weRows.map((we: any) => we.id);
        if (weIds.length > 0) {
            const setResult = await sql.query(
                `SELECT id, workout_exercise_id, weight, weight_unit, reps,
                        distance, distance_unit, duration, tempo, notes, sort_order
                 FROM exercise_set
                 WHERE workout_exercise_id = ANY($1)
                 ORDER BY sort_order`,
                [weIds]
            );
            setRows = setResult.rows;
        }
    }

    return {
        muscleGroups,
        exercises,
        workouts: wResult.rows.map(r => ({ id: r.id, date: r.date, notes: r.notes })),
        workoutExercises: weRows.map((r: any) => ({
            id: r.id, workoutId: r.workout_id, exerciseId: r.exercise_id, sortOrder: r.sort_order,
            exerciseName: r.exercise_name, muscleGroupName: r.muscle_group_name, setCount: r.set_count,
        })),
        exerciseSets: setRows.map((r: any) => ({
            id: r.id, workoutExerciseId: r.workout_exercise_id,
            weight: r.weight ? parseFloat(r.weight) : null, weightUnit: r.weight_unit,
            reps: r.reps, distance: r.distance ? parseFloat(r.distance) : null,
            distanceUnit: r.distance_unit, duration: r.duration, tempo: r.tempo,
            notes: r.notes, sortOrder: r.sort_order,
        })),
        hasMore: wResult.rows.length > 0,
        nextBeforeDate: startDate,
    };
}
