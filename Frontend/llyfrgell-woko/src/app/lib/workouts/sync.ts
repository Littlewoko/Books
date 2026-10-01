import {db} from './local-db';
import {
    deleteSet,
    removeExerciseFromWorkout,
    updateSet,
    updateWorkoutExerciseSortOrder,
} from './actions';
import {pushWorkoutBatch, resolveWorkoutPermanentIds} from './permanent-id-sync';

interface PermanentIdMapping {
    localPermanentId: string;
    permanentId: string;
    serverId: number;
}

function hasPermanentId<T extends {permanentId?: string}>(
    record: T,
): record is T & {permanentId: string} {
    return typeof record.permanentId === 'string' && record.permanentId.length > 0;
}

// Remap a record's ID in IndexedDB: delete old, insert with new ID, update child references
async function remapMuscleGroup(localId: number, serverId: number, permanentId: string) {
    const mg = await db.muscleGroups.get(localId);
    if (!mg) return;
    await db.muscleGroups.delete(localId);
    await db.muscleGroups.put({...mg, id: serverId, permanentId});
    const exercises = await db.exercises.where('muscleGroupId').equals(localId).toArray();
    for (const ex of exercises) {
        await db.exercises.update(ex.id, {muscleGroupId: serverId});
    }
}

async function remapExercise(localId: number, serverId: number, permanentId: string) {
    const ex = await db.exercises.get(localId);
    if (!ex) return;
    await db.exercises.delete(localId);
    await db.exercises.put({...ex, id: serverId, permanentId});
    const wes = await db.workoutExercises.where('exerciseId').equals(localId).toArray();
    for (const we of wes) {
        await db.workoutExercises.update(we.id, {exerciseId: serverId});
    }
}

async function remapWorkout(localId: number, serverId: number, permanentId: string) {
    const w = await db.workouts.get(localId);
    if (!w) return;
    await db.workouts.delete(localId);
    await db.workouts.put({...w, id: serverId, permanentId});
    const wes = await db.workoutExercises.where('workoutId').equals(localId).toArray();
    for (const we of wes) {
        await db.workoutExercises.update(we.id, {workoutId: serverId});
    }
}

async function remapWorkoutExercise(localId: number, serverId: number, permanentId: string) {
    const we = await db.workoutExercises.get(localId);
    if (!we) return;
    await db.workoutExercises.delete(localId);
    await db.workoutExercises.put({...we, id: serverId, permanentId});
    const sets = await db.exerciseSets.where('workoutExerciseId').equals(localId).toArray();
    for (const s of sets) {
        await db.exerciseSets.update(s.id, {workoutExerciseId: serverId});
    }
}

