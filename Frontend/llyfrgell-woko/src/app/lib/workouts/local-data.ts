import {db} from './local-db';
import type {ExerciseHistory, ExerciseSet, PersonalBest, SetType} from './types';

export async function localGetMuscleGroups() {
    return db.muscleGroups.orderBy('name').toArray();
}

export async function localGetExercisesByMuscleGroup(muscleGroupId: number) {
    return db.exercises.where('muscleGroupId').equals(muscleGroupId).sortBy('name');
}

export async function localGetWorkoutDatesForMonth(year: number, month: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endYear = month === 12 ? year + 1 : year;
    const endMonth = month === 12 ? 1 : month + 1;
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

    const workouts = await db.workouts
        .where('date').between(startDate, endDate, true, false)
        .toArray();

    const results: { date: string; muscleGroups: string[] }[] = [];
    for (const w of workouts) {
        const wes = await db.workoutExercises.where('workoutId').equals(w.id).toArray();
        const muscleGroups = [...new Set(wes.map(we => we.muscleGroupName))];
        if (muscleGroups.length > 0) {
            results.push({date: w.date, muscleGroups});
        }
    }
    return results;
}

export async function localGetWorkoutForDate(date: string) {
    const workout = await db.workouts.where('date').equals(date).first();
    if (!workout) return null;
    const exercises = await db.workoutExercises
        .where('workoutId').equals(workout.id)
        .sortBy('sortOrder');
    return {workout, exercises};
}

export async function localGetTodayWorkout() {
    const today = new Date().toISOString().split('T')[0];
    const data = await localGetWorkoutForDate(today);
    return {
        today,
        workoutId: data?.workout.id ?? null,
        exercises: data?.exercises ?? [],
    };
}

export async function localGetSetsForWorkoutExercise(workoutExerciseId: number): Promise<ExerciseSet[]> {
    const sets = await db.exerciseSets
        .where('workoutExerciseId').equals(workoutExerciseId)
        .sortBy('sortOrder');
    return sets.map(s => ({
        id: s.id,
        workoutExerciseId: s.workoutExerciseId,
        weight: s.weight,
        weightUnit: s.weightUnit,
        reps: s.reps,
        distance: s.distance,
        distanceUnit: s.distanceUnit,
        duration: s.duration,
        tempo: s.tempo,
        notes: s.notes,
        sortOrder: s.sortOrder,
        setType: (s.setType || 'working') as SetType,
    }));
}

export async function localGetMovementScreenData(date: string, exerciseId: number) {
    const workout = await db.workouts.where('date').equals(date).first();
    if (!workout) return null;

    const allExercises = await db.workoutExercises
        .where('workoutId').equals(workout.id)
        .sortBy('sortOrder');

    const workoutExercise = allExercises.find(we => we.exerciseId === exerciseId);
    if (!workoutExercise) return null;

    const sets = await localGetSetsForWorkoutExercise(workoutExercise.id);

    return {
        workoutId: workout.id,
        workoutExerciseId: workoutExercise.id,
        exerciseName: workoutExercise.exerciseName,
        muscleGroupName: workoutExercise.muscleGroupName,
        sets,
        allExercises,
    };
}

export async function localGetExerciseHistory(exerciseId: number, limit: number = 20): Promise<ExerciseHistory[]> {
    const wes = await db.workoutExercises.where('exerciseId').equals(exerciseId).toArray();
    const weIds = wes.map(we => we.id);
    const workoutIds = [...new Set(wes.map(we => we.workoutId))];

    const workouts = await db.workouts.where('id').anyOf(workoutIds).toArray();
    const workoutMap = new Map(workouts.map(w => [w.id, w]));

    const allSets = await db.exerciseSets.where('workoutExerciseId').anyOf(weIds).toArray();

    const weToWorkout = new Map(wes.map(we => [we.id, we.workoutId]));

    const grouped = new Map<string, ExerciseSet[]>();
    for (const s of allSets) {
        const workoutId = weToWorkout.get(s.workoutExerciseId);
        if (!workoutId) continue;
        const workout = workoutMap.get(workoutId);
        if (!workout) continue;
        const dateKey = workout.date;
        if (!grouped.has(dateKey)) grouped.set(dateKey, []);
        grouped.get(dateKey)!.push({
            id: s.id,
            workoutExerciseId: s.workoutExerciseId,
            weight: s.weight,
            weightUnit: s.weightUnit,
            reps: s.reps,
            distance: s.distance,
            distanceUnit: s.distanceUnit,
            duration: s.duration,
            tempo: s.tempo,
            notes: s.notes,
            sortOrder: s.sortOrder,
            setType: (s.setType || 'working') as SetType,
        });
    }

    const entries: ExerciseHistory[] = Array.from(grouped.entries())
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([date, sets]) => ({
            date,
            sets: sets.sort((a, b) => a.sortOrder - b.sortOrder),
        }));

    return limit ? entries.slice(0, limit) : entries;
}

