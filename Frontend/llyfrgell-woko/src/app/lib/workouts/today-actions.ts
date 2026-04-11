'use server';

import { fetchWorkoutByDate, fetchWorkoutExercises } from './data';
import { getSessionUserId } from '@/app/utils/getSessionUser';
import ProtectRoute from '@/app/utils/protectRoute';

export async function getTodayWorkout() {
    await ProtectRoute();
    const userId = await getSessionUserId();
    const today = new Date().toISOString().split('T')[0];
    const workout = await fetchWorkoutByDate(userId, today);
    if (!workout || !workout.id) return { today, workoutId: null, exercises: [] };
    const exercises = await fetchWorkoutExercises(workout.id);
    return { today, workoutId: workout.id, exercises };
}
