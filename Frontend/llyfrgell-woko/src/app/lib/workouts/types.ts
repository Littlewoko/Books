export type MuscleGroup = {
    id?: number;
    name: string;
    userId: string;
};

export type Exercise = {
    id?: number;
    name: string;
    muscleGroupId: number;
    userId: string;
    muscleGroupName?: string;
};

export type Workout = {
    id?: number;
    date: Date;
    userId: string;
    notes?: string | null;
};

export type WorkoutExercise = {
    id?: number;
    workoutId: number;
    exerciseId: number;
    sortOrder: number;
    exerciseName?: string;
    muscleGroupName?: string;
    setCount?: number;
};

export type ExerciseSet = {
    id?: number;
    workoutExerciseId: number;
    weight?: number | null;
    weightUnit?: string;
    reps?: number | null;
    distance?: number | null;
    distanceUnit?: string | null;
    duration?: number | null;
    tempo?: string | null;
    notes?: string | null;
    sortOrder: number;
};

export type ExerciseHistory = {
    date: Date;
    sets: ExerciseSet[];
};

export type PersonalBest = {
    reps: number;
    weight: number;
    weightUnit: string;
    date: Date;
};
