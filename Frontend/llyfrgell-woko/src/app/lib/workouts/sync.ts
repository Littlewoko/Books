import {db} from './local-db';
import {
    addExerciseToWorkout,
    addSet,
    createExercise,
    createMuscleGroup,
    createWorkout,
    deleteSet,
    removeExerciseFromWorkout,
    updateSet,
    updateWorkoutExerciseSortOrder,
} from './actions';

// Remap a record's ID in IndexedDB: delete old, insert with new ID, update child references
async function remapMuscleGroup(localId: number, serverId: number) {
    const mg = await db.muscleGroups.get(localId);
    if (!mg) return;
    await db.muscleGroups.delete(localId);
    await db.muscleGroups.put({...mg, id: serverId});
    const exercises = await db.exercises.where('muscleGroupId').equals(localId).toArray();
    for (const ex of exercises) {
        await db.exercises.update(ex.id, {muscleGroupId: serverId});
    }
}

async function remapExercise(localId: number, serverId: number) {
    const ex = await db.exercises.get(localId);
    if (!ex) return;
    await db.exercises.delete(localId);
    await db.exercises.put({...ex, id: serverId});
    const wes = await db.workoutExercises.where('exerciseId').equals(localId).toArray();
    for (const we of wes) {
        await db.workoutExercises.update(we.id, {exerciseId: serverId});
    }
}

async function remapWorkout(localId: number, serverId: number) {
    const w = await db.workouts.get(localId);
    if (!w) return;
    await db.workouts.delete(localId);
    await db.workouts.put({...w, id: serverId});
    const wes = await db.workoutExercises.where('workoutId').equals(localId).toArray();
    for (const we of wes) {
        await db.workoutExercises.update(we.id, {workoutId: serverId});
    }
}

async function remapWorkoutExercise(localId: number, serverId: number) {
    const we = await db.workoutExercises.get(localId);
    if (!we) return;
    await db.workoutExercises.delete(localId);
    await db.workoutExercises.put({...we, id: serverId});
    const sets = await db.exerciseSets.where('workoutExerciseId').equals(localId).toArray();
    for (const s of sets) {
        await db.exerciseSets.update(s.id, {workoutExerciseId: serverId});
    }
}

async function remapExerciseSet(
    localId: number,
    serverId: number,
    syncedDirty?: number,
) {
    const s = await db.exerciseSets.get(localId);
    if (!s) return;

    const dirty = s.dirty === syncedDirty ? undefined : s.dirty;
    await db.exerciseSets.delete(localId);
    await db.exerciseSets.put({...s, id: serverId, dirty});
}

const SYNC_CONCURRENCY = 8;

async function mapConcurrent<T, R>(
    items: readonly T[],
    worker: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
    const results = new Array<PromiseSettledResult<R>>(items.length);
    let nextIndex = 0;
    const workerCount = Math.min(SYNC_CONCURRENCY, items.length);

    await Promise.all(
        Array.from({length: workerCount}, async () => {
            while (true) {
                const index = nextIndex++;
                if (index >= items.length) return;

                try {
                    results[index] = {
                        status: 'fulfilled',
                        value: await worker(items[index]),
                    };
                } catch (reason) {
                    results[index] = {status: 'rejected', reason};
                }
            }
        }),
    );

    return results;
}

async function syncCreatedRecords<T>(
    records: readonly T[],
    create: (record: T) => Promise<number>,
    remap: (record: T, serverId: number) => Promise<void>,
): Promise<{synced: number; failed: number}> {
    const results = await mapConcurrent(records, create);
    let synced = 0;
    let failed = 0;

    // Apply local remaps after the server calls finish. Keep these sequential
    // and finish them before starting the dependent entity phase.
    for (let i = 0; i < records.length; i++) {
        const result = results[i];

        if (result.status === 'rejected') {
            failed++;
            continue;
        }

        try {
            await remap(records[i], result.value);
            synced++;
        } catch {
            failed++;
        }
    }

    return {synced, failed};
}

async function syncDeletionPhase(
    records: {id?: number; serverId: number}[],
    remove: (serverId: number) => Promise<void>,
): Promise<{synced: number; failed: number}> {
    const results = await mapConcurrent(records, record => remove(record.serverId));
    const completedIds: number[] = [];
    let synced = 0;
    let failed = 0;

    for (let i = 0; i < records.length; i++) {
        const deletionId = records[i].id;

        if (results[i].status === 'fulfilled' && deletionId !== undefined) {
            completedIds.push(deletionId);
            synced++;
        } else {
            failed++;
        }
    }

    if (completedIds.length > 0) {
        await db.deletions.bulkDelete(completedIds);
    }

    return {synced, failed};
}

// Mutex to prevent concurrent flushes
let flushLock: Promise<void> = Promise.resolve();

