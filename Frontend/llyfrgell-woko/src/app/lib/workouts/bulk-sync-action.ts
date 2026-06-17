'use server';

import {sql} from '@vercel/postgres';
import {revalidatePath} from 'next/cache';
import ProtectRoute from '@/app/utils/protectRoute';
import {getSessionUserId} from '@/app/utils/getSessionUser';

interface BulkSyncPayload {
    muscleGroups: { localId: number; name: string; idempotencyKey: string }[];
    exercises: { localId: number; name: string; muscleGroupId: number; idempotencyKey: string }[];
    workouts: { localId: number; date: string; notes?: string | null; idempotencyKey: string }[];
    workoutExercises: {
        localId: number;
        workoutId: number;
        exerciseId: number;
        sortOrder: number;
        idempotencyKey: string
    }[];
    sets: {
        localId: number;
        workoutExerciseId: number;
        weight: number | null;
        weightUnit: string;
        reps: number | null;
        notes: string | null;
        setType: string;
        sortOrder: number;
        idempotencyKey: string
    }[];
    updateSets: {
        id: number;
        weight: number | null;
        weightUnit: string;
        reps: number | null;
        notes: string | null;
        setType: string;
        sortOrder: number
    }[];
    updateWorkoutExercises: { id: number; sortOrder: number }[];
    deleteWorkoutExercises: number[];
    deleteSets: number[];
}

interface BulkSyncResult {
    muscleGroups: { localId: number; serverId: number }[];
    exercises: { localId: number; serverId: number }[];
    workouts: { localId: number; serverId: number }[];
    workoutExercises: { localId: number; serverId: number }[];
    sets: { localId: number; serverId: number }[];
}

