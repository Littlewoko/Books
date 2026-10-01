'use server';

import {sql} from '@vercel/postgres';
import {revalidatePath} from 'next/cache';
import ProtectRoute from '@/app/utils/protectRoute';
import {getSessionUserId} from '@/app/utils/getSessionUser';

interface BatchMuscleGroup {
    permanentId: string;
    name: string;
}

interface BatchExercise {
    permanentId: string;
    name: string;
    muscleGroupPermanentId: string;
}

interface BatchWorkout {
    permanentId: string;
    date: string;
    notes: string | null;
}

interface BatchWorkoutExercise {
    permanentId: string;
    workoutPermanentId: string;
    exercisePermanentId: string;
    sortOrder: number;
}

interface BatchSet {
    permanentId: string;
    workoutExercisePermanentId: string;
    weight: number | null;
    weightUnit: string;
    reps: number | null;
    distance: number | null;
    distanceUnit: string | null;
    duration: number | null;
    tempo: string | null;
    notes: string | null;
    sortOrder: number;
    setType: string;
}

interface WorkoutBatch {
    muscleGroups: BatchMuscleGroup[];
    exercises: BatchExercise[];
    workouts: BatchWorkout[];
    workoutExercises: BatchWorkoutExercise[];
    sets: BatchSet[];
}

interface IdRow {
    id: number;
    permanent_id: string;
}

interface WorkoutRow extends IdRow {
    date: string;
}

interface PermanentIdMapping {
    localPermanentId: string;
    permanentId: string;
    serverId: number;
}

function mapRequiredIds(keys: string[], rows: IdRow[], tableName: string): number[] {
    const ids = new Map(rows.map(row => [row.permanent_id, Number(row.id)]));
    return keys.map(key => {
        const id = ids.get(key);
        if (id === undefined) throw new Error(`Missing ${tableName} permanent ID: ${key}`);
        return id;
    });
}

async function getWorkoutRows(userId: string, permanentIds: string[], dates: string[]) {
    if (permanentIds.length === 0 && dates.length === 0) return [] as WorkoutRow[];
    const result = await sql.query(
        `SELECT id, permanent_id, date::text AS date
         FROM workout
         WHERE user_id = $1
           AND (permanent_id = ANY($2::uuid[]) OR date = ANY($3::date[]))`,
        [userId, permanentIds, dates],
    );
    return result.rows as WorkoutRow[];
}

