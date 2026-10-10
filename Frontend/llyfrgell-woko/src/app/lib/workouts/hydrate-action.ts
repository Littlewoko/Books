'use server';

import { sql, type QueryResultRow } from '@/app/lib/db';
import { getSessionUserId } from '@/app/utils/getSessionUser';
import ProtectRoute from '@/app/utils/protectRoute';

type WorkoutExerciseRow = QueryResultRow & {
    id: number;
    permanent_id: string;
    workout_id: number;
    exercise_id: number;
    sort_order: number;
    exercise_name: string;
    muscle_group_name: string;
    set_count: number;
};

type ExerciseSetRow = QueryResultRow & {
    id: number;
    permanent_id: string;
    workout_exercise_id: number;
    weight: string | number | null;
    weight_unit: string;
    reps: number | null;
    distance: string | number | null;
    distance_unit: string | null;
    duration: number | null;
    tempo: string | null;
    notes: string | null;
    sort_order: number;
    set_type: string;
};

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
    let muscleGroups: { id: number; permanentId: string; name: string; colour: string; userId: string | null; isDefault: boolean }[] = [];
    let exercises: { id: number; permanentId: string; name: string; muscleGroupId: number; muscleGroupName: string; userId: string | null; isDefault: boolean }[] = [];

    if (!beforeDate) {
        const [mgResult, exResult] = await Promise.all([
            sql`SELECT mg.id, mg.permanent_id, COALESCE(pref.name, mg.name) AS name,
                       COALESCE(pref.colour, mg.colour, '#737373') AS colour,
                       mg.user_id, (mg.user_id IS NULL) AS is_default
                FROM muscle_group mg
                LEFT JOIN muscle_group_preference pref
                    ON pref.muscle_group_id = mg.id AND pref.user_id = ${userId}
                WHERE (mg.user_id = ${userId} OR mg.user_id IS NULL)
                  AND NOT COALESCE(pref.is_hidden, false)
                ORDER BY COALESCE(pref.name, mg.name)`,
            sql`SELECT e.id, e.permanent_id, COALESCE(pref.name, e.name) AS name,
                       COALESCE(pref.muscle_group_id, e.muscle_group_id) AS muscle_group_id,
                       COALESCE(mg_pref.name, mg.name) AS muscle_group_name,
                       e.user_id, (e.user_id IS NULL) AS is_default
                FROM exercise e
                LEFT JOIN exercise_preference pref
                    ON pref.exercise_id = e.id AND pref.user_id = ${userId}
                JOIN muscle_group mg ON mg.id = COALESCE(pref.muscle_group_id, e.muscle_group_id)
                LEFT JOIN muscle_group_preference mg_pref
                    ON mg_pref.muscle_group_id = mg.id AND mg_pref.user_id = ${userId}
                WHERE (e.user_id = ${userId} OR e.user_id IS NULL)
                  AND (mg.user_id = ${userId} OR mg.user_id IS NULL)
                  AND NOT COALESCE(pref.is_hidden, false)
                  AND NOT COALESCE(mg_pref.is_hidden, false)
                ORDER BY COALESCE(mg_pref.name, mg.name), COALESCE(pref.name, e.name)`,
        ]);
        muscleGroups = mgResult.rows.map(r => ({
            id: r.id,
            permanentId: r.permanent_id,
            name: r.name,
            colour: r.colour,
            userId: r.user_id ?? null,
            isDefault: r.is_default,
        }));
        exercises = exResult.rows.map(r => ({
            id: r.id,
            permanentId: r.permanent_id,
            name: r.name,
            muscleGroupId: r.muscle_group_id,
            muscleGroupName: r.muscle_group_name,
            userId: r.user_id ?? null,
            isDefault: r.is_default,
        }));
    }

    const wResult = await sql`
        SELECT id, permanent_id, date::text AS date, notes FROM workout
        WHERE user_id = ${userId} AND date >= ${startDate}::date AND date < ${endDate}::date
        ORDER BY date DESC;
    `;

    const workoutIds = wResult.rows.map(w => w.id);

    let weRows: WorkoutExerciseRow[] = [];
    let setRows: ExerciseSetRow[] = [];

    if (workoutIds.length > 0) {
        const weResult = await sql.query<WorkoutExerciseRow>(
                `SELECT we.id, we.permanent_id, we.workout_id, we.exercise_id, we.sort_order,
                    COALESCE(ep.name, e.name) AS exercise_name,
                    COALESCE(mgp.name, mg.name) AS muscle_group_name,
                    COUNT(es.id)::int AS set_count
             FROM workout_exercise we
             JOIN exercise e ON e.id = we.exercise_id
                 LEFT JOIN exercise_preference ep ON ep.exercise_id = e.id AND ep.user_id = $2
                 JOIN muscle_group mg ON mg.id = COALESCE(ep.muscle_group_id, e.muscle_group_id)
                 LEFT JOIN muscle_group_preference mgp ON mgp.muscle_group_id = mg.id AND mgp.user_id = $2
             LEFT JOIN exercise_set es ON es.workout_exercise_id = we.id
             WHERE we.workout_id = ANY($1)
                 GROUP BY we.id, we.workout_id, we.exercise_id, we.sort_order, e.name, ep.name, mg.name, mgp.name
             ORDER BY we.sort_order`,
                [workoutIds, userId]
        );
        weRows = weResult.rows;

        const weIds = weRows.map(we => we.id);
        if (weIds.length > 0) {
            const setResult = await sql.query<ExerciseSetRow>(
                `SELECT id, permanent_id, workout_exercise_id, weight, weight_unit, reps,
                        distance, distance_unit, duration, tempo, notes, sort_order,
                        COALESCE(set_type, 'working') AS set_type
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
        workouts: wResult.rows.map(r => ({ id: r.id, permanentId: r.permanent_id, date: r.date, notes: r.notes })),
        workoutExercises: weRows.map(r => ({
            id: r.id, permanentId: r.permanent_id, workoutId: r.workout_id, exerciseId: r.exercise_id, sortOrder: r.sort_order,
            exerciseName: r.exercise_name, muscleGroupName: r.muscle_group_name, setCount: r.set_count,
        })),
        exerciseSets: setRows.map(r => ({
            id: r.id, permanentId: r.permanent_id, workoutExerciseId: r.workout_exercise_id,
            weight: r.weight != null ? Number(r.weight) : null, weightUnit: r.weight_unit,
            reps: r.reps, distance: r.distance != null ? Number(r.distance) : null,
            distanceUnit: r.distance_unit, duration: r.duration, tempo: r.tempo,
            notes: r.notes, sortOrder: r.sort_order,
            setType: r.set_type,
        })),
        hasMore: wResult.rows.length > 0,
        nextBeforeDate: startDate,
    };
}
