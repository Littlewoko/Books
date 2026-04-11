'use server';

import { fetchWorkoutDatesForMonth } from './data';
import { getSessionUserId } from '@/app/utils/getSessionUser';
import ProtectRoute from '@/app/utils/protectRoute';

export async function getWorkoutDatesForMonth(year: number, month: number) {
    await ProtectRoute();
    const userId = await getSessionUserId();
    return fetchWorkoutDatesForMonth(userId, year, month);
}
