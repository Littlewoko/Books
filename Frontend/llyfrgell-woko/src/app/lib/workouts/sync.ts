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
} from './actions';

// Resolve a potentially-local ID to a server ID
async function resolveId(table: string, localId: number): Promise<number> {
    if (localId > 0) return localId; // already a server ID
    const mapping = await db.idMap.where({table, localId}).first();
    if (!mapping) throw new Error(`No server ID for ${table}:${localId}`);
    return mapping.serverId;
}

// Store a local→server ID mapping and update all local references
async function mapId(table: string, localId: number, serverId: number) {
    await db.idMap.add({table, localId, serverId});

    if (table === 'muscle_group') {
        const mg = await db.muscleGroups.get(localId);
        if (mg) {
            await db.muscleGroups.delete(localId);
            await db.muscleGroups.put({...mg, id: serverId});
        }
        // Update exercises referencing this muscle group
        const exercises = await db.exercises.where('muscleGroupId').equals(localId).toArray();
        for (const ex of exercises) {
            await db.exercises.update(ex.id, {muscleGroupId: serverId});
        }
    } else if (table === 'exercise') {
        const ex = await db.exercises.get(localId);
        if (ex) {
            await db.exercises.delete(localId);
            await db.exercises.put({...ex, id: serverId});
        }
        // Update workout_exercises referencing this exercise
        const wes = await db.workoutExercises.where('exerciseId').equals(localId).toArray();
        for (const we of wes) {
            await db.workoutExercises.update(we.id, {exerciseId: serverId});
        }
    } else if (table === 'workout') {
        const w = await db.workouts.get(localId);
        if (w) {
            await db.workouts.delete(localId);
            await db.workouts.put({...w, id: serverId});
        }
        // Update workout_exercises referencing this workout
        const wes = await db.workoutExercises.where('workoutId').equals(localId).toArray();
        for (const we of wes) {
            await db.workoutExercises.update(we.id, {workoutId: serverId});
        }
    } else if (table === 'workout_exercise') {
        const we = await db.workoutExercises.get(localId);
        if (we) {
            await db.workoutExercises.delete(localId);
            await db.workoutExercises.put({...we, id: serverId});
        }
        // Update exercise_sets referencing this workout_exercise
        const sets = await db.exerciseSets.where('workoutExerciseId').equals(localId).toArray();
        for (const s of sets) {
            await db.exerciseSets.update(s.id, {workoutExerciseId: serverId});
        }
    } else if (table === 'exercise_set') {
        const s = await db.exerciseSets.get(localId);
        if (s) {
            await db.exerciseSets.delete(localId);
            await db.exerciseSets.put({...s, id: serverId});
        }
    }
}

// Process order: parent tables first
const TABLE_ORDER = ['muscle_group', 'exercise', 'workout', 'workout_exercise', 'exercise_set'];

export async function flushSyncQueue(): Promise<{ synced: number; failed: number }> {
    let synced = 0;
    let failed = 0;

    // Process in dependency order
    for (const table of TABLE_ORDER) {
        const items = await db.syncQueue
            .where('status').equals('pending')
            .filter(item => item.table === table)
            .sortBy('createdAt');

        for (const item of items) {
            try {
                await db.syncQueue.update(item.localId!, {status: 'processing'});
                await processItem(item.action, item.table, item.recordId, item.payload);
                await db.syncQueue.delete(item.localId!);
                // Clear dirty flag after successful sync
                if (item.table === 'exercise_set' && item.action !== 'DELETE') {
                    // After INSERT, mapId remaps the ID, so look up the server ID
                    const resolvedId = item.recordId < 0
                        ? (await db.idMap.where({table: 'exercise_set', localId: item.recordId}).first())?.serverId
                        : item.recordId;
                    if (resolvedId) await db.exerciseSets.update(resolvedId, {dirty: undefined});
                }
                synced++;
            } catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                await db.syncQueue.update(item.localId!, {status: 'failed', error: msg});
                failed++;
            }
        }
    }

    return {synced, failed};
}

async function processItem(action: string, table: string, recordId: number, payload: Record<string, unknown>) {
    if (action === 'INSERT') {
        let serverId: number;
        switch (table) {
            case 'muscle_group':
                serverId = await createMuscleGroup(payload.name as string);
                await mapId(table, recordId, serverId);
                break;
            case 'exercise':
                serverId = await createExercise(
                    payload.name as string,
                    await resolveId('muscle_group', payload.muscleGroupId as number)
                );
                await mapId(table, recordId, serverId);
                break;
            case 'workout':
                serverId = await createWorkout(payload.date as string, payload.notes as string | undefined);
                await mapId(table, recordId, serverId);
                break;
            case 'workout_exercise':
                serverId = await addExerciseToWorkout(
                    await resolveId('workout', payload.workoutId as number),
                    await resolveId('exercise', payload.exerciseId as number)
                );
                await mapId(table, recordId, serverId);
                break;
            case 'exercise_set':
                serverId = await addSet(
                    await resolveId('workout_exercise', payload.workoutExerciseId as number),
                    payload.weight as number | null,
                    payload.weightUnit as string,
                    payload.reps as number | null,
                    payload.notes as string | undefined,
                    payload.setType as string | undefined
                );
                await mapId(table, recordId, serverId);
                break;
        }
    } else if (action === 'UPDATE') {
        const serverId = await resolveId(table, recordId);
        switch (table) {
            case 'exercise_set':
                await updateSet(
                    serverId,
                    payload.weight as number | null,
                    payload.weightUnit as string,
                    payload.reps as number | null,
                    payload.notes as string | undefined,
                    payload.setType as string | undefined
                );
                break;
        }
    } else if (action === 'DELETE') {
        // For deletes, the record might already have a server ID or be local-only
        const mapping = await db.idMap.where({table, localId: recordId}).first();
        if (!mapping && recordId < 0) {
            // Never synced to server, nothing to delete remotely
            return;
        }
        const serverId = mapping ? mapping.serverId : recordId;
        switch (table) {
            case 'workout_exercise':
                await removeExerciseFromWorkout(serverId);
                break;
            case 'exercise_set':
                await deleteSet(serverId);
                break;
        }
    }
}

export async function getPendingSyncCount(): Promise<number> {
    return db.syncQueue.where('status').anyOf('pending', 'failed').count();
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
    await db.transaction('rw', [db.muscleGroups, db.exercises, db.workouts, db.workoutExercises, db.exerciseSets, db.idMap, db.syncQueue, db.syncMeta], async () => {
        if (isFirstChunk) {
            await db.muscleGroups.clear();
            await db.exercises.clear();
            await db.workouts.clear();
            await db.workoutExercises.clear();
            await db.exerciseSets.clear();
            if (clearSyncData) {
                await db.idMap.clear();
                await db.syncQueue.clear();
            }
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

// Auto-sync: flush queue when online, retry periodically
let syncInterval: ReturnType<typeof setInterval> | null = null;

export function startAutoSync() {
    const trySync = async () => {
        if (!navigator.onLine) return;
        const count = await getPendingSyncCount();
        if (count > 0) {
            await flushSyncQueue();
        }
    };

    window.addEventListener('online', trySync);
    syncInterval = setInterval(trySync, 30000);
    trySync(); // immediate attempt
}

export function stopAutoSync() {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
    }
}
