import {db, nextLocalId} from './local-db';
import type {SetType} from './types';

export async function localCreateMuscleGroup(name: string): Promise<number> {
    const id = await nextLocalId();
    await db.muscleGroups.add({id, name, colour: '#737373'});
    return id;
}

export async function localCreateExercise(name: string, muscleGroupId: number): Promise<number> {
    const mg = await db.muscleGroups.get(muscleGroupId);
    const id = await nextLocalId();
    await db.exercises.add({id, name, muscleGroupId, muscleGroupName: mg?.name || ''});
    return id;
}

export async function localCreateWorkout(date: string, notes?: string): Promise<number> {
    const existing = await db.workouts.where('date').equals(date).first();
    if (existing) return existing.id;

    const id = await nextLocalId();
    await db.workouts.add({id, date, notes: notes || null});
    return id;
}

export async function localAddExerciseToWorkout(workoutId: number, exerciseId: number): Promise<number> {
    const existing = await db.workoutExercises.where('workoutId').equals(workoutId).toArray();
    const nextOrder = existing.length > 0 ? Math.max(...existing.map(e => e.sortOrder)) + 1 : 0;

    const exercise = await db.exercises.get(exerciseId);
    const id = await nextLocalId();

    await db.workoutExercises.add({
        id,
        workoutId,
        exerciseId,
        sortOrder: nextOrder,
        exerciseName: exercise?.name || '',
        muscleGroupName: exercise?.muscleGroupName || '',
        setCount: 0,
    });
    return id;
}

export async function localRemoveExerciseFromWorkout(workoutExerciseId: number) {
    const sets = await db.exerciseSets.where('workoutExerciseId').equals(workoutExerciseId).toArray();
    // Record deletions for server-synced records (positive IDs)
    for (const s of sets) {
        if (s.id > 0) await db.deletions.add({table: 'exercise_set', serverId: s.id});
    }
    await db.exerciseSets.bulkDelete(sets.map(s => s.id));

    if (workoutExerciseId > 0) {
        await db.deletions.add({table: 'workout_exercise', serverId: workoutExerciseId});
    }
    await db.workoutExercises.delete(workoutExerciseId);
}

export async function localAddSet(
    workoutExerciseId: number,
    weight: number | null,
    weightUnit: string,
    reps: number | null,
    notes?: string,
    setType: SetType = 'working'
): Promise<number> {
    const existing = await db.exerciseSets.where('workoutExerciseId').equals(workoutExerciseId).toArray();
    const nextOrder = existing.length > 0 ? Math.max(...existing.map(s => s.sortOrder)) + 1 : 0;

    const id = await nextLocalId();
    await db.exerciseSets.add({
        id,
        workoutExerciseId,
        weight,
        weightUnit,
        reps,
        distance: null,
        distanceUnit: null,
        duration: null,
        tempo: null,
        notes: notes || null,
        sortOrder: nextOrder,
        setType,
        dirty: Date.now(),
    });

    const we = await db.workoutExercises.get(workoutExerciseId);
    if (we) await db.workoutExercises.update(workoutExerciseId, {setCount: we.setCount + 1});

    return id;
}

export async function localUpdateSet(
    setId: number,
    weight: number | null,
    weightUnit: string,
    reps: number | null,
    notes?: string,
    setType: SetType = 'working'
) {
    await db.exerciseSets.update(setId, {weight, weightUnit, reps, notes: notes || null, setType, dirty: Date.now()});
}

export async function localDeleteSet(setId: number) {
    const set = await db.exerciseSets.get(setId);
    if (!set) return;

    if (setId > 0) {
        await db.deletions.add({table: 'exercise_set', serverId: setId});
    }
    await db.exerciseSets.delete(setId);

    const we = await db.workoutExercises.get(set.workoutExerciseId);
    if (we) await db.workoutExercises.update(set.workoutExerciseId, {setCount: Math.max(0, we.setCount - 1)});
}

export async function localCopyMovementsToToday(exerciseIds: number[]): Promise<{ added: number; today: string }> {
    const today = new Date().toISOString().split('T')[0];
    const workoutId = await localCreateWorkout(today);

    const existing = await db.workoutExercises.where('workoutId').equals(workoutId).toArray();
    const existingExerciseIds = new Set(existing.map(e => e.exerciseId));

    let added = 0;
    for (const exerciseId of exerciseIds) {
        if (existingExerciseIds.has(exerciseId)) continue;
        await localAddExerciseToWorkout(workoutId, exerciseId);
        added++;
    }

    return {added, today};
}