export async function pushWorkoutBatch(batch: WorkoutBatch): Promise<void> {
    await ProtectRoute();
    const userId = await getSessionUserId();

    if (batch.muscleGroups.length > 0) {
        await sql.query(
            `INSERT INTO muscle_group (permanent_id, name, user_id)
             SELECT * FROM UNNEST($1::uuid[], $2::text[], $3::uuid[])
             ON CONFLICT DO NOTHING`,
            [
                batch.muscleGroups.map(record => record.permanentId),
                batch.muscleGroups.map(record => record.name),
                batch.muscleGroups.map(() => userId),
            ],
        );
    }

    if (batch.exercises.length > 0) {
        const muscleGroupKeys = [...new Set(batch.exercises.map(record => record.muscleGroupPermanentId))];
        const muscleGroups = await sql.query(
            `SELECT id, permanent_id FROM muscle_group
             WHERE user_id = $1 AND permanent_id = ANY($2::uuid[])`,
            [userId, muscleGroupKeys],
        );
        const muscleGroupIds = mapRequiredIds(muscleGroupKeys, muscleGroups.rows as IdRow[], 'muscle group');
        const muscleGroupIdByKey = new Map(muscleGroupKeys.map((key, index) => [key, muscleGroupIds[index]]));

        await sql.query(
            `INSERT INTO exercise (permanent_id, name, muscle_group_id, user_id)
             SELECT * FROM UNNEST($1::uuid[], $2::text[], $3::int[], $4::uuid[])
             ON CONFLICT DO NOTHING`,
            [
                batch.exercises.map(record => record.permanentId),
                batch.exercises.map(record => record.name),
                batch.exercises.map(record => muscleGroupIdByKey.get(record.muscleGroupPermanentId)),
                batch.exercises.map(() => userId),
            ],
        );
    }

    if (batch.workouts.length > 0) {
        await sql.query(
            `INSERT INTO workout (permanent_id, date, user_id, notes)
             SELECT * FROM UNNEST($1::uuid[], $2::date[], $3::uuid[], $4::text[])
             ON CONFLICT DO NOTHING`,
            [
                batch.workouts.map(record => record.permanentId),
                batch.workouts.map(record => record.date),
                batch.workouts.map(() => userId),
                batch.workouts.map(record => record.notes),
            ],
        );
        await sql.query(
            `UPDATE workout AS w
             SET notes = COALESCE(v.notes, w.notes)
             FROM (SELECT * FROM UNNEST($1::date[], $2::text[]) AS t(date, notes)) AS v
             WHERE w.user_id = $3 AND w.date = v.date`,
            [
                batch.workouts.map(record => record.date),
                batch.workouts.map(record => record.notes),
                userId,
            ],
        );
    }

    if (batch.workoutExercises.length > 0) {
        const workoutKeys = [...new Set(batch.workoutExercises.map(record => record.workoutPermanentId))];
        const workoutDateByKey = new Map(batch.workouts.map(record => [record.permanentId, record.date]));
        const workoutRows = await getWorkoutRows(
            userId,
            workoutKeys,
            [...new Set(workoutKeys.flatMap(key => {
                const date = workoutDateByKey.get(key);
                return date ? [date] : [];
            }))],
        );
        const workoutByPermanentId = new Map(workoutRows.map(row => [row.permanent_id, row]));
        const workoutByDate = new Map(workoutRows.map(row => [row.date, row]));
        const workoutIds = batch.workoutExercises.map(record => {
            const date = workoutDateByKey.get(record.workoutPermanentId);
            const row = workoutByPermanentId.get(record.workoutPermanentId)
                ?? (date ? workoutByDate.get(date) : undefined);
            if (!row) throw new Error(`Missing workout permanent ID: ${record.workoutPermanentId}`);
            return Number(row.id);
        });

        const exerciseKeys = [...new Set(batch.workoutExercises.map(record => record.exercisePermanentId))];
        const exerciseRows = await sql.query(
            `SELECT id, permanent_id FROM exercise
             WHERE user_id = $1 AND permanent_id = ANY($2::uuid[])`,
            [userId, exerciseKeys],
        );
        const exerciseIds = mapRequiredIds(exerciseKeys, exerciseRows.rows as IdRow[], 'exercise');
        const exerciseIdByKey = new Map(exerciseKeys.map((key, index) => [key, exerciseIds[index]]));

        await sql.query(
            `INSERT INTO workout_exercise (permanent_id, workout_id, exercise_id, sort_order)
             SELECT * FROM UNNEST($1::uuid[], $2::int[], $3::int[], $4::int[])
             ON CONFLICT DO NOTHING`,
            [
                batch.workoutExercises.map(record => record.permanentId),
                workoutIds,
                batch.workoutExercises.map(record => exerciseIdByKey.get(record.exercisePermanentId)),
                batch.workoutExercises.map(record => record.sortOrder),
            ],
        );
    }

    if (batch.sets.length > 0) {
        const workoutExerciseKeys = [...new Set(batch.sets.map(record => record.workoutExercisePermanentId))];
        const workoutExercises = await sql.query(
            `SELECT we.id, we.permanent_id
             FROM workout_exercise we
             JOIN workout w ON w.id = we.workout_id
             WHERE w.user_id = $1 AND we.permanent_id = ANY($2::uuid[])`,
            [userId, workoutExerciseKeys],
        );
        const workoutExerciseIds = mapRequiredIds(
            workoutExerciseKeys,
            workoutExercises.rows as IdRow[],
            'workout exercise',
        );
        const workoutExerciseIdByKey = new Map(workoutExerciseKeys.map((key, index) => [key, workoutExerciseIds[index]]));

        await sql.query(
            `INSERT INTO exercise_set
                (permanent_id, workout_exercise_id, weight, weight_unit, reps, distance,
                 distance_unit, duration, tempo, notes, sort_order, set_type)
             SELECT * FROM UNNEST($1::uuid[], $2::int[], $3::numeric[], $4::text[], $5::int[],
                                 $6::numeric[], $7::text[], $8::int[], $9::text[], $10::text[],
                                 $11::int[], $12::text[])
             ON CONFLICT DO NOTHING`,
            [
                batch.sets.map(record => record.permanentId),
                batch.sets.map(record => workoutExerciseIdByKey.get(record.workoutExercisePermanentId)),
                batch.sets.map(record => record.weight),
                batch.sets.map(record => record.weightUnit),
                batch.sets.map(record => record.reps),
                batch.sets.map(record => record.distance),
                batch.sets.map(record => record.distanceUnit),
                batch.sets.map(record => record.duration),
                batch.sets.map(record => record.tempo),
                batch.sets.map(record => record.notes),
                batch.sets.map(record => record.sortOrder),
                batch.sets.map(record => record.setType),
            ],
        );
    }

    revalidatePath('/workouts');
}

