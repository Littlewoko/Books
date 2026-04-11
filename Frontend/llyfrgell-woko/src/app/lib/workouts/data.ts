import { sql } from "@vercel/postgres";
import {
    MuscleGroup,
    Exercise,
    Workout,
    WorkoutExercise,
    ExerciseSet,
    ExerciseHistory,
    PersonalBest,
} from "./types";

// -- Muscle Groups --

export async function fetchMuscleGroups(userId: string): Promise<MuscleGroup[]> {
    const result = await sql`
        SELECT id, name, user_id FROM muscle_group
        WHERE user_id = ${userId}
        ORDER BY name ASC;
    `;
    return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        userId: row.user_id,
    }));
}

// -- Exercises --

export async function fetchExercises(userId: string): Promise<Exercise[]> {
    const result = await sql`
        SELECT e.id, e.name, e.muscle_group_id, e.user_id, mg.name AS muscle_group_name
        FROM exercise e
        JOIN muscle_group mg ON mg.id = e.muscle_group_id
        WHERE e.user_id = ${userId}
        ORDER BY mg.name ASC, e.name ASC;
    `;
    return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        muscleGroupId: row.muscle_group_id,
        userId: row.user_id,
        muscleGroupName: row.muscle_group_name,
    }));
}

export async function fetchExercisesByMuscleGroup(userId: string, muscleGroupId: number): Promise<Exercise[]> {
    const result = await sql`
        SELECT e.id, e.name, e.muscle_group_id, e.user_id, mg.name AS muscle_group_name
        FROM exercise e
        JOIN muscle_group mg ON mg.id = e.muscle_group_id
        WHERE e.user_id = ${userId} AND e.muscle_group_id = ${muscleGroupId}
        ORDER BY e.name ASC;
    `;
    return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        muscleGroupId: row.muscle_group_id,
        userId: row.user_id,
        muscleGroupName: row.muscle_group_name,
    }));
}

// -- Workouts --

export async function fetchWorkoutByDate(userId: string, date: string): Promise<Workout | null> {
    const result = await sql`
        SELECT id, date, user_id, notes FROM workout
        WHERE user_id = ${userId} AND date = ${date};
    `;
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return { id: row.id, date: new Date(row.date), userId: row.user_id, notes: row.notes };
}

export async function fetchWorkoutDatesForMonth(userId: string, year: number, month: number): Promise<{ date: string; muscleGroups: string[] }[]> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;

    const result = await sql`
        SELECT w.date, ARRAY_AGG(DISTINCT mg.name) AS muscle_groups
        FROM workout w
        JOIN workout_exercise we ON we.workout_id = w.id
        JOIN exercise e ON e.id = we.exercise_id
        JOIN muscle_group mg ON mg.id = e.muscle_group_id
        WHERE w.user_id = ${userId} AND w.date >= ${startDate}::date AND w.date < ${endDate}::date
        GROUP BY w.date
        ORDER BY w.date;
    `;
    return result.rows.map(row => ({
        date: new Date(row.date).toISOString().split('T')[0],
        muscleGroups: row.muscle_groups,
    }));
}

// -- Workout Exercises --

export async function fetchWorkoutExercises(workoutId: number): Promise<WorkoutExercise[]> {
    const result = await sql`
        SELECT we.id, we.workout_id, we.exercise_id, we.sort_order,
               e.name AS exercise_name, mg.name AS muscle_group_name,
               COUNT(es.id)::int AS set_count
        FROM workout_exercise we
        JOIN exercise e ON e.id = we.exercise_id
        JOIN muscle_group mg ON mg.id = e.muscle_group_id
        LEFT JOIN exercise_set es ON es.workout_exercise_id = we.id
        WHERE we.workout_id = ${workoutId}
        GROUP BY we.id, we.workout_id, we.exercise_id, we.sort_order, e.name, mg.name
        ORDER BY we.sort_order ASC;
    `;
    return result.rows.map(row => ({
        id: row.id,
        workoutId: row.workout_id,
        exerciseId: row.exercise_id,
        sortOrder: row.sort_order,
        exerciseName: row.exercise_name,
        muscleGroupName: row.muscle_group_name,
        setCount: row.set_count,
    }));
}

// -- Sets --

export async function fetchSetsForWorkoutExercise(workoutExerciseId: number): Promise<ExerciseSet[]> {
    const result = await sql`
        SELECT id, workout_exercise_id, weight, weight_unit, reps,
               distance, distance_unit, duration, tempo, notes, sort_order
        FROM exercise_set
        WHERE workout_exercise_id = ${workoutExerciseId}
        ORDER BY sort_order ASC;
    `;
    return result.rows.map(row => ({
        id: row.id,
        workoutExerciseId: row.workout_exercise_id,
        weight: row.weight ? parseFloat(row.weight) : null,
        weightUnit: row.weight_unit,
        reps: row.reps,
        distance: row.distance ? parseFloat(row.distance) : null,
        distanceUnit: row.distance_unit,
        duration: row.duration,
        tempo: row.tempo,
        notes: row.notes,
        sortOrder: row.sort_order,
    }));
}

// -- History & PBs --

export async function fetchExerciseHistory(userId: string, exerciseId: number, limit: number = 20): Promise<ExerciseHistory[]> {
    const result = await sql`
        SELECT w.date, es.id, es.weight, es.weight_unit, es.reps,
               es.distance, es.distance_unit, es.duration, es.tempo, es.notes, es.sort_order
        FROM workout w
        JOIN workout_exercise we ON we.workout_id = w.id
        JOIN exercise_set es ON es.workout_exercise_id = we.id
        WHERE w.user_id = ${userId} AND we.exercise_id = ${exerciseId}
        ORDER BY w.date DESC, es.sort_order ASC;
    `;

    const grouped = new Map<string, ExerciseHistory>();
    for (const row of result.rows) {
        const dateKey = new Date(row.date).toISOString().split('T')[0];
        if (!grouped.has(dateKey)) {
            grouped.set(dateKey, { date: new Date(row.date), sets: [] });
        }
        grouped.get(dateKey)!.sets.push({
            id: row.id,
            workoutExerciseId: 0,
            weight: row.weight ? parseFloat(row.weight) : null,
            weightUnit: row.weight_unit,
            reps: row.reps,
            distance: row.distance ? parseFloat(row.distance) : null,
            distanceUnit: row.distance_unit,
            duration: row.duration,
            tempo: row.tempo,
            notes: row.notes,
            sortOrder: row.sort_order,
        });
    }

    const entries = Array.from(grouped.values());
    return limit ? entries.slice(0, limit) : entries;
}

export async function fetchPersonalBests(userId: string, exerciseId: number): Promise<PersonalBest[]> {
    const result = await sql`
        SELECT DISTINCT ON (es.reps) es.reps, es.weight, es.weight_unit, w.date
        FROM exercise_set es
        JOIN workout_exercise we ON we.id = es.workout_exercise_id
        JOIN workout w ON w.id = we.workout_id
        WHERE w.user_id = ${userId} AND we.exercise_id = ${exerciseId}
              AND es.weight IS NOT NULL AND es.reps IS NOT NULL
        ORDER BY es.reps ASC, es.weight DESC, w.date DESC;
    `;
    return result.rows.map(row => ({
        reps: row.reps,
        weight: parseFloat(row.weight),
        weightUnit: row.weight_unit,
        date: new Date(row.date),
    }));
}
