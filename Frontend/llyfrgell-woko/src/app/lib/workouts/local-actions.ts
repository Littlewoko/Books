import {db, nextLocalId} from './local-db';

async function enqueue(action: 'INSERT' | 'UPDATE' | 'DELETE', table: string, recordId: number, payload: Record<string, unknown>) {
    await db.syncQueue.add({
        action,
        table,
        recordId,
        payload,
        createdAt: Date.now(),
        status: 'pending',
    });
}

export async function localCreateMuscleGroup(name: string): Promise<number> {
    const id = nextLocalId();
    await db.muscleGroups.add({id, name});
    await enqueue('INSERT', 'muscle_group', id, {name});
    return id;
}

export async function localCreateExercise(name: string, muscleGroupId: number): Promise<number> {
    const mg = await db.muscleGroups.get(muscleGroupId);
    const id = nextLocalId();
    await db.exercises.add({id, name, muscleGroupId, muscleGroupName: mg?.name || ''});
    await enqueue('INSERT', 'exercise', id, {name, muscleGroupId});
    return id;
}

export async function localCreateWorkout(date: string, notes?: string): Promise<number> {
    const existing = await db.workouts.where('date').equals(date).first();
    if (existing) return existing.id;

    const id = nextLocalId();
    await db.workouts.add({id, date, notes: notes || null});
    await enqueue('INSERT', 'workout', id, {date, notes: notes || null});
    return id;
}

export async function localAddExerciseToWorkout(workoutId: number, exerciseId: number): Promise<number> {
    const existing = await db.workoutExercises.where('workoutId').equals(workoutId).toArray();
    const nextOrder = existing.length > 0 ? Math.max(...existing.map(e => e.sortOrder)) + 1 : 0;

    const exercise = await db.exercises.get(exerciseId);
    const id = nextLocalId();

    await db.workoutExercises.add({
        id,
        workoutId,
        exerciseId,
        sortOrder: nextOrder,
        exerciseName: exercise?.name || '',
        muscleGroupName: exercise?.muscleGroupName || '',
        setCount: 0,
    });
    await enqueue('INSERT', 'workout_exercise', id, {workoutId, exerciseId, sortOrder: nextOrder});
    return id;
}

export async function localRemoveExerciseFromWorkout(workoutExerciseId: number) {
    const sets = await db.exerciseSets.where('workoutExerciseId').equals(workoutExerciseId).toArray();
    await db.exerciseSets.bulkDelete(sets.map(s => s.id));
    await db.workoutExercises.delete(workoutExerciseId);
    await enqueue('DELETE', 'workout_exercise', workoutExerciseId, {});
}

export async function localAddSet(
    workoutExerciseId: number,
    weight: number | null,
    weightUnit: string,
    reps: number | null,
    notes?: string
): Promise<number> {
    const existing = await db.exerciseSets.where('workoutExerciseId').equals(workoutExerciseId).toArray();
    const nextOrder = existing.length > 0 ? Math.max(...existing.map(s => s.sortOrder)) + 1 : 0;

    const id = nextLocalId();
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
    });

    // Update set count
    const we = await db.workoutExercises.get(workoutExerciseId);
    if (we) await db.workoutExercises.update(workoutExerciseId, {setCount: we.setCount + 1});

    await enqueue('INSERT', 'exercise_set', id, {
        workoutExerciseId,
        weight,
        weightUnit,
        reps,
        notes: notes || null,
        sortOrder: nextOrder
    });
    return id;
}

export async function localUpdateSet(
    setId: number,
    weight: number | null,
    weightUnit: string,
    reps: number | null,
    notes?: string
) {
    await db.exerciseSets.update(setId, {weight, weightUnit, reps, notes: notes || null});
    await enqueue('UPDATE', 'exercise_set', setId, {weight, weightUnit, reps, notes: notes || null});
}

export async function localDeleteSet(setId: number) {
    const set = await db.exerciseSets.get(setId);
    if (!set) return;

    await db.exerciseSets.delete(setId);

    const we = await db.workoutExercises.get(set.workoutExerciseId);
    if (we) await db.workoutExercises.update(set.workoutExerciseId, {setCount: Math.max(0, we.setCount - 1)});

    await enqueue('DELETE', 'exercise_set', setId, {});
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
