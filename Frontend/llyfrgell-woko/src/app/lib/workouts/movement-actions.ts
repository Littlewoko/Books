'use server';

import {
    fetchExerciseHistory,
    fetchPersonalBests,
} from './data';
import { getMovementScreenDataServer } from './server-data';
import { getSessionUserId } from '@/app/utils/getSessionUser';
import ProtectRoute from '@/app/utils/protectRoute';

export async function getMovementScreenData(date: string, exerciseId: number) {
    await ProtectRoute();
    return getMovementScreenDataServer(date, exerciseId);
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
