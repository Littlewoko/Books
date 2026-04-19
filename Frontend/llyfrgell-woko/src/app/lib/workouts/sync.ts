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

async function remapExerciseSet(localId: number, serverId: number) {
    const s = await db.exerciseSets.get(localId);
    if (!s) return;
    await db.exerciseSets.delete(localId);
    await db.exerciseSets.put({...s, id: serverId, dirty: undefined});
}

export async function flushSyncQueue(): Promise<{ synced: number; failed: number }> {
    let synced = 0;
    let failed = 0;

    try {
        // 1. INSERT new muscle groups (negative IDs)
        const newMgs = await db.muscleGroups.where('id').below(0).toArray();
        for (const mg of newMgs) {
            try {
                const serverId = await createMuscleGroup(mg.name);
                await remapMuscleGroup(mg.id, serverId);
                synced++;
            } catch { failed++; }
        }

        // 2. INSERT new exercises (negative IDs)
        // Re-read after muscle group remaps so muscleGroupId references are current
        const newExercises = await db.exercises.where('id').below(0).toArray();
        for (const ex of newExercises) {
            if (ex.muscleGroupId < 0) { failed++; continue; }
            try {
                const serverId = await createExercise(ex.name, ex.muscleGroupId);
                await remapExercise(ex.id, serverId);
                synced++;
            } catch { failed++; }
        }

        // 3. INSERT new workouts (negative IDs)
        const newWorkouts = await db.workouts.where('id').below(0).toArray();
        for (const w of newWorkouts) {
            try {
                const serverId = await createWorkout(w.date, w.notes ?? undefined);
                await remapWorkout(w.id, serverId);
                synced++;
            } catch { failed++; }
        }

        // 4. INSERT new workout_exercises (negative IDs)
        // Re-read after workout remaps so workoutId references are current
        const newWes = await db.workoutExercises.where('id').below(0).toArray();
        for (const we of newWes) {
            if (we.workoutId < 0 || we.exerciseId < 0) { failed++; continue; }
            try {
                const serverId = await addExerciseToWorkout(we.workoutId, we.exerciseId);
                await remapWorkoutExercise(we.id, serverId);
                synced++;
            } catch { failed++; }
        }

        // 5. INSERT new exercise_sets (negative IDs)
        // Re-read after workout_exercise remaps so workoutExerciseId references are current
        const newSets = await db.exerciseSets.where('id').below(0).toArray();
        for (const s of newSets) {
            if (s.workoutExerciseId < 0) { failed++; continue; }
            try {
                const serverId = await addSet(
                    s.workoutExerciseId, s.weight, s.weightUnit, s.reps,
                    s.notes ?? undefined, s.setType
                );
                await remapExerciseSet(s.id, serverId);
                synced++;
            } catch { failed++; }
        }

        // 6. UPDATE dirty exercise_sets (positive IDs with dirty flag)
        const dirtySets = await db.exerciseSets.where('dirty').above(0).toArray();
        const dirtyUpdates = dirtySets.filter(s => s.id > 0);
        for (const s of dirtyUpdates) {
            try {
                await updateSet(s.id, s.weight, s.weightUnit, s.reps, s.notes ?? undefined, s.setType);
                await db.exerciseSets.update(s.id, {dirty: undefined});
                synced++;
            } catch { failed++; }
        }

        // 7. Process deletions
        const deletions = await db.deletions.toArray();
        for (const d of deletions) {
            try {
                if (d.table === 'workout_exercise') await removeExerciseFromWorkout(d.serverId);
                else if (d.table === 'exercise_set') await deleteSet(d.serverId);
                await db.deletions.delete(d.id!);
                synced++;
            } catch { failed++; }
        }
    } catch {
        // Top-level failure (e.g. auth expired) — don't lose data, just report
        failed++;
    }

    return {synced, failed};
}

export async function getPendingSyncCount(): Promise<number> {
    const [mgs, exercises, workouts, wes, newSets, dirtySets, deletions] = await Promise.all([
        db.muscleGroups.where('id').below(0).count(),
        db.exercises.where('id').below(0).count(),
        db.workouts.where('id').below(0).count(),
        db.workoutExercises.where('id').below(0).count(),
        db.exerciseSets.where('id').below(0).count(),
        db.exerciseSets.where('dirty').above(0).count(),
        db.deletions.count(),
    ]);
    return mgs + exercises + workouts + wes + newSets + dirtySets + deletions;
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

// Auto-sync: flush when online, retry periodically
let syncInterval: ReturnType<typeof setInterval> | null = null;
let syncing = false;

const trySync = async () => {
    if (!navigator.onLine || syncing) return;
    syncing = true;
    try {
        const count = await getPendingSyncCount();
        if (count > 0) {
            await flushSyncQueue();
        }
    } finally {
        syncing = false;
    }
};

const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') trySync();
};

export function startAutoSync() {
    window.addEventListener('online', trySync);
    document.addEventListener('visibilitychange', onVisibilityChange);
    syncInterval = setInterval(trySync, 30000);
    trySync();
}

export function stopAutoSync() {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
    }
    window.removeEventListener('online', trySync);
    document.removeEventListener('visibilitychange', onVisibilityChange);
}

// Call after a local write to sync promptly without waiting for the interval
export function requestSync() {
    setTimeout(trySync, 500);
}