export async function resolveWorkoutPermanentIds(batch: WorkoutBatch) {
    await ProtectRoute();
    const userId = await getSessionUserId();

    const [muscleGroupRows, exerciseRows, workoutRows, workoutExerciseRows, setRows] = await Promise.all([
        batch.muscleGroups.length === 0 ? Promise.resolve({rows: [] as IdRow[]}) : sql.query(
            `SELECT id, permanent_id FROM muscle_group
             WHERE user_id = $1 AND permanent_id = ANY($2::uuid[])`,
            [userId, batch.muscleGroups.map(record => record.permanentId)],
        ),
        batch.exercises.length === 0 ? Promise.resolve({rows: [] as IdRow[]}) : sql.query(
            `SELECT id, permanent_id FROM exercise
             WHERE user_id = $1 AND permanent_id = ANY($2::uuid[])`,
            [userId, batch.exercises.map(record => record.permanentId)],
        ),
        getWorkoutRows(
            userId,
            batch.workouts.map(record => record.permanentId),
            batch.workouts.map(record => record.date),
        ),
        batch.workoutExercises.length === 0 ? Promise.resolve({rows: [] as IdRow[]}) : sql.query(
            `SELECT we.id, we.permanent_id
             FROM workout_exercise we
             JOIN workout w ON w.id = we.workout_id
             WHERE w.user_id = $1 AND we.permanent_id = ANY($2::uuid[])`,
            [userId, batch.workoutExercises.map(record => record.permanentId)],
        ),
        batch.sets.length === 0 ? Promise.resolve({rows: [] as IdRow[]}) : sql.query(
            `SELECT es.id, es.permanent_id
             FROM exercise_set es
             JOIN workout_exercise we ON we.id = es.workout_exercise_id
             JOIN workout w ON w.id = we.workout_id
             WHERE w.user_id = $1 AND es.permanent_id = ANY($2::uuid[])`,
            [userId, batch.sets.map(record => record.permanentId)],
        ),
    ]);

    const mapDirect = (records: {permanentId: string}[], rows: IdRow[]): PermanentIdMapping[] => {
        const rowByPermanentId = new Map(rows.map(row => [row.permanent_id, row]));
        return records.flatMap(record => {
            const row = rowByPermanentId.get(record.permanentId);
            return row ? [{
                localPermanentId: record.permanentId,
                permanentId: row.permanent_id,
                serverId: Number(row.id),
            }] : [];
        });
    };

    const workoutByPermanentId = new Map(workoutRows.map(row => [row.permanent_id, row]));
    const workoutByDate = new Map(workoutRows.map(row => [row.date, row]));
    const workouts = batch.workouts.flatMap(record => {
        const row = workoutByPermanentId.get(record.permanentId) ?? workoutByDate.get(record.date);
        return row ? [{
            localPermanentId: record.permanentId,
            permanentId: row.permanent_id,
            serverId: Number(row.id),
        }] : [];
    });

    return {
        muscleGroups: mapDirect(batch.muscleGroups, muscleGroupRows.rows as IdRow[]),
        exercises: mapDirect(batch.exercises, exerciseRows.rows as IdRow[]),
        workouts,
        workoutExercises: mapDirect(batch.workoutExercises, workoutExerciseRows.rows as IdRow[]),
        sets: mapDirect(batch.sets, setRows.rows as IdRow[]),
    };
}