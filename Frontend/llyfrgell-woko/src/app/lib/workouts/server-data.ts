import { fetchWorkoutByDate, fetchWorkoutExercises, fetchSetsForWorkoutExercise } from './data';
import { getSessionUserId } from '@/app/utils/getSessionUser';

export async function getWorkoutForDateServer(date: string) {
    const userId = await getSessionUserId();
    const workout = await fetchWorkoutByDate(userId, date);
    if (!workout) return null;
    const exercises = await fetchWorkoutExercises(workout.id!);
    return { workout, exercises };
}

export async function getMovementScreenDataServer(date: string, exerciseId: number) {
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
