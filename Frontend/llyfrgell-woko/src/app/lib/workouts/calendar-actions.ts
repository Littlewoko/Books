'use server';

import { fetchWorkoutDatesForMonth, fetchWorkoutByDate, fetchWorkoutExercises } from './data';
import { getSessionUserId } from '@/app/utils/getSessionUser';
import ProtectRoute from '@/app/utils/protectRoute';

export async function getWorkoutDatesForMonth(year: number, month: number) {
    await ProtectRoute();
    const userId = await getSessionUserId();
    return fetchWorkoutDatesForMonth(userId, year, month);
}

export async function getWorkoutForDate(date: string) {
    await ProtectRoute();
    const userId = await getSessionUserId();
    const workout = await fetchWorkoutByDate(userId, date);
    if (!workout) return null;
    const exercises = await fetchWorkoutExercises(workout.id!);
    return { workout, exercises };
}