export async function flushSyncQueue(): Promise<{ synced: number; failed: number }> {
    const prev = flushLock;
    let resolve: () => void;
    flushLock = new Promise(r => {
        resolve = r;
    });
    await prev;

    let synced = 0;
    let failed = 0;

    try {
        // 1. Muscle groups
        const newMgs = await db.muscleGroups.where('id').below(0).toArray();
        const mgResult = await syncCreatedRecords(
            newMgs,
            mg => createMuscleGroup(mg.name, mg.idempotencyKey),
            (mg, serverId) => remapMuscleGroup(mg.id, serverId),
        );
        synced += mgResult.synced;
        failed += mgResult.failed;

        // 2. Exercises: wait for muscle-group remaps before this phase.
        const newExercises = await db.exercises.where('id').below(0).toArray();
        const exercisesWithSyncedParent = newExercises.filter(ex => ex.muscleGroupId >= 0);
        failed += newExercises.length - exercisesWithSyncedParent.length;

        const exerciseResult = await syncCreatedRecords(
            exercisesWithSyncedParent,
            ex => createExercise(ex.name, ex.muscleGroupId, ex.idempotencyKey),
            (ex, serverId) => remapExercise(ex.id, serverId),
        );
        synced += exerciseResult.synced;
        failed += exerciseResult.failed;

        // 3. Workouts
        const newWorkouts = await db.workouts.where('id').below(0).toArray();
        const workoutResult = await syncCreatedRecords(
            newWorkouts,
            workout => createWorkout(workout.date, workout.notes ?? undefined, workout.idempotencyKey),
            (workout, serverId) => remapWorkout(workout.id, serverId),
        );
        synced += workoutResult.synced;
        failed += workoutResult.failed;

        // 4. Workout exercises: wait for workout and exercise remaps.
        const newWes = await db.workoutExercises.where('id').below(0).toArray();
        const wesWithSyncedParents = newWes.filter(
            we => we.workoutId >= 0 && we.exerciseId >= 0,
        );
        failed += newWes.length - wesWithSyncedParents.length;

        const weResult = await syncCreatedRecords(
            wesWithSyncedParents,
            we => addExerciseToWorkout(we.workoutId, we.exerciseId, we.sortOrder, we.idempotencyKey),
            (we, serverId) => remapWorkoutExercise(we.id, serverId),
        );
        synced += weResult.synced;
        failed += weResult.failed;

        // 5. Sets: wait for workout-exercise remaps.
        const newSets = await db.exerciseSets.where('id').below(0).toArray();
        const setsWithSyncedParent = newSets.filter(set => set.workoutExerciseId >= 0);
        failed += newSets.length - setsWithSyncedParent.length;

        const setResult = await syncCreatedRecords(
            setsWithSyncedParent,
            set => addSet(
                set.workoutExerciseId,
                set.weight,
                set.weightUnit,
                set.reps,
                set.notes ?? undefined,
                set.setType,
                set.sortOrder,
                set.idempotencyKey,
            ),
            (set, serverId) => remapExerciseSet(set.id, serverId, set.dirty),
        );
        synced += setResult.synced;
        failed += setResult.failed;

        // 6. Update dirty sets. Clear dirty only if the record hasn't changed
        // again since this upload started.
        const dirtySets = await db.exerciseSets.where('dirty').above(0).toArray();
        const dirtySetUpdates = dirtySets.filter(set => set.id > 0);
        const setUpdateResults = await mapConcurrent(dirtySetUpdates, async set => {
            await updateSet(
                set.id,
                set.weight,
                set.weightUnit,
                set.reps,
                set.notes ?? undefined,
                set.setType,
                set.sortOrder,
            );
        });

        for (let i = 0; i < dirtySetUpdates.length; i++) {
            const set = dirtySetUpdates[i];
            if (setUpdateResults[i].status === 'rejected') {
                failed++;
                continue;
            }

            const current = await db.exerciseSets.get(set.id);
            if (current?.dirty === set.dirty) {
                await db.exerciseSets.update(set.id, {dirty: undefined});
            }
            synced++;
        }

        // 7. Update dirty workout-exercise sort orders.
        const dirtyWes = await db.workoutExercises.where('dirty').above(0).toArray();
        const dirtyWeUpdates = dirtyWes.filter(we => we.id > 0);
        const weUpdateResults = await mapConcurrent(dirtyWeUpdates, async we => {
            await updateWorkoutExerciseSortOrder(we.id, we.sortOrder);
        });

        for (let i = 0; i < dirtyWeUpdates.length; i++) {
            const we = dirtyWeUpdates[i];
            if (weUpdateResults[i].status === 'rejected') {
                failed++;
                continue;
            }

            const current = await db.workoutExercises.get(we.id);
            if (current?.dirty === we.dirty) {
                await db.workoutExercises.update(we.id, {dirty: undefined});
            }
            synced++;
        }

        // 8. Delete sets before workout exercises to preserve dependency order.
        const deletions = await db.deletions.toArray();
        const setDeletions = deletions.filter(d => d.table === 'exercise_set');
        const setDeleteResult = await syncDeletionPhase(setDeletions, deleteSet);
        synced += setDeleteResult.synced;
        failed += setDeleteResult.failed;

        const workoutExerciseDeletions = deletions.filter(d => d.table === 'workout_exercise');
        const weDeleteResult = await syncDeletionPhase(
            workoutExerciseDeletions,
            removeExerciseFromWorkout,
        );
        synced += weDeleteResult.synced;
        failed += weDeleteResult.failed;

        // Retain the previous behavior for any unexpected deletion-table value:
        // remove the local queue entry without issuing a server delete.
        const unsupportedDeletions = deletions.filter(
            d => d.table !== 'exercise_set' && d.table !== 'workout_exercise',
        );
        if (unsupportedDeletions.length > 0) {
            await db.deletions.bulkDelete(
                unsupportedDeletions.flatMap(d => d.id === undefined ? [] : [d.id]),
            );
            synced += unsupportedDeletions.length;
        }
    } catch {
        failed++;
    } finally {
        resolve!();
    }

    return {synced, failed};
}