export async function localGetPersonalBests(exerciseId: number): Promise<PersonalBest[]> {
    const wes = await db.workoutExercises.where('exerciseId').equals(exerciseId).toArray();
    const weIds = wes.map(we => we.id);
    const allSets = await db.exerciseSets.where('workoutExerciseId').anyOf(weIds).toArray();

    const actualBests = new Map<number, number>();
    for (const s of allSets) {
        if (s.weight == null || s.reps == null) continue;
        const current = actualBests.get(s.reps) ?? 0;
        if (s.weight > current) actualBests.set(s.reps, s.weight);
    }

    if (actualBests.size === 0) return [];

    const maxReps = Math.max(...actualBests.keys());
    const defaultUnit = allSets.find(s => s.weightUnit)?.weightUnit || 'kgs';

    let runningMax = 0;
    const propagated = new Map<number, number>();
    for (let r = maxReps; r >= 1; r--) {
        runningMax = Math.max(runningMax, actualBests.get(r) ?? 0);
        propagated.set(r, runningMax);
    }

    const pbs: PersonalBest[] = [];
    for (let r = 1; r <= maxReps; r++) {
        pbs.push({reps: r, weight: propagated.get(r)!, weightUnit: defaultUnit});
    }
    return pbs;
}

export async function localGetPbSetIds(exerciseId: number): Promise<Set<number>> {
    const wes = await db.workoutExercises.where('exerciseId').equals(exerciseId).toArray();
    const weIds = wes.map(we => we.id);
    const workoutIds = [...new Set(wes.map(we => we.workoutId))];

    const workouts = await db.workouts.where('id').anyOf(workoutIds).toArray();
    const workoutDateMap = new Map(workouts.map(w => [w.id, w.date]));
    const weToWorkout = new Map(wes.map(we => [we.id, we.workoutId]));

    const allSets = await db.exerciseSets.where('workoutExerciseId').anyOf(weIds).toArray();

    const withDate = allSets
        .filter(s => s.weight != null && s.reps != null)
        .map(s => {
            const workoutId = weToWorkout.get(s.workoutExerciseId);
            return { id: s.id, weight: s.weight!, reps: s.reps!, date: workoutId ? workoutDateMap.get(workoutId) || '' : '', sortOrder: s.sortOrder };
        });

    // Step 1: Find the best weight for each rep count across ALL history
    const bestWeightForReps = new Map<number, number>();
    for (const s of withDate) {
        const current = bestWeightForReps.get(s.reps) ?? 0;
        if (s.weight > current) bestWeightForReps.set(s.reps, s.weight);
    }

    // Step 2: Build the Pareto frontier — keep only (reps, weight) pairs
    // that aren't dominated by another pair with >= weight AND >= reps.
    // Sort by reps ascending, then propagate max weight from higher reps down.
    const repsAsc = [...bestWeightForReps.entries()].sort((a, b) => a[0] - b[0]);
    const frontier = new Map<number, number>();
    let maxWeightFromAbove = 0;

    // Walk from highest reps down: the frontier weight at rep R is
    // the actual best at R, but only if it's not beaten by a higher-rep entry
    for (let i = repsAsc.length - 1; i >= 0; i--) {
        const [reps, weight] = repsAsc[i];
        if (weight > maxWeightFromAbove) {
            frontier.set(reps, weight);
        }
        maxWeightFromAbove = Math.max(maxWeightFromAbove, weight);
    }

    // Step 3: Sort chronologically and find the FIRST set matching each frontier point
    const sorted = withDate.sort((a, b) => a.date.localeCompare(b.date) || a.sortOrder - b.sortOrder);

    const claimed = new Set<string>();
    const pbIds = new Set<number>();

    for (const s of sorted) {
        const frontierWeight = frontier.get(s.reps);
        if (frontierWeight === undefined || s.weight !== frontierWeight) continue;
        const key = `${s.reps}-${s.weight}`;
        if (claimed.has(key)) continue;
        claimed.add(key);
        pbIds.add(s.id);
    }

    return pbIds;
}