async function remapExerciseSet(
    localId: number,
    serverId: number,
    permanentId: string,
    syncedDirty?: number,
) {
    const s = await db.exerciseSets.get(localId);
    if (!s) return;

    const dirty = s.dirty === syncedDirty ? undefined : s.dirty;
    await db.exerciseSets.delete(localId);
    await db.exerciseSets.put({...s, id: serverId, permanentId, dirty});
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

async function syncResolvedRecords<T extends {id: number; permanentId: string}>(
    records: readonly T[],
    mappings: readonly PermanentIdMapping[],
    remap: (record: T, mapping: PermanentIdMapping) => Promise<void>,
): Promise<{synced: number; failed: number}> {
    const recordsByPermanentId = new Map(records.map(record => [record.permanentId, record]));
    const completed = new Set<string>();
    let synced = 0;

    for (const mapping of mappings) {
        const record = recordsByPermanentId.get(mapping.localPermanentId);
        if (!record || completed.has(mapping.localPermanentId)) continue;
        try {
            await remap(record, mapping);
            completed.add(mapping.localPermanentId);
            synced++;
        } catch {
            // Leave failed records local so a later push can reconcile them again.
        }
    }

    return {synced, failed: records.length - completed.size};
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
        const [newMgs, newExercises, newWorkouts, newWes, newSets] = await Promise.all([
            db.muscleGroups.where('id').below(0).toArray(),
            db.exercises.where('id').below(0).toArray(),
            db.workouts.where('id').below(0).toArray(),
            db.workoutExercises.where('id').below(0).toArray(),
            db.exerciseSets.where('id').below(0).toArray(),
        ]);
        const mgsToSync = newMgs.filter(hasPermanentId);
        const workoutsToRemap = newWorkouts.filter(hasPermanentId);
        failed += newMgs.length - mgsToSync.length;
        failed += newWorkouts.length - workoutsToRemap.length;

        const batch: Parameters<typeof pushWorkoutBatch>[0] = {
            muscleGroups: mgsToSync.map(record => ({
                permanentId: record.permanentId,
                name: record.name,
            })),
            exercises: [],
            workouts: workoutsToRemap.map(record => ({
                permanentId: record.permanentId,
                date: record.date,
                notes: record.notes ?? null,
            })),
            workoutExercises: [],
            sets: [],
        };
        const exercisesToRemap: (typeof newExercises[number] & {permanentId: string})[] = [];
        const workoutExercisesToRemap: (typeof newWes[number] & {permanentId: string})[] = [];
        const setsToRemap: (typeof newSets[number] & {permanentId: string})[] = [];

        for (const exercise of newExercises) {
            if (!hasPermanentId(exercise)) {
                failed++;
                continue;
            }
            const muscleGroup = await db.muscleGroups.get(exercise.muscleGroupId);
            if (!muscleGroup || !hasPermanentId(muscleGroup)) {
                failed++;
                continue;
            }
            batch.exercises.push({
                permanentId: exercise.permanentId,
                name: exercise.name,
                muscleGroupPermanentId: muscleGroup.permanentId,
            });
            exercisesToRemap.push(exercise);
        }

        for (const workoutExercise of newWes) {
            if (!hasPermanentId(workoutExercise)) {
                failed++;
                continue;
            }
            const [workout, exercise] = await Promise.all([
                db.workouts.get(workoutExercise.workoutId),
                db.exercises.get(workoutExercise.exerciseId),
            ]);
            if (!workout || !hasPermanentId(workout) || !exercise || !hasPermanentId(exercise)) {
                failed++;
                continue;
            }
            batch.workoutExercises.push({
                permanentId: workoutExercise.permanentId,
                workoutPermanentId: workout.permanentId,
                exercisePermanentId: exercise.permanentId,
                sortOrder: workoutExercise.sortOrder,
            });
            workoutExercisesToRemap.push(workoutExercise);
        }

        for (const set of newSets) {
            if (!hasPermanentId(set)) {
                failed++;
                continue;
            }
            const workoutExercise = await db.workoutExercises.get(set.workoutExerciseId);
            if (!workoutExercise || !hasPermanentId(workoutExercise)) {
                failed++;
                continue;
            }
            batch.sets.push({
                permanentId: set.permanentId,
                workoutExercisePermanentId: workoutExercise.permanentId,
                weight: set.weight,
                weightUnit: set.weightUnit,
                reps: set.reps,
                distance: set.distance,
                distanceUnit: set.distanceUnit,
                duration: set.duration,
                tempo: set.tempo,
                notes: set.notes,
                sortOrder: set.sortOrder,
                setType: set.setType,
            });
            setsToRemap.push(set);
        }

        const batchCount = batch.muscleGroups.length + batch.exercises.length + batch.workouts.length
            + batch.workoutExercises.length + batch.sets.length;
        if (batchCount > 0) {
            try {
                await pushWorkoutBatch(batch);
            } catch {
                // Resolve partial inserts below; uninserted records remain pending for retry.
            }

            const mappings = await resolveWorkoutPermanentIds(batch);
            const mgResult = await syncResolvedRecords(mgsToSync, mappings.muscleGroups,
                (record, mapping) => remapMuscleGroup(record.id, mapping.serverId, mapping.permanentId));
            const exerciseResult = await syncResolvedRecords(exercisesToRemap, mappings.exercises,
                (record, mapping) => remapExercise(record.id, mapping.serverId, mapping.permanentId));
            const workoutResult = await syncResolvedRecords(workoutsToRemap, mappings.workouts,
                (record, mapping) => remapWorkout(record.id, mapping.serverId, mapping.permanentId));
            const workoutExerciseResult = await syncResolvedRecords(workoutExercisesToRemap, mappings.workoutExercises,
                (record, mapping) => remapWorkoutExercise(record.id, mapping.serverId, mapping.permanentId));
            const setResult = await syncResolvedRecords(setsToRemap, mappings.sets,
                (record, mapping) => remapExerciseSet(record.id, mapping.serverId, mapping.permanentId, record.dirty));

            synced += mgResult.synced + exerciseResult.synced + workoutResult.synced
                + workoutExerciseResult.synced + setResult.synced;
            failed += mgResult.failed + exerciseResult.failed + workoutResult.failed
                + workoutExerciseResult.failed + setResult.failed;
        }

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
    muscleGroups: { id: number; permanentId: string; name: string; colour: string }[];
    exercises: { id: number; permanentId: string; name: string; muscleGroupId: number; muscleGroupName: string }[];
    workouts: { id: number; permanentId: string; date: string; notes?: string | null }[];
    workoutExercises: {
        id: number;
        permanentId: string;
        workoutId: number;
        exerciseId: number;
        sortOrder: number;
        exerciseName: string;
        muscleGroupName: string;
        setCount: number
    }[];
    exerciseSets: {
        id: number;
        permanentId: string;
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
