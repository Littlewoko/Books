'use server';

import {
    fetchWorkoutByDate,
    fetchWorkoutExercises,
    fetchSetsForWorkoutExercise,
    fetchExerciseHistory,
    fetchPersonalBests,
} from './data';
import { getSessionUserId } from '@/app/utils/getSessionUser';
import ProtectRoute from '@/app/utils/protectRoute';

export async function getMovementScreenData(date: string, exerciseId: number) {
    await ProtectRoute();
    const userId = await getSessionUserId();

    const workout = await fetchWorkoutByDate(userId, date);
    if (!workout || !workout.id) return null;

    const workoutExercises = await fetchWorkoutExercises(workout.id);
    const workoutExercise = workoutExercises.find(we => we.exerciseId === exerciseId);
    if (!workoutExercise || !workoutExercise.id) return null;

    const sets = await fetchSetsForWorkoutExercise(workoutExercise.id);

    return {
        workoutId: workout.id,
        workoutExerciseId: workoutExercise.id,
        exerciseName: workoutExercise.exerciseName || '',
        muscleGroupName: workoutExercise.muscleGroupName || '',
        sets,
        allExercises: workoutExercises,
    };
}

export async function getExerciseHistory(exerciseId: number, limit: number = 20) {
    await ProtectRoute();
    const userId = await getSessionUserId();
    return fetchExerciseHistory(userId, exerciseId, limit);
}

export async function getPersonalBests(exerciseId: number) {
    await ProtectRoute();
    const userId = await getSessionUserId();
    return fetchPersonalBests(userId, exerciseId);
}