export async function bulkSync(payload: BulkSyncPayload): Promise<BulkSyncResult> {
    await ProtectRoute();
    const userId = await getSessionUserId();

    const result: BulkSyncResult = {
        muscleGroups: [],
        exercises: [],
        workouts: [],
        workoutExercises: [],
        sets: [],
    };

    const mgMap = new Map<number, number>();
    const exMap = new Map<number, number>();
    const wMap = new Map<number, number>();
    const weMap = new Map<number, number>();

    // Helper: bulk check idempotency keys, returns map of key → entity_id
    async function bulkCheckIdempotency(keys: string[]): Promise<Map<string, number>> {
        if (keys.length === 0) return new Map();
        const r = await sql.query(
            `SELECT idempotency_key, entity_id
             FROM idempotency_log
             WHERE idempotency_key = ANY ($1)`,
            [keys]
        );
        return new Map(r.rows.map((row: {
            idempotency_key: string;
            entity_id: number
        }) => [row.idempotency_key, row.entity_id]));
    }

    // Helper: bulk log idempotency
    async function bulkLogIdempotency(entries: { key: string; table: string; id: number }[]) {
        if (entries.length === 0) return;
        const keys = entries.map(e => e.key);
        const tables = entries.map(e => e.table);
        const ids = entries.map(e => e.id);
        await sql.query(
            `INSERT INTO idempotency_log (idempotency_key, entity_table, entity_id)
             SELECT *
             FROM UNNEST($1::text[], $2::text[], $3::int[]) ON CONFLICT (idempotency_key) DO NOTHING`,
            [keys, tables, ids]
        );
    }

    // 1. Muscle groups
    if (payload.muscleGroups.length > 0) {
        const existing = await bulkCheckIdempotency(payload.muscleGroups.map(mg => mg.idempotencyKey));
        const toInsert = payload.muscleGroups.filter(mg => {
            const serverId = existing.get(mg.idempotencyKey);
            if (serverId != null) {
                mgMap.set(mg.localId, serverId);
                result.muscleGroups.push({localId: mg.localId, serverId});
                return false;
            }
            return true;
        });

        if (toInsert.length > 0) {
            const names = toInsert.map(mg => mg.name);
            const userIds = toInsert.map(() => userId);
            const r = await sql.query(
                `INSERT INTO muscle_group (name, user_id)
                 SELECT * FROM UNNEST($1::text[], $2::uuid[])
                 RETURNING id`,
                [names, userIds]
            );
            const idempEntries: { key: string; table: string; id: number }[] = [];
            for (let i = 0; i < toInsert.length; i++) {
                const serverId = r.rows[i].id as number;
                mgMap.set(toInsert[i].localId, serverId);
                result.muscleGroups.push({localId: toInsert[i].localId, serverId});
                idempEntries.push({key: toInsert[i].idempotencyKey, table: 'muscle_group', id: serverId});
            }
            await bulkLogIdempotency(idempEntries);
        }
    }

    // 2. Exercises
    if (payload.exercises.length > 0) {
        const existing = await bulkCheckIdempotency(payload.exercises.map(ex => ex.idempotencyKey));
        const toInsert = payload.exercises.filter(ex => {
            const serverId = existing.get(ex.idempotencyKey);
            if (serverId != null) {
                exMap.set(ex.localId, serverId);
                result.exercises.push({localId: ex.localId, serverId});
                return false;
            }
            return true;
        });

        if (toInsert.length > 0) {
            const names = toInsert.map(ex => ex.name);
            const mgIds = toInsert.map(ex => mgMap.get(ex.muscleGroupId) ?? ex.muscleGroupId);
            const userIds = toInsert.map(() => userId);
            const r = await sql.query(
                `INSERT INTO exercise (name, muscle_group_id, user_id)
                 SELECT * FROM UNNEST($1::text[], $2::int[], $3::uuid[])
                 RETURNING id`,
                [names, mgIds, userIds]
            );
            const idempEntries: { key: string; table: string; id: number }[] = [];
            for (let i = 0; i < toInsert.length; i++) {
                const serverId = r.rows[i].id as number;
                exMap.set(toInsert[i].localId, serverId);
                result.exercises.push({localId: toInsert[i].localId, serverId});
                idempEntries.push({key: toInsert[i].idempotencyKey, table: 'exercise', id: serverId});
            }
            await bulkLogIdempotency(idempEntries);
        }
    }

    // 3. Workouts
    if (payload.workouts.length > 0) {
        const existing = await bulkCheckIdempotency(payload.workouts.map(w => w.idempotencyKey));
        const toInsert = payload.workouts.filter(w => {
            const serverId = existing.get(w.idempotencyKey);
            if (serverId != null) {
                wMap.set(w.localId, serverId);
                result.workouts.push({localId: w.localId, serverId});
                return false;
            }
            return true;
        });

        if (toInsert.length > 0) {
            const dates = toInsert.map(w => w.date);
            const userIds = toInsert.map(() => userId);
            const notes = toInsert.map(w => w.notes ?? null);
            const r = await sql.query(
                `INSERT INTO workout (date, user_id, notes)
                 SELECT * FROM UNNEST($1::date[], $2::uuid[], $3::text[])
                 ON CONFLICT (date, user_id) DO UPDATE SET notes = COALESCE(EXCLUDED.notes, workout.notes)
                 RETURNING id`,
                [dates, userIds, notes]
            );
            const idempEntries: { key: string; table: string; id: number }[] = [];
            for (let i = 0; i < toInsert.length; i++) {
                const serverId = r.rows[i].id as number;
                wMap.set(toInsert[i].localId, serverId);
                result.workouts.push({localId: toInsert[i].localId, serverId});
                idempEntries.push({key: toInsert[i].idempotencyKey, table: 'workout', id: serverId});
            }
            await bulkLogIdempotency(idempEntries);
        }
    }

    // 4. Workout exercises
    if (payload.workoutExercises.length > 0) {
        const existing = await bulkCheckIdempotency(payload.workoutExercises.map(we => we.idempotencyKey));
        const toInsert = payload.workoutExercises.filter(we => {
            const serverId = existing.get(we.idempotencyKey);
            if (serverId != null) {
                weMap.set(we.localId, serverId);
                result.workoutExercises.push({localId: we.localId, serverId});
                return false;
            }
            return true;
        });

        if (toInsert.length > 0) {
            const workoutIds = toInsert.map(we => wMap.get(we.workoutId) ?? we.workoutId);
            const exerciseIds = toInsert.map(we => exMap.get(we.exerciseId) ?? we.exerciseId);
            const sortOrders = toInsert.map(we => we.sortOrder);
            const r = await sql.query(
                `INSERT INTO workout_exercise (workout_id, exercise_id, sort_order)
                 SELECT *
                 FROM UNNEST($1::int[], $2::int[], $3::int[]) RETURNING id`,
                [workoutIds, exerciseIds, sortOrders]
            );
            const idempEntries: { key: string; table: string; id: number }[] = [];
            for (let i = 0; i < toInsert.length; i++) {
                const serverId = r.rows[i].id as number;
                weMap.set(toInsert[i].localId, serverId);
                result.workoutExercises.push({localId: toInsert[i].localId, serverId});
                idempEntries.push({key: toInsert[i].idempotencyKey, table: 'workout_exercise', id: serverId});
            }
            await bulkLogIdempotency(idempEntries);
        }
    }

    // 5. Sets
    if (payload.sets.length > 0) {
        const existing = await bulkCheckIdempotency(payload.sets.map(s => s.idempotencyKey));
        const toInsert = payload.sets.filter(s => {
            const serverId = existing.get(s.idempotencyKey);
            if (serverId != null) {
                result.sets.push({localId: s.localId, serverId});
                return false;
            }
            return true;
        });

        if (toInsert.length > 0) {
            const weIds = toInsert.map(s => weMap.get(s.workoutExerciseId) ?? s.workoutExerciseId);
            const weights = toInsert.map(s => s.weight);
            const weightUnits = toInsert.map(s => s.weightUnit);
            const reps = toInsert.map(s => s.reps);
            const notesList = toInsert.map(s => s.notes);
            const sortOrders = toInsert.map(s => s.sortOrder);
            const setTypes = toInsert.map(s => s.setType);
            const r = await sql.query(
                `INSERT INTO exercise_set (workout_exercise_id, weight, weight_unit, reps, notes, sort_order, set_type)
                 SELECT *
                 FROM UNNEST($1::int[], $2::numeric[], $3::text[], $4::int[], $5::text[], $6::int[],
                             $7::text[]) RETURNING id`,
                [weIds, weights, weightUnits, reps, notesList, sortOrders, setTypes]
            );
            const idempEntries: { key: string; table: string; id: number }[] = [];
            for (let i = 0; i < toInsert.length; i++) {
                const serverId = r.rows[i].id as number;
                result.sets.push({localId: toInsert[i].localId, serverId});
                idempEntries.push({key: toInsert[i].idempotencyKey, table: 'exercise_set', id: serverId});
            }
            await bulkLogIdempotency(idempEntries);
        }
    }

    // 6. Update sets (single query using UNNEST + UPDATE FROM)
    if (payload.updateSets.length > 0) {
        const ids = payload.updateSets.map(s => s.id);
        const weights = payload.updateSets.map(s => s.weight);
        const weightUnits = payload.updateSets.map(s => s.weightUnit);
        const repsList = payload.updateSets.map(s => s.reps);
        const notesList = payload.updateSets.map(s => s.notes);
        const setTypes = payload.updateSets.map(s => s.setType);
        const sortOrders = payload.updateSets.map(s => s.sortOrder);
        await sql.query(
            `UPDATE exercise_set es
             SET weight = v.weight,
                 weight_unit = v.weight_unit,
                 reps = v.reps,
                 notes       = v.notes,
                 set_type    = v.set_type,
                 sort_order  = v.sort_order FROM (SELECT * FROM UNNEST($1:: int [], $2:: numeric [], $3::text[], $4:: int [], $5::text[], $6::text[], $7:: int [])
                 AS t(id, weight, weight_unit, reps, notes, set_type, sort_order)) v
                 JOIN workout_exercise we
             ON es.workout_exercise_id = we.id
                 JOIN workout w ON we.workout_id = w.id
             WHERE es.id = v.id AND w.user_id = $8`,
            [ids, weights, weightUnits, repsList, notesList, setTypes, sortOrders, userId]
        );
    }

    // 7. Update workout exercise sort orders
    if (payload.updateWorkoutExercises.length > 0) {
        const ids = payload.updateWorkoutExercises.map(we => we.id);
        const sortOrders = payload.updateWorkoutExercises.map(we => we.sortOrder);
        await sql.query(
            `UPDATE workout_exercise we
             SET sort_order = v.sort_order FROM (SELECT * FROM UNNEST($1:: int []
               , $2:: int []) AS t(id
               , sort_order)) v
                 JOIN workout w
             ON we.workout_id = w.id
             WHERE we.id = v.id AND w.user_id = $3`,
            [ids, sortOrders, userId]
        );
    }

    // 8. Delete sets
    if (payload.deleteSets.length > 0) {
        await sql.query(
            `DELETE FROM exercise_set es USING workout_exercise we, workout w WHERE es.id = ANY($1) AND es.workout_exercise_id = we.id AND we.workout_id = w.id AND w.user_id = $2`,
            [payload.deleteSets, userId]
        );
    }

    // 9. Delete workout exercises (cascade: delete their sets first)
    if (payload.deleteWorkoutExercises.length > 0) {
        await sql.query(
            `DELETE FROM exercise_set WHERE workout_exercise_id = ANY($1)`,
            [payload.deleteWorkoutExercises]
        );
        await sql.query(
            `DELETE FROM workout_exercise we USING workout w WHERE we.id = ANY($1) AND we.workout_id = w.id AND w.user_id = $2`,
            [payload.deleteWorkoutExercises, userId]
        );
    }

    revalidatePath('/workouts');
    return result;
}