export async function getPendingSyncCount(): Promise<number> {
    const [mgs, exercises, workouts, wes, newSets, dirtySets, dirtyWes, deletions] = await Promise.all([
        db.muscleGroups.where('id').below(0).count(),
        db.exercises.where('id').below(0).count(),
        db.workouts.where('id').below(0).count(),
        db.workoutExercises.where('id').below(0).count(),
        db.exerciseSets.where('id').below(0).count(),
        db.exerciseSets.where('dirty').above(0).count(),
        db.workoutExercises.where('dirty').above(0).count(),
        db.deletions.count(),
    ]);
    return mgs + exercises + workouts + wes + newSets + dirtySets + dirtyWes + deletions;
}

// Hydrate local DB from server data
export async function hydrateChunk(data: {
    muscleGroups: { id: number; name: string; colour: string }[];
    exercises: { id: number; name: string; muscleGroupId: number; muscleGroupName: string }[];
    workouts: { id: number; date: string; notes?: string | null }[];
    workoutExercises: {
        id: number;
        workoutId: number;
        exerciseId: number;
        sortOrder: number;
        exerciseName: string;
        muscleGroupName: string;
        setCount: number
    }[];
    exerciseSets: {
        id: number;
        workoutExerciseId: number;
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
    }[];
}, isFirstChunk: boolean, clearSyncData: boolean = true) {
    await db.transaction('rw', [db.muscleGroups, db.exercises, db.workouts, db.workoutExercises, db.exerciseSets, db.deletions, db.syncMeta], async () => {
        if (isFirstChunk) {
            // Collect locally-created records (negative IDs) to preserve through hydration
            const localMgs = clearSyncData ? [] : await db.muscleGroups.where('id').below(0).toArray();
            const localExercises = clearSyncData ? [] : await db.exercises.where('id').below(0).toArray();
            const localWorkouts = clearSyncData ? [] : await db.workouts.where('id').below(0).toArray();
            const localWes = clearSyncData ? [] : await db.workoutExercises.where('id').below(0).toArray();
            const localSets = clearSyncData ? [] : await db.exerciseSets.where('id').below(0).toArray();

            await db.muscleGroups.clear();
            await db.exercises.clear();
            await db.workouts.clear();
            await db.workoutExercises.clear();
            await db.exerciseSets.clear();
            if (clearSyncData) {
                await db.deletions.clear();
            }

            // Re-insert local records
            if (localMgs.length > 0) await db.muscleGroups.bulkPut(localMgs);
            if (localExercises.length > 0) await db.exercises.bulkPut(localExercises);
            if (localWorkouts.length > 0) await db.workouts.bulkPut(localWorkouts);
            if (localWes.length > 0) await db.workoutExercises.bulkPut(localWes);
            if (localSets.length > 0) await db.exerciseSets.bulkPut(localSets);
        }

        if (data.muscleGroups.length > 0) await db.muscleGroups.bulkPut(data.muscleGroups);
        if (data.exercises.length > 0) await db.exercises.bulkPut(data.exercises);
        if (data.workouts.length > 0) await db.workouts.bulkPut(data.workouts);
        if (data.workoutExercises.length > 0) await db.workoutExercises.bulkPut(data.workoutExercises);
        if (data.exerciseSets.length > 0) {
            // Preserve locally-modified sets that haven't been synced yet
            const dirtySetIds = new Set(
                (await db.exerciseSets.where('dirty').above(0).primaryKeys())
            );
            const safeSets = data.exerciseSets.filter(s => !dirtySetIds.has(s.id));
            if (safeSets.length > 0) await db.exerciseSets.bulkPut(safeSets);
        }

        await db.syncMeta.put({key: 'lastSync', value: new Date().toISOString()});
    });
}