export async function localGetRecentExercises() {
    const workouts = await db.workouts.orderBy('date').reverse().limit(30).toArray();
    const workoutIds = workouts.map(w => w.id);
    const wes = await db.workoutExercises.where('workoutId').anyOf(workoutIds).toArray();

    const seen = new Set<number>();
    const recents: { id: number; name: string; muscleGroupName: string }[] = [];

    const workoutDateMap = new Map(workouts.map(w => [w.id, w.date]));
    const sorted = wes.sort((a, b) => {
        const da = workoutDateMap.get(a.workoutId) || '';
        const db2 = workoutDateMap.get(b.workoutId) || '';
        return db2.localeCompare(da);
    });

    for (const we of sorted) {
        if (seen.has(we.exerciseId)) continue;
        seen.add(we.exerciseId);
        recents.push({id: we.exerciseId, name: we.exerciseName, muscleGroupName: we.muscleGroupName});
        if (recents.length >= 10) break;
    }
    return recents;
}

export async function localGetWeeklyVolume(weekStart: string, weekEnd: string): Promise<{ muscleGroup: string; sets: number }[]> {
    const workouts = await db.workouts
        .where('date').between(weekStart, weekEnd, true, true)
        .toArray();

    if (workouts.length === 0) return [];

    const workoutIds = workouts.map(w => w.id);
    const wes = await db.workoutExercises.where('workoutId').anyOf(workoutIds).toArray();
    const weIds = wes.map(we => we.id);
    const sets = await db.exerciseSets.where('workoutExerciseId').anyOf(weIds).toArray();

    const weToMg = new Map(wes.map(we => [we.id, we.muscleGroupName]));
    const counts = new Map<string, number>();
    for (const s of sets) {
        if (s.setType === 'warmup') continue;
        const mg = weToMg.get(s.workoutExerciseId);
        if (mg) counts.set(mg, (counts.get(mg) || 0) + 1);
    }

    return Array.from(counts.entries())
        .map(([muscleGroup, sets]) => ({muscleGroup, sets}))
        .sort((a, b) => b.sets - a.sets);
}

export async function localGetDayVolume(date: string): Promise<{ muscleGroup: string; sets: number }[]> {
    const workout = await db.workouts.where('date').equals(date).first();
    if (!workout) return [];

    const wes = await db.workoutExercises.where('workoutId').equals(workout.id).toArray();
    const weIds = wes.map(we => we.id);
    const sets = await db.exerciseSets.where('workoutExerciseId').anyOf(weIds).toArray();

    const weToMg = new Map(wes.map(we => [we.id, we.muscleGroupName]));
    const counts = new Map<string, number>();
    for (const s of sets) {
        if (s.setType === 'warmup') continue;
        const mg = weToMg.get(s.workoutExerciseId);
        if (mg) counts.set(mg, (counts.get(mg) || 0) + 1);
    }

    return Array.from(counts.entries())
        .map(([muscleGroup, sets]) => ({muscleGroup, sets}))
        .sort((a, b) => b.sets - a.sets);
}

export async function localIsHydrated(): Promise<boolean> {
    const meta = await db.syncMeta.get('lastSync');
    return !!meta;
}

export async function localGetSyncMeta(key: string): Promise<string | null> {
    const meta = await db.syncMeta.get(key);
    return meta?.value ?? null;
}

export async function localSetSyncMeta(key: string, value: string) {
    await db.syncMeta.put({ key, value });
}
